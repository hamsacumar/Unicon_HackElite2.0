import React from "react";
import { View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import LoginForm from "../../component/forms/LoginForm";
import { globalStyles } from "../../styles/globalStyles";
// for after login.
import * as SecureStore from "expo-secure-store";

type AuthStackParamList = {
  Login: undefined;
  Signup: undefined;
  ForgotPassword: undefined;
  VerifyCode: { email: string; userId?: string };
  Home: undefined; // for after login navigation
};

const LoginScreen = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<AuthStackParamList>>();

  const handleForgotPassword = () => {
    navigation.navigate("ForgotPassword");
  };

  const handleSignupNavigation = () => {
    navigation.navigate("Signup");
  };

  const handleVerifyEmail = (email: string, userId: string) => {
    navigation.navigate("VerifyCode", {
      email,
      userId,
    });
  };

  // for redirecting home after login
  const handleLoginSuccess = (userId: string, accesstoken: string) => {
    SecureStore.setItemAsync("accessToken", accesstoken);
    SecureStore.setItemAsync("userId", userId);

    navigation.reset({
      index: 0,
      routes: [{ name: "Home" }],
    });
  };

  return (
    <View style={globalStyles.container}>
      <LoginForm
        onForgotPassword={handleForgotPassword}
        onSignupNavigation={handleSignupNavigation}
        onVerifyEmail={handleVerifyEmail}
        onLoginSuccess={handleLoginSuccess}
      />
    </View>
  );
};

export default LoginScreen;
