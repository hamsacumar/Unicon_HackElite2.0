import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import Icon from "@expo/vector-icons/Ionicons";
import { useNavigation, useRoute } from "@react-navigation/native";
import * as SecureStore from "expo-secure-store";
import { verifyEmail, resendCode } from "../../services/api";
import Toast from "react-native-toast-message";
import CustomButton from "../../component/ui/CustomButton";
import {
  colors,
  spacing,
  borderRadius,
  fontSize,
  globalStyles,
} from "../../styles/globalStyles";

interface VerifyCodeParams {
  email: string;
  userId?: string;
  purpose?: "signup" | "reset-password";
}

const VerifyCodeScreen = () => {
  const route = useRoute();
  const {
    email,
    userId,
    purpose = "signup",
  } = route.params as VerifyCodeParams;
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [countdown, setCountdown] = useState(0);
  const [isResending, setIsResending] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigation = useNavigation<any>();
  const inputs = useRef<(TextInput | null)[]>([]);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  // Handle countdown timer
  useEffect(() => {
    if (countdown > 0) {
      countdownRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            if (countdownRef.current) {
              clearInterval(countdownRef.current);
              countdownRef.current = null;
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
        countdownRef.current = null;
      }
    };
  }, [countdown]);

  const handleChange = (text: string, index: number) => {
    // Only allow numbers
    const numericValue = text.replace(/[^0-9]/g, "");
    if (numericValue === "" && text !== "") return;

    const newCode = [...code];
    newCode[index] = numericValue.slice(-1); // Only take the last character if multiple entered
    setCode(newCode);

    // Auto-submit if last digit is entered
    if (numericValue && index === 5) {
      handleSubmit();
      return;
    }

    // Move to next input
    if (numericValue && index < 5) {
      inputs.current[index + 1]?.focus();
    }

    // Clear error when user starts typing
    if (error) setError("");
  };

  const handleSubmit = async () => {
    const fullCode = code.join("");
    if (fullCode.length < 6) {
      setError("Please enter the full 6-digit code");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      if (purpose === "signup") {
        console.log("Verifying email with code...");
        const response = await verifyEmail(email, fullCode);

        if (response.Message && response.Message.includes("verified")) {
          Toast.show({
            type: "success",
            text1: "Email verified successfully!",
            text2: "Your account is now active.",
            visibilityTime: 3000,
          });

          const token = response.Token || response.token;
          if (token) {
            await SecureStore.setItemAsync("accessToken", token);
          }

          navigation.navigate("ClassifyAccount", {
            email: response.Email || response.email || email,
            userId: response.UserId || response.userId || userId,
            token: token,
            message: "Please complete your profile information.",
          });
        } else {
          console.log("Verification successful but no token received");
          Toast.show({
            type: "info",
            text1: "Email verified!",
            text2: "Please complete your profile.",
            visibilityTime: 3000,
          });

          navigation.navigate("ClassifyAccount", {
            email: response.Email || response.email || email,
            userId: response.UserId || response.userId || userId,
            message: "Please complete your profile information.",
          });
        }
      } else {
        navigation.navigate("ResetPassword", {
          email,
          code: fullCode,
        });
      }
    } catch (err) {
      console.error("Verification error:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Code is incorrect or has expired";
      setError(errorMessage);

      setCode(["", "", "", "", "", ""]);
      inputs.current[0]?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (countdown > 0) {
      const minutes = Math.floor(countdown / 60);
      const seconds = countdown % 60;
      const timeLeft = `${minutes > 0 ? `${minutes}m ` : ""}${seconds}s`;

      Toast.show({
        type: "info",
        text1: "Please wait",
        text2: `You can request a new code in ${timeLeft}.`,
        visibilityTime: 3000,
      });
      return;
    }

    try {
      setIsResending(true);

      Toast.show({
        type: "info",
        text1: "Sending code...",
        visibilityTime: 1000,
      });

      await new Promise((resolve) => setTimeout(resolve, 1000));

      try {
        const response = await resendCode(email, purpose);
        setCountdown(120);

        const successMessage =
          purpose === "reset-password"
            ? "If an account exists with this email, a reset code has been sent."
            : "Verification code sent! Please check your email.";

        Toast.show({
          type: "success",
          text1: "Success",
          text2: successMessage,
          visibilityTime: 4000,
        });
      } catch (error) {
        console.error("Resend error:", error);

        const errorMessage =
          error instanceof Error ? error.message : "Failed to resend code";

        Toast.show({
          type: "error",
          text1: "Error",
          text2: errorMessage,
          visibilityTime: 4000,
        });

        if (errorMessage.includes("already verified")) {
          setTimeout(() => {
            navigation.navigate("Login");
          }, 2000);
        }
      }
    } catch (error) {
      console.error("Resend error:", error);

      const errorMessage =
        error instanceof Error ? error.message : "Please try again later.";

      if (errorMessage.includes("2 minutes") || errorMessage.includes("Wait")) {
        setCountdown(120);

        Toast.show({
          type: "error",
          text1: "Too soon!",
          text2: "Please wait 2 minutes before requesting another code.",
          visibilityTime: 4000,
        });
      } else {
        Toast.show({
          type: "error",
          text1: "Failed to resend code",
          text2: errorMessage,
          visibilityTime: 4000,
        });
      }
    } finally {
      setIsResending(false);
    }
  };

  const formatEmail = (email: string) => {
    const [localPart, domain] = email.split("@");
    if (localPart.length <= 3) return email;
    return `${localPart.slice(0, 2)}***@${domain}`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Icon name="lock-closed" size={40} color={colors.white} />
      </View>

      <Text style={styles.title}>Verification Code</Text>
      <Text style={styles.subtitle}>
        We've sent a 6-digit code to{"\n"}
        <Text style={styles.emailText}>{formatEmail(email)}</Text>
      </Text>

      <View style={styles.otpContainer}>
        {code.map((digit, index) => (
          <TextInput
            key={index}
            style={[
              styles.otpInput,
              digit && styles.otpInputFilled,
              error && styles.otpInputError,
            ]}
            value={digit}
            onChangeText={(text) => handleChange(text, index)}
            onKeyPress={({ nativeEvent }) => {
              if (nativeEvent.key === "Backspace" && !digit && index > 0) {
                inputs.current[index - 1]?.focus();
              }
            }}
            keyboardType="number-pad"
            maxLength={1}
            ref={(ref) => {
              inputs.current[index] = ref;
            }}
            textAlign="center"
            selectTextOnFocus
            editable={!isLoading}
            selectionColor={colors.primary}
          />
        ))}
      </View>

      {error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : (
        <Text style={styles.hintText}>
          Enter the 6-digit code sent to your email
        </Text>
      )}

      <CustomButton
        title={isLoading ? "Verifying..." : "Submit"}
        onPress={handleSubmit}
        loading={isLoading}
        style={styles.submitButton}
      />

      <View style={styles.resendContainer}>
        <Text style={styles.resendText}>Didn't receive the code? </Text>
        <TouchableOpacity
          onPress={handleResendCode}
          disabled={countdown > 0 || isResending}
        >
          <Text
            style={[
              styles.resendLink,
              (countdown > 0 || isResending) && styles.resendLinkDisabled,
            ]}
          >
            {isResending
              ? "Resend"
              : countdown > 0
                ? `Resend (${countdown}s)`
                : "Resend"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing.xl,
    backgroundColor: colors.white,
  },
  iconContainer: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.round,
    width: 80,
    height: 80,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: fontSize.title,
    fontWeight: "bold",
    color: colors.black,
    textAlign: "center",
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: fontSize.md,
    color: colors.gray,
    textAlign: "center",
    marginBottom: spacing.xxl,
    lineHeight: 20,
  },
  emailText: {
    fontWeight: "600",
    color: colors.black,
  },
  otpContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "85%",
    marginBottom: spacing.lg,
  },
  otpInput: {
    width: 45,
    height: 55,
    borderWidth: 1,
    borderColor: colors.borderGray,
    backgroundColor: colors.inputBackground,
    borderRadius: borderRadius.md,
    fontSize: fontSize.xl,
    fontWeight: "600",
    color: colors.black,
    textAlign: "center",
  },
  otpInputFilled: {
    borderColor: colors.primary,
    backgroundColor: colors.white,
  },
  otpInputError: {
    borderColor: colors.error,
  },
  errorText: {
    color: colors.error,
    backgroundColor: colors.errorBackground,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.lg,
    textAlign: "center",
    fontSize: fontSize.md,
  },
  hintText: {
    color: colors.gray,
    marginBottom: spacing.xl,
    textAlign: "center",
    fontSize: fontSize.md,
  },
  submitButton: {
    width: "100%",
    marginBottom: spacing.lg,
  },
  resendContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacing.sm,
  },
  resendText: {
    color: colors.gray,
    fontSize: fontSize.md,
  },
  resendLink: {
    color: colors.primary,
    fontWeight: "600",
    fontSize: fontSize.md,
  },
  resendLinkDisabled: {
    color: colors.lightGray,
  },
});

export default VerifyCodeScreen;
