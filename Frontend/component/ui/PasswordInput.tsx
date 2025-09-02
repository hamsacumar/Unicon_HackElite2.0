import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from '@expo/vector-icons/Ionicons';
import { colors, spacing, borderRadius, fontSize } from '../../styles/globalStyles';

interface PasswordInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  error?: boolean;
}

const PasswordInput: React.FC<PasswordInputProps> = ({ 
  value, 
  onChangeText, 
  placeholder, 
  error 
}) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <View style={[styles.container, error && styles.containerError]}>
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={!showPassword}
        placeholderTextColor={colors.gray}
      />
      <TouchableOpacity
        onPress={() => setShowPassword(!showPassword)}
        style={styles.eyeButton}
      >
        <Icon
          name={showPassword ? "eye-off" : "eye"}
          size={20}
          color={colors.primary}
        />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderGray,
    backgroundColor: colors.inputBackground,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.md,
  },
  containerError: {
    borderColor: colors.error,
    backgroundColor: colors.white,
  },
  input: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: fontSize.lg,
    color: colors.black,
  },
  eyeButton: {
    padding: spacing.md,
  },
});

export default PasswordInput;