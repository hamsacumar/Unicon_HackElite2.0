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

  const [isLoading, setIsLoading] = useState(false);

  const validateForm = (): { isValid: boolean; error?: string } => {
    if (!username || !email || !password) {
      return { isValid: false, error: "All fields are required" };
    }
    
    // Username validation
    if (username.length < 3) {
      return { isValid: false, error: "Username must be at least 3 characters" };
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { isValid: false, error: "Please enter a valid email address" };
    }
    
    // Password validation
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z\d]).{8,}$/;
    if (!passwordRegex.test(password)) {
      return {
        isValid: false,
        error: "Password must be at least 8 characters with uppercase, number, and special character"
      };
    }
    
    return { isValid: true };
  };

  const handleSignup = async () => {
    const { isValid, error } = validateForm();
    if (!isValid) {
      setError(error || "Invalid form data");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      // Call the signup API
      console.log('Calling signup API with:', { username, email });
      const response = await signup(username, email, password);
      console.log('Signup API response:', response);
      
      // The response contains 'userId' with lowercase 'u'
      const userId = response.userId;
      
      if (!userId) {
        console.error('User ID not found in response. Full response:', response);
        throw new Error('User ID not received from server');
      }
      
      console.log('Extracted userId:', userId);
      
      // Show success message
      Toast.show({
        type: 'success',
        text1: 'Account created!',
        text2: 'Please check your email for the verification code.',
        visibilityTime: 3000
      });
      
      // Navigate to verification screen with user ID and email
      navigation.navigate("VerifyCode", {
        email: response.Email || response.email || email,
        userId: userId,
        purpose: 'signup' // Explicitly set the purpose
      });
      
    } catch (err) {
      console.error("Signup error:", err);
      let errorMessage = "Failed to create account. Please try again.";
      
      if (err instanceof Error) {
        // Handle specific error messages from the API
        if (err.message.includes("already exists")) {
          if (err.message.includes("Username")) {
            errorMessage = "Username is already taken";
          } else if (err.message.includes("Email")) {
            errorMessage = "Email is already registered";
          }
        } else {
          errorMessage = err.message;
        }
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
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
      {error ? <Text style={styles.error}>{error}</Text> : null}
      
      <TouchableOpacity 
        style={[styles.button, isLoading && styles.buttonDisabled]}
        onPress={handleSignup}
        disabled={isLoading}
      >
        <Text style={styles.buttonText}>
          {isLoading ? 'Creating Account...' : 'Sign Up'}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.navigate("Login")}>
        <Text style={styles.link}>Already have an account? Log in</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
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
    color: '#d32f2f',
    backgroundColor: '#ffebee',
    padding: 10,
    borderRadius: 5,
    marginBottom: 15,
    textAlign: 'center',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
});

export default Signup;
