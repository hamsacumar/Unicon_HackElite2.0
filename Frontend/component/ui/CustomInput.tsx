import React from 'react';
import { TextInput, StyleSheet, TextInputProps } from 'react-native';
import { colors, spacing, borderRadius, fontSize } from '../../styles/globalStyles';

interface CustomInputProps extends TextInputProps {
  error?: boolean;
}

const CustomInput: React.FC<CustomInputProps> = ({ error, style, ...props }) => {
  return (
    <TextInput
      style={[
        styles.input,
        error && styles.inputError,
        style
      ]}
      placeholderTextColor={colors.gray}
      {...props}
    />
  );
};

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderColor: colors.borderGray,
    backgroundColor: colors.inputBackground,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    marginBottom: spacing.md,
    borderRadius: borderRadius.sm,
    fontSize: fontSize.lg,
    color: colors.black,
  },
  inputError: {
    borderColor: colors.error,
    backgroundColor: colors.white,
  },
});

export default CustomInput;