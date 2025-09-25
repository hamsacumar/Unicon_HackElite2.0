import React, { useState, useEffect } from "react";
import * as SecureStore from "expo-secure-store";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import {
  useNavigation,
  useRoute,
  NavigationProp,
} from "@react-navigation/native";
import { classifyAccount, api } from "../../services/api";
import { Picker } from "@react-native-picker/picker";

type RootStackParamList = {
  Login: {
    message?: string;
  };
  ClassifyAccount: {
    userId: string;
    email: string;
    message?: string;
    token?: string;
  };
  ProfileSetup: undefined;
  // add other routes here if needed
};

const ClassifyAccount = () => {
  const route = useRoute();
  const { userId, token: initialToken } = route.params as {
    userId: string;
    token?: string;
  };

  // Save the token if it was passed in
  useEffect(() => {
    const initToken = async () => {
      try {
        if (initialToken) {
          console.log("Initial token received from route params");
          await SecureStore.setItemAsync("accessToken", initialToken);
          // Set axios default header
          api.defaults.headers.common["Authorization"] =
            `Bearer ${initialToken}`;
        }

        // Verify token is available
        const storedToken = await SecureStore.getItemAsync("accessToken");
        console.log("Stored token exists:", !!storedToken);

        if (!storedToken) {
          console.warn("No token found in secure storage");
        }
      } catch (error) {
        console.error("Error initializing token:", error);
      }
    };

    initToken();
  }, [initialToken]);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [address, setAddress] = useState("");
  const [description, setDescription] = useState("");
  type UserRole = "Student" | "Organizer" | "Admin";
  const [role, setRole] = useState<UserRole>("Student");
  const [error, setError] = useState("");
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  const handleSubmit = async () => {
    if (!firstName || !lastName || !address) {
      setError("First name, last name, and address are required");
      return;
    }

    try {
      setError("");

      // Get token and verify it exists
      const token = await SecureStore.getItemAsync("accessToken");
      console.log("Token from storage:", token ? "Present" : "Missing");

      if (!token) {
        throw new Error("Authentication token not found. Please log in again.");
      }

      // Verify token is valid by making a test request
      try {
        const testResponse = await api.get("/auth/me", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (testResponse.status === 401) {
          throw new Error("Session expired. Please log in again.");
        }
      } catch (authError) {
        console.error("Token validation error:", authError);
        throw new Error("Authentication failed. Please log in again.");
      }

      // Make the classification request
      const response = await classifyAccount(
        userId,
        firstName,
        lastName,
        address,
        description,
        role
      );

      console.log("Classification successful:", response);

      // Clear sensitive data
      setFirstName("");
      setLastName("");
      setAddress("");
      setDescription("");

      // Show success message and navigate to Profile
      Alert.alert("Success", "Account classification successful!", [
        {
          text: "OK",
          onPress: () => navigation.navigate("ProfileSetup"),
        },
      ]);
    } catch (err) {
      console.error("Classification error:", err);

      let errorMessage = "An error occurred during account classification.";
      if (err instanceof Error) {
        errorMessage = err.message;
      }

      // Handle specific error cases
      if (
        errorMessage.includes("401") ||
        errorMessage.toLowerCase().includes("unauthorized") ||
        errorMessage.toLowerCase().includes("token") ||
        errorMessage.toLowerCase().includes("authentication")
      ) {
        // Clear the invalid token
        await SecureStore.deleteItemAsync("accessToken");

        // Navigate to login with a message
        navigation.navigate("Login", {
          message: "Your session has expired. Please log in again.",
        });
        return;
      }

      setError(errorMessage);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Account Classification</Text>
      <Text style={styles.subtitle}>
        Please provide your information to complete account setup
      </Text>

      <View style={styles.formContainer}>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>First Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your first name"
            value={firstName}
            onChangeText={setFirstName}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Last Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your last name"
            value={lastName}
            onChangeText={setLastName}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Role</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={role}
              onValueChange={(itemValue) => setRole(itemValue)}
              style={styles.picker}
            >
              <Picker.Item label="Student" value="Student" />
              <Picker.Item label="Organizer" value="Organizer" />
              <Picker.Item label="Admin" value="Admin" />
            </Picker>
          </View>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Address</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your address"
            value={address}
            onChangeText={setAddress}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Description (Optional)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Tell us about yourself"
            value={description}
            onChangeText={setDescription}
            multiline={true}
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        {error && <Text style={styles.error}>{error}</Text>}

        <TouchableOpacity style={styles.button} onPress={handleSubmit}>
          <Text style={styles.buttonText}>Complete Setup</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 30,
    lineHeight: 22,
  },
  formContainer: {
    flex: 1,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
    marginLeft: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    backgroundColor: "#f9f9f9",
    padding: 15,
    borderRadius: 8,
    fontSize: 16,
    color: "#333",
  },
  textArea: {
    minHeight: 100,
    paddingTop: 15,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: "#ddd",
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    overflow: "hidden",
  },
  picker: {
    height: 50,
    width: "100%",
  },
  button: {
    backgroundColor: "#E64A0D",
    padding: 16,
    borderRadius: 8,
    marginTop: 20,
    shadowColor: "#E64A0D",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  buttonText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "bold",
    fontSize: 16,
  },
  error: {
    color: "#E64A0D",
    marginBottom: 15,
    textAlign: "center",
    fontSize: 14,
    backgroundColor: "#ffe6e1",
    padding: 10,
    borderRadius: 6,
    marginTop: -10,
  },
});

export default ClassifyAccount;
