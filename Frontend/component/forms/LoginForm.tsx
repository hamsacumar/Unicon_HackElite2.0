import React, { useState, useContext } from "react";
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  KeyboardAvoidingView, 
  ScrollView, 
  Platform 
} from "react-native";
import CustomInput from "../ui/CustomInput";
import PasswordInput from "../ui/PasswordInput";
import CustomButton from "../ui/CustomButton";
import ErrorMessage from "../ui/ErrorMessage";
import { colors, spacing, globalStyles } from "../../styles/globalStyles";
import { login } from "../../services/api";
import { AuthContext } from "../../utils/AuthContext";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface LoginFormProps {
  onForgotPassword: () => void;
  onSignupNavigation: () => void;
  onVerifyEmail: (email: string, userId: string) => void;
  onLoginSuccess?: (userId: string, accesstoken: string) => void;
}

const LoginForm: React.FC<LoginFormProps> = ({
  onForgotPassword,
  onSignupNavigation,
  onVerifyEmail,
  onLoginSuccess,
}) => {
  const [usernameOrEmail, setUsernameOrEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const authContext = useContext(AuthContext);
  if (!authContext) throw new Error("AuthContext is undefined.");
  const { login: authLogin } = authContext;

  const handleLogin = async () => {
    const trimmedUsername = usernameOrEmail.trim();
    const trimmedPassword = password.trim();

    if (!trimmedUsername || !trimmedPassword) {
      setError("Please enter both username/email and password");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const data = await login(usernameOrEmail, password);
      await authLogin(data);

      if (data.accessToken) await AsyncStorage.setItem("token", data.accessToken);
      if (data.userId) await AsyncStorage.setItem("userId", data.userId);

      if (onLoginSuccess) onLoginSuccess(data.userId, data.accessToken);
    } catch (err) {
      console.error("Login error:", err);
      let errorMessage = "Failed to log in. Please try again.";

      if (err instanceof Error) {
        if (err.message.includes("Invalid credentials")) {
          errorMessage = "Invalid username/email or password";
        } else if (err.message.includes("Network request failed")) {
          errorMessage = "Unable to connect to server. Check your internet.";
        } else {
          errorMessage = err.message;
        }
      }

      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.white }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 60 : 0}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: "center", paddingHorizontal: spacing.xl }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.container}>
          <Text style={globalStyles.title}>Log in</Text>

          <View style={styles.formContainer}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email or Phone number</Text>
              <CustomInput
                placeholder="Enter your email or number"
                value={usernameOrEmail}
                onChangeText={setUsernameOrEmail}
                autoCapitalize="none"
                error={!!error}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Password</Text>
              <PasswordInput
                value={password}
                onChangeText={setPassword}
                placeholder="Enter password"
                error={!!error}
              />
            </View>

            <ErrorMessage message={error} />

            <CustomButton
              title={isLoading ? "Signing in..." : "Sign In"}
              onPress={handleLogin}
              loading={isLoading}
            />

            <TouchableOpacity onPress={onForgotPassword} style={styles.linkContainer}>
              <Text style={globalStyles.link}>Forgot password</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={onSignupNavigation} style={styles.linkContainer}>
              <Text style={globalStyles.link}>Don't have an account? Create a new account</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
    backgroundColor: colors.white,
  },
  formContainer: {
    marginTop: spacing.lg,
  },
  inputContainer: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: 16,
    fontWeight: "bold",
    color: colors.black,
    marginBottom: 8,
    marginLeft: 4,
  },
  linkContainer: {
    alignItems: "center",
    marginTop: spacing.sm,
  },
});

export default LoginForm;
