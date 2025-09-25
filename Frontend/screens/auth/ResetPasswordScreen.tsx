import React from "react";
import { View } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NavigationProp } from "@react-navigation/native";
import ResetPasswordForm from "../../component/forms/ResetPasswordForm";
import { globalStyles } from "../../styles/globalStyles";

type RootStackParamList = {
  Login: undefined;
};

const ResetPasswordScreen = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const route = useRoute();
  const { email, code } = route.params as { email: string; code: string };

  const handleSuccess = () => {
    navigation.navigate("Login");
  };

  return (
    <View style={globalStyles.container}>
      <ResetPasswordForm email={email} code={code} onSuccess={handleSuccess} />
    </View>
  );
};

export default ResetPasswordScreen;
