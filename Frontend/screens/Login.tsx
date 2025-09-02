import React, { useState, useContext } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

type AuthStackParamList = {
  Login: undefined;
  Signup: undefined;
  ForgotPassword: undefined;
  VerifyCode: { email: string; userId?: string };
};

import Icon from "@expo/vector-icons/Ionicons";
import { login } from "../services/api"; 
import { AuthContext } from "../utils/AuthContext";

const Login = () => {
  const [usernameOrEmail, setUsernameOrEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const navigation =
    useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const authContext = useContext(AuthContext);
  if (!authContext) {
    throw new Error(
      "AuthContext is undefined. Make sure you are within an AuthProvider."
    );
  }
  const { login: authLogin } = authContext;

  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!usernameOrEmail || !password) {
      setError("Please enter both username/email and password");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const data = await login(usernameOrEmail, password);
      await authLogin(data);
      
      // Check if email is verified
      if (!data.isEmailVerified) {
        // If not verified, navigate to verification screen
        navigation.navigate("VerifyCode", { 
          email: data.email,
          userId: data.userId 
        });
      }
      // If verified, the AuthContext will handle the navigation
    } catch (err) {
      console.error("Login error:", err);
      let errorMessage = "Failed to log in. Please try again.";
      
      if (err instanceof Error) {
        // Handle specific error messages from the API
        if (err.message.includes("Invalid credentials")) {
          errorMessage = "Invalid username/email or password";
        } else if (err.message.includes("Email not verified")) {
          errorMessage = "Please verify your email before logging in";
        } else {
          errorMessage = err.message;
        }
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Username or Email"
        value={usernameOrEmail}
        onChangeText={setUsernameOrEmail}
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
      {error ? (
        <Text style={styles.error}>{error}</Text>
      ) : null}
      
      <TouchableOpacity 
        style={[styles.button, isLoading && styles.buttonDisabled]}
        onPress={handleLogin}
        disabled={isLoading}
      >
        <Text style={styles.buttonText}>
          {isLoading ? 'Signing in...' : 'Login'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate("ForgotPassword")}>
        <Text style={styles.link}>Forgot password</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.navigate("Signup")}>
        <Text style={styles.link}>
          Don't have an account? Create a new account
        </Text>
      </TouchableOpacity>
    </View>
  );
};

// Keep the styles but remove googleButton style
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
    backgroundColor: "#fff",
  },
  buttonDisabled: {
    opacity: 0.7,
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

export default Login;
