import React from "react";
import { ScrollView, StyleSheet } from "react-native";
import SettingsButton from "../component/SettingButton";
import { logout } from "../services/api"; // 👈 import logout service

interface Props {
  navigation: any;
}

const SettingsScreen: React.FC<Props> = ({ navigation }) => {
  const handleLogout = async () => {
    // Call your logout service and pass navigation
    await logout(navigation);
  };

  return (
    <ScrollView style={styles.container}>
      <SettingsButton
        title="Help & Support"
        onPress={() => navigation.navigate("Help")}
      />
      <SettingsButton
        title="Terms & Policies"
        onPress={() => navigation.navigate("Terms")}
      />
      <SettingsButton
        title="About"
        onPress={() => navigation.navigate("About")}
      />
      <SettingsButton
        title="Logout"
        onPress={handleLogout}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f8f8" },
});

export default SettingsScreen;
