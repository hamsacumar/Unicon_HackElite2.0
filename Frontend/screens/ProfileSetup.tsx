import React, { useState } from "react";
import { 
  View, 
  Text, 
  Image, 
  StyleSheet, 
  TouchableOpacity, 
  Alert,
  ActivityIndicator,
  SafeAreaView,
  ScrollView 
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { api } from "../services/api";
import { useAuth } from "../utils/AuthContext";
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { Ionicons } from '@expo/vector-icons';

type ProfileSetupNavigationProp = NativeStackNavigationProp<RootStackParamList, 'ProfileSetup'>;

type NavProp = NativeStackNavigationProp<RootStackParamList>;

function ProfileSetup() {
  const navigation = useNavigation<ProfileSetupNavigationProp>();
  const [image, setImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSkipping, setIsSkipping] = useState(false);
  const { token } = useAuth();

  const pickImage = async () => {
    // Request permissions first
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (permissionResult.granted === false) {
      Alert.alert("Permission Required", "Permission to access camera roll is required!");
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    
    if (permissionResult.granted === false) {
      Alert.alert("Permission Required", "Permission to access camera is required!");
      return;
    }

    let result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const showImageOptions = () => {
    Alert.alert(
      "Select Photo",
      "Choose how you'd like to add your profile photo",
      [
        { text: "Take Photo", onPress: takePhoto },
        { text: "Choose from Library", onPress: pickImage },
        { text: "Cancel", style: "cancel" }
      ]
    );
  };

  const uploadImage = async () => {
    if (!image) {
      Alert.alert("Error", "Please select an image first");
      return;
    }

    console.log("Starting image upload...");
    console.log("Image URI:", image);
    
    setIsUploading(true);
    
    try {
      // First, test the API connection
      const isConnected = await testApiConnection();
      if (!isConnected) {
        throw new Error('Cannot connect to the server. Please check your internet connection.');
      }

      console.log("Preparing to upload image...");
      const formData = new FormData();
      
      // Create a file object with the correct structure for React Native
      const file = {
        uri: image,
        name: `profile_${Date.now()}.jpg`,
        type: 'image/jpeg',
      };
      
      formData.append('File', file as any);
      
      console.log("Sending request to upload image...");
      
      // Remove transformRequest to let axios handle FormData automatically
      const response = await api.post("/Profile/upload-image", formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      console.log("Upload response:", response);
      
      if (response.status >= 200 && response.status < 300) {
        console.log("Upload successful, navigating to Home");
        navigation.replace('Home');
      } else {
        // Handle potential response data structure
        const responseData = response.data as { message?: string };
        const errorMessage = responseData?.message || 'Failed to upload image';
        throw new Error(errorMessage);
      }
    } catch (err: any) {
      console.error("Upload error:", err);
      console.error("Error details:", err.response?.data || err.message);
      Alert.alert(
        "Upload Failed", 
        err.response?.data?.message || "Failed to upload image. Please try again."
      );
    } finally {
      setIsUploading(false);
    }
  };

  // Test API connection first
  const testApiConnection = async () => {
    try {
      console.log("Testing API connection...");
      const response = await api.get("/Profile/test");
      console.log("API connection test response:", response.data);
      return true;
    } catch (error: any) {
      console.error("API connection test failed:", {
        message: error.message,
        response: error.response?.data
      });
      return false;
    }
  };

  const skipImage = async () => {
    console.log("Skipping profile image...");
    setIsSkipping(true);
    
    try {
      // First, test the API connection
      const isConnected = await testApiConnection();
      if (!isConnected) {
        throw new Error('Cannot connect to the server. Please check your internet connection.');
      }

      console.log("Sending skip request...");
      
      const response = await api.post("/Profile/skip-image", {}, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      console.log("Skip response status:", response.status);
      console.log("Skip response data:", response.data);
      
      if (response.status >= 200 && response.status < 300) {
        console.log("Skip successful, navigating to Home");
        navigation.replace('Home');
      } else {
        // Handle potential response data structure
        const responseData = response.data as { message?: string };
        const errorMessage = responseData?.message || 'Failed to skip image upload';
        throw new Error(errorMessage);
      }
    } catch (err: any) {
      console.error("Skip error:", err);
      console.error("Error details:", err.response?.data || err.message);
      Alert.alert(
        "Error", 
        err.response?.data?.message || "Something went wrong. Please try again."
      );
    } finally {
      setIsSkipping(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.container}>
          {/* Header Section */}
          <View style={styles.header}>
            <Text style={styles.title}>Set Up Your Profile</Text>
            <Text style={styles.subtitle}>
              Add a profile photo to help others recognize you
            </Text>
          </View>

          {/* Profile Image Section */}
          <View style={styles.imageSection}>
            <TouchableOpacity 
              onPress={showImageOptions} 
              style={styles.imageContainer}
              activeOpacity={0.8}
            >
              {image ? (
                <Image source={{ uri: image }} style={styles.image} />
              ) : (
                <View style={styles.placeholder}>
                  <Ionicons name="camera" size={40} color="#E64A0D" />
                  <Text style={styles.placeholderText}>Add Photo</Text>
                </View>
              )}
              
              {/* Edit icon overlay */}
              <View style={styles.editIcon}>
                <Ionicons name="camera" size={20} color="#fff" />
              </View>
            </TouchableOpacity>

            {image && (
              <TouchableOpacity 
                onPress={() => setImage(null)} 
                style={styles.removeButton}
              >
                <Text style={styles.removeButtonText}>Remove Photo</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            {image && (
              <TouchableOpacity 
                style={[styles.primaryButton, isUploading && styles.disabledButton]} 
                onPress={uploadImage}
                disabled={isUploading}
              >
                {isUploading ? (
                  <View style={styles.buttonContent}>
                    <ActivityIndicator color="#fff" size="small" />
                    <Text style={styles.primaryButtonText}>Uploading...</Text>
                  </View>
                ) : (
                  <Text style={styles.primaryButtonText}>Save & Continue</Text>
                )}
              </TouchableOpacity>
            )}

            <TouchableOpacity 
              style={[styles.secondaryButton, isSkipping && styles.disabledButton]} 
              onPress={skipImage}
              disabled={isSkipping || isUploading}
            >
              {isSkipping ? (
                <View style={styles.buttonContent}>
                  <ActivityIndicator color="#E64A0D" size="small" />
                  <Text style={styles.secondaryButtonText}>Please wait...</Text>
                </View>
              ) : (
                <Text style={styles.secondaryButtonText}>Skip for Now</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Info Section */}
          <View style={styles.infoSection}>
            <Text style={styles.infoText}>
              You can always add or change your profile photo later in settings
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

export default ProfileSetup;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    alignItems: "center",
    justifyContent: "center",
    width: '100%',
  },
  header: {
    alignItems: "center",
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 16,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 18,
    color: "#666",
    textAlign: "center",
    lineHeight: 26,
    paddingHorizontal: 30,
  },
  imageSection: {
    alignItems: "center",
    marginBottom: 40,
  },
  imageContainer: {
    position: "relative",
    marginBottom: 20,
  },
  image: {
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 5,
    borderColor: "#E64A0D",
    shadowColor: "#E64A0D",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  placeholder: {
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 3,
    borderColor: "#E64A0D",
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff5f3",
    shadowColor: "#E64A0D",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  placeholderText: {
    marginTop: 12,
    fontSize: 18,
    fontWeight: "600",
    color: "#E64A0D",
  },
  editIcon: {
    position: "absolute",
    bottom: 15,
    right: 15,
    backgroundColor: "#E64A0D",
    borderRadius: 22,
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 4,
    borderColor: "#fff",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  removeButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  removeButtonText: {
    color: "#E64A0D",
    fontSize: 14,
    fontWeight: "500",
  },
  buttonContainer: {
    width: "100%",
    gap: 16,
  },
  primaryButton: {
    backgroundColor: "#E64A0D",
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 16,
    alignItems: "center",
    shadowColor: "#E64A0D",
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  secondaryButton: {
    backgroundColor: "transparent",
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 16,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#E64A0D",
  },
  secondaryButtonText: {
    color: "#E64A0D",
    fontSize: 18,
    fontWeight: "600",
  },
  disabledButton: {
    opacity: 0.6,
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  infoSection: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
  infoText: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
    lineHeight: 20,
  },
});