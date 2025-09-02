import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { startForgotPassword } from '../services/api';

type RootStackParamList = {
  Login: undefined;
  Signup: undefined;
  ForgotPassword: undefined;
  ResetPassword: { userId: string; email: string };
  VerifyCode: { userId: string; email: string; purpose: string };
  ClassifyAccount: { userId: string };
  OrgSettings: undefined;
  OrgProfile: undefined;
  // add other routes as needed
};

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const [isLoading, setIsLoading] = useState(false);
  const [codeSent, setCodeSent] = useState(false);

  const handleSubmit = async () => {
    if (!email || !email.includes('@') || !email.endsWith('.com')) {
      setError('Please enter a valid email address');
      return;
    }

    try {
      setError('');
      setIsLoading(true);
      
      // Call the API to send the verification code
      await startForgotPassword(email);
      
      // If successful, navigate to verification screen
      setCodeSent(true);
      navigation.navigate('VerifyCode', { 
        userId: '', 
        email: email.trim().toLowerCase(), 
        purpose: 'PasswordReset' 
      });
      
    } catch (err: any) {
      console.error('Forgot password error:', err);
      setError(err.message || 'Failed to send verification code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Enter your email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
      />
      {error && <Text style={styles.error}>{error}</Text>}
      <TouchableOpacity style={styles.button} onPress={handleSubmit}>
        <Text style={styles.buttonText}>Send Code</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 15,
    marginBottom: 15,
    borderRadius: 5,
  },
  button: {
    backgroundColor: '#E64A0D',
    padding: 15,
    borderRadius: 5,
  },
  buttonText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  error: {
    color: 'red',
    marginBottom: 15,
    textAlign: 'center',
  },
});

export default ForgotPassword;