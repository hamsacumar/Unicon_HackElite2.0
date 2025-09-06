import React, { useEffect, useState } from "react";
import { View, Text, FlatList, StyleSheet, Button } from "react-native";
import { getTestData } from "../services/api";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useNavigation } from "@react-navigation/native";

// Define your stack param list
type RootStackParamList = {
  Test: undefined;
  OrgProfile: undefined;
  LandingPage: undefined;
  Home: undefined;
  // Add other screens here if needed
  InputPage: undefined;
  InboxScreen: { currentUserId: string };
  Chat: {
    currentUserId: string;
    otherUserId: string;
    currentUsername: string;
    otherUsername: string;
  };
  Login: undefined;
  Signup: undefined;
};

// Type for navigation prop
type TestNavigationProp = NativeStackNavigationProp<RootStackParamList, "Test">;

interface TestDataItem {
  id: string;
  value: string;
}

const Test: React.FC = () => {
  const navigation = useNavigation<TestNavigationProp>();
  const [data, setData] = useState<TestDataItem[]>([]);
  const currentUserId = "user1"; // example user id

  useEffect(() => {
    fetchTestData();
  }, []);

  const fetchTestData = async () => {
    const result = await getTestData();
    setData(result);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Test Data</Text>
      <FlatList
        data={data}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Text style={styles.item}>
            ID: {item.id} | Value: {item.value}
          </Text>
        )}
      />
      <Button
        title="Login"
        onPress={() => navigation.navigate("Login")}
      />
      <Button
        title="Signup"
        onPress={() => navigation.navigate("Signup")}
      />
      <Button
        title="OrgProfile"
        onPress={() => navigation.navigate("OrgProfile")}
      />
      <Button
        title="Landingpage"
        onPress={() => navigation.navigate("LandingPage")}
      />

      <Button title="Home" onPress={() => navigation.navigate("Home")} />
      <Button
        title="Input Page"
        onPress={() => navigation.navigate("InputPage")}
      />

      {/* Navigate to Chat with required params */}
   
      <Button
        title="Message Page"
        onPress={() => navigation.navigate("MessagePage")}
      />
     

      
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    marginTop: 40,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
  },
  item: {
    fontSize: 16,
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
});

export default Test;
