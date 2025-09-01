import React, { useState, useContext } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { StackNavigationProp } from "@react-navigation/stack";

type RootStackParamList = {
  Login: undefined;
  Signup: undefined;
  ForgotPassword: undefined;
  ResetPassword: undefined;
  OrgSettings: undefined;
  OrgProfile: undefined;
  ClassifyAccount: undefined;
  VerifyCode: { userId: string; email: string; purpose: string };
};
type SignupScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "Signup"
>;

import Icon from "@expo/vector-icons/Ionicons";
import { signup } from "../services/api"; // Remove googleLogin import
import { AuthContext } from "../utils/AuthContext";
import Toast from "react-native-toast-message";

const Signup = () => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const navigation = useNavigation<SignupScreenNavigationProp>();
  const authContext = useContext(AuthContext);
  const authLogin = authContext?.login;

  const handleSignup = async () => {
    if (!username || !email || !password) {
      setError("All fields are required");
      return;
    }
    if (!email.includes("@") || !email.endsWith(".com")) {
      setError("Email must include @ and end with .com");
      return;
    }
    if (
      password.length < 8 ||
      !/[A-Z]/.test(password) ||
      !/[0-9]/.test(password) ||
      !/[^a-zA-Z0-9]/.test(password)
    ) {
      setError(
        "Password must be at least 8 characters, include uppercase, number, and symbol"
      );
      return;
    }
    try {
      setError("");
      const data = await signup(username, email, password);
      navigation.navigate("VerifyCode", {
        userId: data.userId,
        email: data.email,
        purpose: "Signup",
      });
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unexpected error occurred");
      }
    }
  };

  // REMOVE the entire handleGoogleSignup function

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Username"
        value={username}
        onChangeText={setUsername}
      />
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
      />
      <View style={styles.passwordContainer}>
        <TextInput
          style={styles.passwordInput}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPassword}
        />
        <TouchableOpacity
          onPress={() => setShowPassword(!showPassword)}
          style={styles.eyeIcon}
        >
          <Icon
            name={showPassword ? "eye-off" : "eye"}
            size={24}
            color="#E64A0D"
          />
        </TouchableOpacity>
      </View>
      {error && <Text style={styles.error}>{error}</Text>}
      <TouchableOpacity style={styles.button} onPress={handleSignup}>
        <Text style={styles.buttonText}>Create Account</Text>
      </TouchableOpacity>
      {/* REMOVE the Google Signup button */}
      <TouchableOpacity onPress={() => navigation.navigate("Login")}>
        <Text style={styles.link}>Already have an account? Log in</Text>
      </TouchableOpacity>
    </View>
  );
};

// Keep the styles the same
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
    backgroundColor: "#fff",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 15,
    marginBottom: 15,
    borderRadius: 5,
  },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    marginBottom: 15,
  },
  passwordInput: {
    flex: 1,
    padding: 15,
  },
  eyeIcon: {
    padding: 15,
  },
  button: {
    backgroundColor: "#E64A0D",
    padding: 15,
    borderRadius: 5,
    marginBottom: 15,
  },
  buttonText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "bold",
  },
  link: {
    color: "#E64A0D",
    textAlign: "center",
    marginTop: 10,
  },
  error: {
    color: "red",
    marginBottom: 15,
    textAlign: "center",
  },
});

export default Signup;
