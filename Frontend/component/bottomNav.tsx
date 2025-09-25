// components/AuthButtons.tsx
import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

interface Props {
  onPressLogin?: () => void;
  onPressRegister?: () => void;
}

const AuthButtons: React.FC<Props> = ({ onPressLogin, onPressRegister }) => {
  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={onPressLogin} style={styles.loginButton}>
        <Text style={styles.loginText}>Login</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={onPressRegister} style={styles.registerButton}>
        <Text style={styles.registerText}>Register</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 25,
    paddingHorizontal: 16,
    borderRadius: 35,
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 5,
  },
  loginButton: {
    backgroundColor: "#FF5722",
    borderWidth: 2,
    borderColor: "#FF5722",
    paddingVertical: 12,
    flex: 1,
    marginRight: 8,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
  },
  loginText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  registerButton: {
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: "#FF5722",
    paddingVertical: 12,
    flex: 1,
    marginLeft: 8,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
  },
  registerText: {
    color: "#FF5722",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default AuthButtons;
