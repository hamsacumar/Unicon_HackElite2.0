import React from 'react';
import { View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import LoginForm from '../../component/forms/LoginForm';
import { globalStyles } from '../../styles/globalStyles';

type AuthStackParamList = {
  Login: undefined;
  Signup: undefined;
  ForgotPassword: undefined;
  VerifyCode: { email: string; userId?: string };
};

const LoginScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();

  const handleForgotPassword = () => {
    navigation.navigate('ForgotPassword');
  };

  const handleSignupNavigation = () => {
    navigation.navigate('Signup');
  };

  const handleVerifyEmail = (email: string, userId: string) => {
    navigation.navigate('VerifyCode', { 
      email,
      userId 
    });
  };

  return (
    <View style={globalStyles.container}>
      <LoginForm
        onForgotPassword={handleForgotPassword}
        onSignupNavigation={handleSignupNavigation}
        onVerifyEmail={handleVerifyEmail}
      />
    </View>
  );
};

export default LoginScreen;