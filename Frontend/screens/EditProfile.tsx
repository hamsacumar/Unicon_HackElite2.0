import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  SafeAreaView,
  StatusBar,
  TextInput,
  Alert,
} from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useNavigation } from "@react-navigation/native";
import RoleBasedBottomNav from "../component/rolebasedNav";
import { updateProfile, ProfileService } from "../services/ProfileService";
import type { ProfileResponse, ProfileUpdateRequest } from "../services/ProfileService";
import Constants from "expo-constants";

const API_URL = Constants.expoConfig?.extra?.apiUrl?.replace("/api", "");

type RootStackParamList = {
  EditProfile: undefined;
    ProfileSetup: undefined;
};

type OrgProfileNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "EditProfile"
>;

const EditProfile: React.FC = () => {
  const navigation = useNavigation<OrgProfileNavigationProp>();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [bio, setBio] = useState("");
  const [username, setUsername] = useState("");
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const profile: ProfileResponse = await ProfileService.getProfile();
        setFirstName(profile.firstName || "");
        setLastName(profile.lastName || "");
        setBio(profile.description || "");
        setUsername(profile.username || "");
        setProfileImageUrl(profile.profileImageUrl || null);
      } catch (error) {
        console.error("Error loading profile:", error);
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, []);

  const handleSave = async () => {
   const payload: ProfileUpdateRequest = {
  firstName: firstName.trim() || null,
  lastName: lastName.trim() || null,
  username: username.trim() || null,
  description: bio.trim() || "", // allow empty string
  profileImageUrl: profileImageUrl
    ? profileImageUrl.startsWith("http")
      ? profileImageUrl
      : `${API_URL}${profileImageUrl}`
    : null,
};


    console.log("Updating profile with:", payload);

    const updated = await updateProfile(payload);

    if (updated) {
      setFirstName(updated.firstName || "");
      setLastName(updated.lastName || "");
      setBio(updated.description || "");
      setUsername(updated.username || "");
      setProfileImageUrl(updated.profileImageUrl || null);

      Alert.alert("Success", "Profile updated successfully");
    } else {
      Alert.alert("Error", "Failed to update profile");
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={{ marginTop: 50, textAlign: "center" }}>
          Loading profile...
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#FF5722" barStyle="light-content" />
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.profilePictureSection}>
          <View style={styles.profileImageContainer}>
            <Image
              source={
                profileImageUrl
                  ? {
                      uri: profileImageUrl.startsWith("http")
                        ? profileImageUrl
                        : `${API_URL}${profileImageUrl}`,
                    }
                  : require("../assets/icon.png")
              }
              style={styles.profileImage}
            />
          </View>
         <TouchableOpacity onPress={() => navigation.navigate("ProfileSetup")}>
  <Text style={styles.changePictureText}>Change profile picture</Text>
</TouchableOpacity>

        </View>

        <View style={styles.formSection}>
          <InputField label="First Name" value={firstName} onChange={setFirstName} />
          <InputField label="Last Name" value={lastName} onChange={setLastName} />
          <InputField label="Username" value={username} onChange={setUsername} />
          <InputField label="Bio" value={bio} onChange={setBio} />
        </View>

        <View style={styles.saveButtonContainer}>
          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>Save</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <RoleBasedBottomNav navigation={navigation} />
    </SafeAreaView>
  );
};

const InputField = ({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (text: string) => void;
}) => (
  <View style={styles.inputGroup}>
    <Text style={styles.label}>{label}</Text>
    <View style={styles.inputContainer}>
      <TextInput
        style={styles.textInput}
        value={value}
        onChangeText={onChange}
        placeholder={`Enter ${label.toLowerCase()}`}
      />
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  content: { flex: 1, backgroundColor: "#F5F5F5" },
  profilePictureSection: {
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    paddingVertical: 24,
    marginBottom: 20,
  },
  profileImageContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#FF5722",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
    overflow: "hidden",
  },
  profileImage: { width: "100%", height: "100%", resizeMode: "cover" },
  changePictureText: { color: "#FF5722", fontSize: 14, fontWeight: "500" },
  formSection: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  inputGroup: { marginBottom: 24 },
  label: { fontSize: 14, fontWeight: "500", color: "#333", marginBottom: 8 },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
    paddingVertical: 8,
  },
  textInput: { flex: 1, fontSize: 16, color: "#666", paddingVertical: 4 },
  saveButtonContainer: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 20,
    alignItems: "flex-end",
  },
  saveButton: {
    backgroundColor: "#FF5722",
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 6,
  },
  saveButtonText: { color: "#FFFFFF", fontSize: 14, fontWeight: "500" },
});

export default EditProfile;
