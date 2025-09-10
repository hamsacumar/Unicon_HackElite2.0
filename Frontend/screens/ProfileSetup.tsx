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
  ScrollView,
  Platform,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import Constants from "expo-constants";
import axios from "axios";
import * as SecureStore from "expo-secure-store";
import { Ionicons } from "@expo/vector-icons";

import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../App";
import { useAuth } from "../utils/AuthContext";


type ProfileSetupScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "ProfileSetup"
>;

export default function ProfileSetup({
  navigation,
}: {
  navigation: ProfileSetupScreenNavigationProp;
}) {
  const [image, setImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSkipping, setIsSkipping] = useState(false);
  const { token } = useAuth();

  // Get backend URL from Expo constants
  const BASE_URL = Constants.expoConfig?.extra?.apiUrl;

  const pickImage = async () => {
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert(
        "Permission Required",
        "Permission to access camera roll is required!"
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"], // <-- use 'images' string array instead of MediaTypeOptions
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

    if (!permissionResult.granted) {
      Alert.alert(
        "Permission Required",
        "Permission to access camera is required!"
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"], // <-- use 'images' string array
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
        { text: "Cancel", style: "cancel" },
      ]
    );
  };

  const uploadImage = async () => {
    if (!image) return;

    setIsUploading(true);

    try {
      const fileExt = image.split(".").pop()?.toLowerCase() || "jpg";
      const fileName = `profile_${Date.now()}.${fileExt}`;
      const fileType = `image/${fileExt === "png" ? "png" : "jpeg"}`;

      const formData = new FormData();

      if (Platform.OS === "web") {
        const response = await fetch(image);
        const blob = await response.blob();
        const file = new File([blob], fileName, { type: fileType });
        formData.append("File", file);
      } else {
        // React Native mobile
        // @ts-ignore
        formData.append("File", {
          uri: image,
          name: fileName,
          type: fileType,
        });
      }

      const savedToken =
        token || (await SecureStore.getItemAsync("accessToken"));

      const res = await axios.post(
        `${BASE_URL}/profile/upload-image`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${savedToken}`,
          },
          onUploadProgress: (event) => {
            if (event.total) {
              const progress = Math.round((event.loaded / event.total) * 100);
              console.log(`Upload progress: ${progress}%`);
            }
          },
        }
      );

      console.log("Upload successful:", res.data);
      Alert.alert("Success", "Profile photo uploaded successfully!");
      navigation.replace("Home");
    } catch (error: any) {
      console.error("Upload error:", error);
      let errorMessage = "Failed to upload image";
      if (error.response) {
        errorMessage =
          error.response.data?.message || error.response.statusText;
      } else if (error.message) {
        errorMessage = error.message;
      }
      Alert.alert("Upload Failed", errorMessage);
    } finally {
      setIsUploading(false);
    }
  };

  const skipImage = async () => {
    setIsSkipping(true);
    try {
      const savedToken =
        token || (await SecureStore.getItemAsync("accessToken"));
      await axios.post(
        `${BASE_URL}/profile/skip-image`,
        {},
        {
          headers: { Authorization: `Bearer ${savedToken}` },
        }
      );
      navigation.replace("Home");
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Something went wrong. Please try again.");
    } finally {
      setIsSkipping(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Set Up Your Profile</Text>
            <Text style={styles.subtitle}>
              Add a profile photo to help others recognize you
            </Text>
          </View>

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

          <View style={styles.buttonContainer}>
            {image && (
              <TouchableOpacity
                style={[
                  styles.primaryButton,
                  isUploading && styles.disabledButton,
                ]}
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
              style={[
                styles.secondaryButton,
                isSkipping && styles.disabledButton,
              ]}
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

// Your existing styles remain unchanged
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#fff" },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  header: { alignItems: "center", marginBottom: 40 },
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
  imageSection: { alignItems: "center", marginBottom: 40 },
  imageContainer: { position: "relative", marginBottom: 20 },
  image: {
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 5,
    borderColor: "#E64A0D",
    shadowColor: "#E64A0D",
    shadowOffset: { width: 0, height: 8 },
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
    shadowOffset: { width: 0, height: 4 },
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
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  removeButton: { paddingVertical: 8, paddingHorizontal: 16 },
  removeButtonText: { color: "#E64A0D", fontSize: 14, fontWeight: "500" },
  buttonContainer: { width: "100%", gap: 16 },
  primaryButton: {
    backgroundColor: "#E64A0D",
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 16,
    alignItems: "center",
    shadowColor: "#E64A0D",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  primaryButtonText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  secondaryButton: {
    backgroundColor: "transparent",
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 16,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#E64A0D",
  },
  secondaryButtonText: { color: "#E64A0D", fontSize: 18, fontWeight: "600" },
  disabledButton: { opacity: 0.6 },
  buttonContent: { flexDirection: "row", alignItems: "center", gap: 8 },
  infoSection: { marginTop: 20, paddingHorizontal: 20 },
  infoText: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
    lineHeight: 20,
  },
});
