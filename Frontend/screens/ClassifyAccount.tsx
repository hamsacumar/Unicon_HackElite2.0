import React, { useState, useEffect } from "react";
import * as SecureStore from 'expo-secure-store';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import { useNavigation, useRoute, NavigationProp } from "@react-navigation/native";
import { classifyAccount, api } from "../services/api";
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
          console.log('Initial token received from route params');
          await SecureStore.setItemAsync('accessToken', initialToken);
          // Set axios default header
          api.defaults.headers.common['Authorization'] = `Bearer ${initialToken}`;
        }
        
        // Verify token is available
        const storedToken = await SecureStore.getItemAsync('accessToken');
        console.log('Stored token exists:', !!storedToken);
        
        if (!storedToken) {
          console.warn('No token found in secure storage');
        }
      } catch (error) {
        console.error('Error initializing token:', error);
      }
    };
    
    initToken();
  }, [initialToken]);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [address, setAddress] = useState("");
  const [description, setDescription] = useState("");
  type UserRole = 'Student' | 'Organizer' | 'Admin';
  const [role, setRole] = useState<UserRole>('Student');
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
      console.log('Token from storage:', token ? 'Present' : 'Missing');
      
      if (!token) {
        throw new Error('Authentication token not found. Please log in again.');
      }
      
      // Verify token is valid by making a test request
      try {
        const testResponse = await api.get('/auth/me', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (testResponse.status === 401) {
          throw new Error('Session expired. Please log in again.');
        }
      } catch (authError) {
        console.error('Token validation error:', authError);
        throw new Error('Authentication failed. Please log in again.');
      }
      
      console.log('Submitting classification with token:', token);
      
      // Make the classification request
      const response = await classifyAccount(
        userId,
        firstName,
        lastName,
        address,
        description,
        role
      );
      
      console.log('Classification successful:', response);
      
      // Clear sensitive data
      setFirstName('');
      setLastName('');
      setAddress('');
      setDescription('');
      
      Alert.alert(
        "Success", 
        "Account classification successful! You can now log in with your credentials.",
        [
          {
            text: "Go to Login",
            onPress: () => navigation.navigate("Login", { message: 'You can now log in with your credentials.' }),
          }
        ]
      );
      
    } catch (err) {
      console.error('Classification error:', err);
      
      let errorMessage = 'An error occurred during account classification.';
      if (err instanceof Error) {
        errorMessage = err.message;
      }
      
      // Handle specific error cases
      if (errorMessage.includes('401') || 
          errorMessage.toLowerCase().includes('unauthorized') ||
          errorMessage.toLowerCase().includes('token') ||
          errorMessage.toLowerCase().includes('authentication')) {
            
        // Clear the invalid token
        await SecureStore.deleteItemAsync("accessToken");
        
        // Navigate to login with a message
        navigation.navigate("Login", { 
          message: 'Your session has expired. Please log in again.' 
        });
        return;
      }
      
      setError(errorMessage);
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
