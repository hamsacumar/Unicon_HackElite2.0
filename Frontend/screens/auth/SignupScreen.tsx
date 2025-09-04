import React from 'react';
import { View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import SignupForm from '../../component/forms/SignupForm';
import { globalStyles } from '../../styles/globalStyles';

type RootStackParamList = {
  Login: undefined;
  Signup: undefined;
  ForgotPassword: undefined;
  ResetPassword: undefined;
  OrgSettings: undefined;
  OrgProfile: undefined;
  ClassifyAccount: { 
    email: string;
    userId: string;
    message?: string;
  };
  VerifyCode: { 
    email: string; 
    userId: string;
    purpose: 'signup' | 'reset-password';
  };
};

type SignupScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Signup'>;

const SignupScreen = () => {
  const navigation = useNavigation<SignupScreenNavigationProp>();

  const handleSuccess = (email: string, userId: string) => {
    navigation.navigate('VerifyCode', {
      email,
      userId,
      purpose: 'signup'
    });
  };

  const handleLoginNavigation = () => {
    navigation.navigate('Login');
  };

  return (
    <View style={globalStyles.container}>
      <SignupForm
        onSuccess={handleSuccess}
        onLoginNavigation={handleLoginNavigation}
      />
    </View>
  );
};

export default SignupScreen;