import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { colors, spacing, borderRadius, fontSize } from '../../styles/globalStyles';

interface ErrorMessageProps {
  message: string;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({ message }) => {
  if (!message) return null;

  return (
    <Text style={styles.errorText}>
      {message}
    </Text>
  );
};

const styles = StyleSheet.create({
  errorText: {
    color: colors.error,
    backgroundColor: colors.errorBackground,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.md,
    textAlign: 'center',
    fontSize: fontSize.md,
  },
});

export default ErrorMessage;