import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import CustomInput from '../ui/CustomInput';
import CustomButton from '../ui/CustomButton';
import ErrorMessage from '../ui/ErrorMessage';
import { colors, spacing, fontSize, globalStyles } from '../../styles/globalStyles';
import { startForgotPassword } from '../../services/api';

interface ForgotPasswordFormProps {
  onSuccess: (email: string) => void;
  onBackToLogin: () => void;
}

const ForgotPasswordForm: React.FC<ForgotPasswordFormProps> = ({
  onSuccess,
  onBackToLogin,
}) => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email || !email.includes('@') || !email.endsWith('.com')) {
      setError('Please enter a valid email address');
      return;
    }

    try {
      setError('');
      setIsLoading(true);
      
      await startForgotPassword(email);
      onSuccess(email.trim().toLowerCase());
      
    } catch (err: any) {
      console.error('Forgot password error:', err);
      setError(err.message || 'Failed to send verification code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={globalStyles.title}>Forgot password</Text>
      <Text style={globalStyles.subtitle}>
        Enter your email and we'll send you a reset code
      </Text>

      <View style={styles.formContainer}>
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

        <ErrorMessage message={error} />

        <CustomButton
          title="Send Code"
          onPress={handleSubmit}
          loading={isLoading}
        />

        <TouchableOpacity onPress={onBackToLogin} style={styles.backButton}>
          <Text style={globalStyles.link}>Back to Sign In</Text>
        </TouchableOpacity>
      </View>
    </View>
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
    color: colors.black,
    marginBottom: 8,
    marginLeft: 4,
    fontWeight: 'bold',
  },
  backButton: {
    marginTop: spacing.md,
    alignItems: 'center',
  },
});

export default ForgotPasswordForm;