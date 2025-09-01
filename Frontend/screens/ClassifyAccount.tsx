import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import { useNavigation, useRoute, NavigationProp } from "@react-navigation/native";
import { classifyAccount } from "../services/api";
import { Picker } from "@react-native-picker/picker";

type RootStackParamList = {
  Login: undefined;
  // add other routes here if needed
};

const ClassifyAccount = () => {
  const route = useRoute();
  const { userId } = route.params as { userId: string };
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [address, setAddress] = useState("");
  const [description, setDescription] = useState("");
  const [role, setRole] = useState("Student");
  const [error, setError] = useState("");
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  const handleSubmit = async () => {
    if (!firstName || !lastName || !address) {
      setError("First name, last name, and address are required");
      return;
    }
    try {
      setError("");
      await classifyAccount(
        userId,
        firstName,
        lastName,
        address,
        description,
        role
      );
      Alert.alert("Success", "Successfully created an account", [
        {
          text: "Go to Home Page",
          onPress: () => navigation.navigate("Login"),
        }, // Redirect to Login after success
      ]);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unexpected error occurred");
      }
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="First Name"
        value={firstName}
        onChangeText={setFirstName}
      />
      <TextInput
        style={styles.input}
        placeholder="Last Name"
        value={lastName}
        onChangeText={setLastName}
      />
      <Picker
        selectedValue={role}
        onValueChange={(itemValue) => setRole(itemValue)}
        style={styles.picker}
      >
        <Picker.Item label="Student" value="Student" />
        <Picker.Item label="Organizer" value="Organizer" />
        <Picker.Item label="Admin" value="Admin" />
      </Picker>
      <TextInput
        style={styles.input}
        placeholder="Address"
        value={address}
        onChangeText={setAddress}
      />
      <TextInput
        style={styles.input}
        placeholder="Description (optional)"
        value={description}
        onChangeText={setDescription}
      />
      {error && <Text style={styles.error}>{error}</Text>}
      <TouchableOpacity style={styles.button} onPress={handleSubmit}>
        <Text style={styles.buttonText}>Submit</Text>
      </TouchableOpacity>
    </View>
  );
};

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
  picker: {
    borderWidth: 1,
    borderColor: "#ccc",
    marginBottom: 15,
    borderRadius: 5,
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
  error: {
    color: "red",
    marginBottom: 15,
    textAlign: "center",
  },
});

export default ClassifyAccount;
