import React, { useState } from 'react';
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
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import RoleBasedBottomNav from "../component/rolebasedNav";

import Ionicons from "react-native-vector-icons/Ionicons";

// Define your stack param list
type RootStackParamList = {
  EditProfile: undefined;
  // Add other screens here if needed
};

// Define the type for navigation prop
type OrgProfileNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'EditProfile'
>;

const EditProfile: React.FC = () => {
  const navigation = useNavigation<OrgProfileNavigationProp>();

  // State for form fields
  const [name, setName] = useState('WSO2');
  const [username, setUsername] = useState('WSO2');
  const [bio, setBio] = useState('Trusted by World\'s enterprise');
  const [email, setEmail] = useState('wso2@gmail.com');
  const [contactNumber, setContactNumber] = useState('0917336763');

  const handleSave = () => {
    // Handle save functionality
    console.log('Saving profile...');
  };

  const handleGoBack = () => {
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#FF5722" barStyle="light-content" />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Picture Section */}
        <View style={styles.profilePictureSection}>
          <View style={styles.profileImageContainer}>
            <Image
              source={require("../assets/icon.png")}
              style={styles.profileImage}
            />
          </View>
          <TouchableOpacity>
            <Text style={styles.changePictureText}>Change profile picture</Text>
          </TouchableOpacity>
        </View>

        {/* Form Fields */}
        <View style={styles.formSection}>
          {/* Name Field */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Name</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.textInput}
                value={name}
                onChangeText={setName}
                placeholder="Enter name"
              />
              <TouchableOpacity style={styles.editIcon}>
                <Ionicons name="create-outline" size={20} color="#666" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Username Field */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>UserName</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.textInput}
                value={username}
                onChangeText={setUsername}
                placeholder="Enter username"
              />
              <TouchableOpacity style={styles.editIcon}>
                <Ionicons name="create-outline" size={20} color="#666" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Bio Field */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Bio</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.textInput}
                value={bio}
                onChangeText={setBio}
                placeholder="Enter bio"
              />
              <TouchableOpacity style={styles.editIcon}>
                <Ionicons name="create-outline" size={20} color="#666" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Mail Field */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Mail</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.textInput}
                value={email}
                onChangeText={setEmail}
                placeholder="Enter email"
                keyboardType="email-address"
              />
              <TouchableOpacity style={styles.editIcon}>
                <Ionicons name="create-outline" size={20} color="#666" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Contact Number Field */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Contact Number</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.textInput}
                value={contactNumber}
                onChangeText={setContactNumber}
                placeholder="Enter contact number"
                keyboardType="phone-pad"
              />
              <TouchableOpacity style={styles.editIcon}>
                <Ionicons name="open-outline" size={20} color="#666" />
              </TouchableOpacity>
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
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FF5722',
    paddingHorizontal: 16,
    paddingVertical: 12,
    height: 56,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '500',
  },
  content: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  profilePictureSection: {
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    paddingVertical: 24,
    marginBottom: 20,
  },
  profileImageContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FF5722',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    overflow: 'hidden',
  },
  profileImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  changePictureText: {
    color: '#FF5722',
    fontSize: 14,
    fontWeight: '500',
  },
  formSection: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    paddingVertical: 8,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#666',
    paddingVertical: 4,
  },
  editIcon: {
    padding: 4,
  },
  saveButtonContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 20,
    alignItems: 'flex-end',
  },
  saveButton: {
    backgroundColor: '#FF5722',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 6,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 100,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FF5722',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
  },
});

export default EditProfile;