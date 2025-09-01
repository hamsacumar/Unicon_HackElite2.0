import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import Icon from "@expo/vector-icons/Ionicons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { verifyEmail, resendCode } from "../services/api";
import Toast from "react-native-toast-message";

const VerifyCode = () => {
  const route = useRoute();
  const { userId, email, purpose } = route.params as {
    userId: string;
    email: string;
    purpose: string;
  };
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const navigation = useNavigation<any>();
  const inputs = useRef<(TextInput | null)[]>([]);

  const handleChange = (text: string, index: number) => {
    const newCode = [...code];
    newCode[index] = text;
    setCode(newCode);
    if (text && inputs.current[index + 1]) {
      inputs.current[index + 1]?.focus();
    }
  };

  const handleSubmit = async () => {
    const fullCode = code.join("");
    if (fullCode.length < 6) {
      setError("Enter the 6-digit code");
      return;
    }
    try {
      setError("");
      await verifyEmail(userId, fullCode, purpose);
      navigation.navigate("ClassifyAccount", { userId });
    } catch (err) {
      setError("Code is incorrect or expired");
    }
  };

  const handleResend = async () => {
    try {
      await resendCode(userId, purpose);
      Toast.show({ type: "success", text1: "Code resent to your email" });
    } catch (err) {
      Toast.show({ type: "error", text1: err instanceof Error ? err.message : "An error occurred" });
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Icon name="lock-closed" size={40} color="#E64A0D" />
      </View>
      <Text style={styles.title}>Verification Code</Text>
      <Text style={styles.subtitle}>We have sent the code to {email}</Text>
      <View style={styles.otpContainer}>
        {code.map((digit, index) => (
          <TextInput
            key={index}
            style={styles.otpInput}
            value={digit}
            onChangeText={(text) => handleChange(text, index)}
            keyboardType="numeric"
            maxLength={1}
            ref={(ref) => { inputs.current[index] = ref; }}
            textAlign="center"
          />
        ))}
      </View>
      {error && <Text style={styles.error}>{error}</Text>}
      <TouchableOpacity style={styles.button} onPress={handleSubmit}>
        <Text style={styles.buttonText}>Submit</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={handleResend}>
        <Text style={styles.link}>Didn't receive the code? Resend</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#fff",
  },
  iconContainer: {
    backgroundColor: "#FF7F50",
    borderRadius: 50,
    padding: 20,
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
  },
  subtitle: {
    color: "gray",
    marginBottom: 30,
    textAlign: "center",
  },
  otpContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "80%",
    marginBottom: 20,
  },
  otpInput: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 15,
    width: 45,
    height: 50,
    fontSize: 24,
    textAlign: "center",
    borderRadius: 5,
    color: "#007AFF", // Light blue for entered text
  },
  button: {
    backgroundColor: "#E64A0D",
    padding: 15,
    borderRadius: 5,
    width: "80%",
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
  },
  error: {
    color: "red",
    marginBottom: 15,
  },
});

export default VerifyCode;
