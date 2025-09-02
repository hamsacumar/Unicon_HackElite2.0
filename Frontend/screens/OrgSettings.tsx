// screens/OrgSettings.tsx
import React from 'react';
import { View, Text, StyleSheet, Button } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';

import RoleBasedBottomNav from "../component/rolebasedNav";

// Define your stack param list
type RootStackParamList = {
  OrgSettings: undefined;
  // Add other screens here if needed
};

// Define the type for navigation prop
type OrgSettingsNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'OrgSettings'
>;

const OrgSettings: React.FC = () => {
  const navigation = useNavigation<OrgSettingsNavigationProp>();

  return (
    <View style={styles.container}>
      <Text>This is the Org Settings Screen</Text>
      <Button title="Go Back" onPress={() => navigation.goBack()} />
    <RoleBasedBottomNav navigation={navigation} />
    </View>
          

  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default OrgSettings;
