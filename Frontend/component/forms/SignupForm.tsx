import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import CustomInput from '../ui/CustomInput';
import PasswordInput from '../ui/PasswordInput';
import CustomButton from '../ui/CustomButton';
import ErrorMessage from '../ui/ErrorMessage';
import { colors, spacing, globalStyles } from '../../styles/globalStyles';
import { signup } from '../../services/api';
import Toast from 'react-native-toast-message';

interface SignupFormProps {
  onSuccess: (email: string, userId: string) => void;
  onLoginNavigation: () => void;
}

const SignupForm: React.FC<SignupFormProps> = ({
  onSuccess,
  onLoginNavigation,
}) => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const validateForm = (): { isValid: boolean; error?: string } => {
    if (!username || !email || !password) {
      return { isValid: false, error: 'All fields are required' };
    }
    
    // Username validation
    if (username.length < 3) {
      return { isValid: false, error: 'Username must be at least 3 characters' };
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { isValid: false, error: 'Please enter a valid email address' };
    }
    
    // Password validation
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z\d]).{8,}$/;
    if (!passwordRegex.test(password)) {
      return {
        isValid: false,
        error: 'Password must be at least 8 characters with uppercase, number, and special character'
      };
    }
    
    return { isValid: true };
  };

  const handleSignup = async () => {
    const { isValid, error } = validateForm();
    if (!isValid) {
      setError(error || 'Invalid form data');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      console.log('Calling signup API with:', { username, email });
      const response = await signup(username, email, password);
      console.log('Signup API response:', response);
      
      const userId = response.userId;
      
      if (!userId) {
        console.error('User ID not found in response. Full response:', response);
        throw new Error('User ID not received from server');
      }
      
      Toast.show({
        type: 'success',
        text1: 'Account created!',
        text2: 'Please check your email for the verification code.',
        visibilityTime: 3000
      });
      
      onSuccess(response.Email || response.email || email, userId);
      
    } catch (err) {
      console.error('Signup error:', err);
      let errorMessage = 'Failed to create account. Please try again.';
      
      if (err instanceof Error) {
        if (err.message.includes('already exists')) {
          if (err.message.includes('Username')) {
            errorMessage = 'Username is already taken';
          } else if (err.message.includes('Email')) {
            errorMessage = 'Email is already registered';
          }
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
      <Text style={globalStyles.title}>Create Account</Text>
      
      <View style={styles.formContainer}>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Username</Text>
          <CustomInput
            placeholder="Enter your username"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            error={!!error}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Email or Phone number</Text>
          <CustomInput
            placeholder="Enter your email or number"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
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
          title={isLoading ? 'Creating Account...' : 'Create Account'}
          onPress={handleSignup}
          loading={isLoading}
        />

        <TouchableOpacity onPress={onLoginNavigation} style={styles.linkContainer}>
          <Text style={globalStyles.link}>
            Already have an account? Log in
          </Text>
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
    justifyContent: 'center',
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
    fontWeight: 'bold',
    color: colors.black,
    marginBottom: 8,
    marginLeft: 4,
  },
  linkContainer: {
    alignItems: 'center',
    marginTop: spacing.sm,
  },
});

export default SignupForm;