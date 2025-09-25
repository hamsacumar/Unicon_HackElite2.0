import React from "react";
import { View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { StackNavigationProp } from "@react-navigation/stack";
import ForgotPasswordForm from "../../component/forms/ForgotPasswordForm";
import { globalStyles } from "../../styles/globalStyles";

type RootStackParamList = {
  Login: undefined;
  Signup: undefined;
  ForgotPassword: undefined;
  ResetPassword: { userId: string; email: string };
  VerifyCode: { userId: string; email: string; purpose: string };
  ClassifyAccount: { userId: string };
  OrgSettings: undefined;
  OrgProfile: undefined;
};

const ForgotPasswordScreen = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

  const handleSuccess = (email: string) => {
    navigation.navigate("VerifyCode", {
      userId: "",
      email,
      purpose: "reset-password",
    });
  };

  const handleBackToLogin = () => {
    navigation.navigate("Login");
  };

  return (
    <View style={globalStyles.container}>
      <ForgotPasswordForm
        onSuccess={handleSuccess}
        onBackToLogin={handleBackToLogin}
      />
    </View>
  );
};

export default ForgotPasswordScreen;
