import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import PasswordInput from '../ui/PasswordInput';
import CustomButton from '../ui/CustomButton';
import ErrorMessage from '../ui/ErrorMessage';
import { colors, spacing, globalStyles } from '../../styles/globalStyles';
import { resetPassword } from '../../services/api';

interface ResetPasswordFormProps {
  email: string;
  code: string;
  onSuccess: () => void;
}

const ResetPasswordForm: React.FC<ResetPasswordFormProps> = ({
  email,
  code,
  onSuccess,
}) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (
      newPassword.length < 8 ||
      !/[A-Z]/.test(newPassword) ||
      !/[0-9]/.test(newPassword) ||
      !/[^a-zA-Z0-9]/.test(newPassword)
    ) {
      setError(
        'Password must be at least 8 characters, include uppercase, number, and symbol'
      );
      return;
    }

    try {
      setError('');
      setIsLoading(true);
      
      await resetPassword(email, code, newPassword, confirmPassword);
      
      Alert.alert('Success', 'Your password has been successfully reset.', [
        { text: 'Go to Login', onPress: onSuccess },
      ]);
    } catch (err: any) {
      setError(err?.message || 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={globalStyles.title}>Reset Password</Text>
      <Text style={globalStyles.subtitle}>
        Enter your new password below
      </Text>

      <View style={styles.formContainer}>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>New Password</Text>
          <PasswordInput
            value={newPassword}
            onChangeText={setNewPassword}
            placeholder="Enter new password"
            error={!!error}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Confirm Password</Text>
          <PasswordInput
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="Confirm new password"
            error={!!error}
          />
        </View>

        <ErrorMessage message={error} />

        <CustomButton
          title="Reset Password"
          onPress={handleSubmit}
          loading={isLoading}
        />
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
    fontWeight: 'bold',
    color: colors.black,
    marginBottom: 8,
    marginLeft: 4,
  },
});

export default ResetPasswordForm;