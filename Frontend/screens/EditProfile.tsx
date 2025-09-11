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
import {
  getProfile,
  updateProfile,
  ProfileResponse,
  ProfileUpdateRequest,
} from "../services/api/api";

type RootStackParamList = {
  EditProfile: undefined;
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      const profile = await getProfile();
      if (profile) {
        setFirstName(profile.firstName || "");
        setLastName(profile.lastName || "");
        setBio(profile.description || "");
        setUsername(profile.username || "");
      }
      setLoading(false);
    };
    loadProfile();
  }, []);

  const handleSave = async () => {
    const updated: ProfileResponse | null = await updateProfile({
      firstName,
      lastName,
      description: bio,
      username,
    } as ProfileUpdateRequest);

    if (updated) {
      setFirstName(updated.firstName);
      setLastName(updated.lastName);
      setBio(updated.description);
      setUsername(updated.username);

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
        {/* Profile Picture */}
        <View style={styles.profilePictureSection}>
          <View style={styles.profileImageContainer}>
            <Image
              source={require("../assets/icon.png")}
              style={styles.profileImage}
            />
          </View>
          <TouchableOpacity>
            <Text style={styles.changePictureText}>
              Change profile picture
            </Text>
          </TouchableOpacity>
        </View>

        {/* Form Fields */}
        <View style={styles.formSection}>
          {/* First Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>First Name</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.textInput}
                value={firstName}
                onChangeText={setFirstName}
                placeholder="Enter first name"
              />
            </View>
          </View>

          {/* Last Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Last Name</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.textInput}
                value={lastName}
                onChangeText={setLastName}
                placeholder="Enter last name"
              />
            </View>
          </View>

          {/* Username */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Username</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.textInput}
                value={username}
                onChangeText={setUsername}
                placeholder="Enter username"
              />
            </View>
          </View>

          {/* Bio */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Bio</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.textInput}
                value={bio}
                onChangeText={setBio}
                placeholder="Enter bio"
              />
            </View>
          </View>
        </View>

        {/* Save Button */}
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
