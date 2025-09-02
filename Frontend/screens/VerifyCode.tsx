import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import Icon from "@expo/vector-icons/Ionicons";
import { useNavigation, useRoute } from "@react-navigation/native";
import * as SecureStore from 'expo-secure-store';
import { verifyEmail, resendCode } from "../services/api";
import Toast from "react-native-toast-message";

interface VerifyCodeParams {
  email: string;
  userId?: string;
  purpose?: 'signup' | 'reset-password';
}

const VerifyCode = () => {
  const route = useRoute();
  const { email, userId, purpose = 'signup' } = route.params as VerifyCodeParams;
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
        setCountdown(prev => {
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
    const numericValue = text.replace(/[^0-9]/g, '');
    if (numericValue === '' && text !== '') return;
    
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
    if (error) setError('');
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
      if (purpose === 'signup') {
        console.log('Verifying email with code...');
        const response = await verifyEmail(email, fullCode);
        console.log('Verify email response in handleSubmit:', response);
        
        // Even if there's no token, we might still have a successful verification
        if (response.Message && response.Message.includes('verified')) {
          Toast.show({
            type: 'success',
            text1: 'Email verified successfully!',
            text2: 'Your account is now active.',
            visibilityTime: 3000
          });
          
          // After successful verification, navigate to ClassifyAccount with user info and token
          const token = response.Token || response.token;
          if (token) {
            await SecureStore.setItemAsync("accessToken", token);
          }
          
          navigation.navigate("ClassifyAccount", { 
            email: response.Email || response.email || email,
            userId: response.UserId || response.userId || userId,
            token: token, // Pass the token directly as well
            message: 'Please complete your profile information.'
          });
        } else {
          // If we get here, the verification might have succeeded but without a token
          // Let's still proceed to the classify account screen
          console.log('Verification successful but no token received');
          Toast.show({
            type: 'info',
            text1: 'Email verified!',
            text2: 'Please complete your profile.',
            visibilityTime: 3000
          });
          
          navigation.navigate("ClassifyAccount", { 
            email: response.Email || response.email || email,
            userId: response.UserId || response.userId || userId,
            message: 'Please complete your profile information.'
          });
        }
      } else {
        // For password reset, just navigate to reset password with the code
        // The code will be verified when they actually try to reset the password
        navigation.navigate("ResetPassword", { 
          email, 
          code: fullCode 
        });
      }
      
    } catch (err) {
      console.error('Verification error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Code is incorrect or has expired';
      setError(errorMessage);
      
      // Clear the code on error
      setCode(["", "", "", "", "", ""]);
      inputs.current[0]?.focus();
      
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    // If countdown is active, show remaining time
    if (countdown > 0) {
      const minutes = Math.floor(countdown / 60);
      const seconds = countdown % 60;
      const timeLeft = `${minutes > 0 ? `${minutes}m ` : ''}${seconds}s`;
      
      Toast.show({
        type: 'info',
        text1: 'Please wait',
        text2: `You can request a new code in ${timeLeft}.`,
        visibilityTime: 3000
      });
      return;
    }
    
    try {
      setIsResending(true);
      
      // Show loading state
      Toast.show({
        type: 'info',
        text1: 'Sending code...',
        visibilityTime: 1000
      });
      
      // Add a small delay to ensure the loading toast is shown
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      try {
        // Use the purpose from route params or default to 'signup'
        const response = await resendCode(email, purpose);
        
        // Start the countdown timer (2 minutes)
        setCountdown(120);
        
        // Show success message based on purpose
        const successMessage = purpose === 'reset-password' 
          ? 'If an account exists with this email, a reset code has been sent.'
          : 'Verification code sent! Please check your email.';
        
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: successMessage,
          visibilityTime: 4000
        });
      } catch (error) {
        console.error('Resend error:', error);
        
        // Show error message from the API or a default message
        const errorMessage = error instanceof Error ? error.message : 'Failed to resend code';
        
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: errorMessage,
          visibilityTime: 4000
        });
        
        // If the error indicates the email is already verified, navigate to login
        if (errorMessage.includes('already verified')) {
          setTimeout(() => {
            navigation.navigate('Login');
          }, 2000);
        }
      }
      
    } catch (error) {
      console.error('Resend error:', error);
      
      // Check if this is a rate limit error
      const errorMessage = error instanceof Error ? error.message : 'Please try again later.';
      
      if (errorMessage.includes('2 minutes') || errorMessage.includes('Wait')) {
        // If we hit the rate limit, set the countdown to 2 minutes
        setCountdown(120);
        
        Toast.show({
          type: 'error',
          text1: 'Too soon!',
          text2: 'Please wait 2 minutes before requesting another code.',
          visibilityTime: 4000
        });
      } else {
        // For other errors, show the error message
        Toast.show({
          type: 'error',
          text1: 'Failed to resend code',
          text2: errorMessage,
          visibilityTime: 4000
        });
      }
    } finally {
      setIsResending(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Icon name="lock-closed" size={40} color="#E64A0D" />
      </View>
      <Text style={styles.title}>Verification Code</Text>
      <Text style={styles.subtitle}>
        We've sent a 6-digit code to{' '}
        <Text style={{ fontWeight: 'bold' }}>{email}</Text>
      </Text>
      <View style={styles.otpContainer}>
        {code.map((digit, index) => (
          <TextInput
            key={index}
            style={[
              styles.otpInput,
              error && styles.otpInputError,
              digit && styles.otpInputFilled
            ]}
            value={digit}
            onChangeText={(text) => handleChange(text, index)}
            onKeyPress={({ nativeEvent }) => {
              // Handle backspace
              if (nativeEvent.key === 'Backspace' && !digit && index > 0) {
                inputs.current[index - 1]?.focus();
              }
            }}
            keyboardType="number-pad"
            maxLength={1}
            ref={(ref) => { inputs.current[index] = ref; }}
            textAlign="center"
            selectTextOnFocus
            editable={!isLoading}
            selectionColor="#E64A0D"
          />
        ))}
      </View>
      {error ? (
        <Text style={styles.error}>{error}</Text>
      ) : (
        <Text style={styles.hint}>Enter the 6-digit code sent to your email</Text>
      )}
      
      <TouchableOpacity 
        style={[styles.button, isLoading && styles.buttonDisabled]}
        onPress={handleSubmit}
        disabled={isLoading}
      >
        <Text style={styles.buttonText}>
          {isLoading ? 'Verifying...' : 'Verify Account'}
        </Text>
      </TouchableOpacity>
      
      <View style={styles.resendContainer}>
        <Text style={styles.resendText}>Didn't receive the code? </Text>
        <TouchableOpacity 
          onPress={handleResendCode} 
          disabled={countdown > 0 || isResending}
        >
          <Text style={[
            styles.resendLink,
            (countdown > 0 || isResending) && styles.resendLinkDisabled
          ]}>
            {isResending 
              ? 'Sending...' 
              : countdown > 0 
                ? `Resend (${countdown}s)` 
                : 'Resend Code'}
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
    padding: 25,
    backgroundColor: "#fff",
  },
  iconContainer: {
    backgroundColor: "#FF7F50",
    borderRadius: 50,
    padding: 20,
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
  },
  subtitle: {
    color: "gray",
    marginBottom: 30,
    textAlign: "center",
  },
  resendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  resendText: {
    color: '#666',
    fontSize: 14,
  },
  resendLink: {
    color: '#E64A0D',
    fontWeight: '500',
    fontSize: 14,
  },
  resendLinkDisabled: {
    color: '#aaa',
  },
  otpContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "80%",
    marginBottom: 20,
  },
  otpInput: {
    width: 48,
    height: 60,
    borderWidth: 1.5,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    margin: 5,
    fontSize: 24,
    fontWeight: '600',
    color: '#333',
    backgroundColor: '#f9f9f9',
  },
  otpInputFilled: {
    borderColor: '#E64A0D',
    backgroundColor: '#fff',
  },
  otpInputError: {
    borderColor: '#ff4444',
  },
  button: {
    backgroundColor: "#E64A0D",
    padding: 16,
    borderRadius: 8,
    width: "100%",
    alignItems: "center",
    marginTop: 10,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "bold",
  },
  link: {
    color: "#E64A0D",
  },
  error: {
    color: '#d32f2f',
    backgroundColor: '#ffebee',
    padding: 12,
    borderRadius: 6,
    marginBottom: 20,
    width: '100%',
    textAlign: 'center',
  },
  hint: {
    color: '#666',
    marginBottom: 25,
    textAlign: 'center',
    fontSize: 14,
  },
});

export default VerifyCode;
