// screens/Test.tsx
import React, { useEffect, useState } from "react";
import { View, Text, FlatList, StyleSheet, Button } from "react-native";
import { getTestData } from "../services/api";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useNavigation } from "@react-navigation/native";
import BottomNav from "../component/bottomNav";

// Define your stack param list
type RootStackParamList = {
  Test: undefined;
  OrgProfile: undefined;
  OrgSettings: undefined;
  StuProfile: undefined;
};

// Type for navigation prop
type TestNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "Test"
>;

// Define the type for each data item
interface TestDataItem {
  id: string;
  value: string;
}

const Test: React.FC = () => {
  const navigation = useNavigation<TestNavigationProp>();
  const [data, setData] = useState<TestDataItem[]>([]);

  useEffect(() => {
    fetchTestData();
  }, []);

  const fetchTestData = async () => {
    const result = await getTestData();
    setData(result);
  };

  return (
    <View style={styles.container}>
      <Button
        title="OrgSettings"
        onPress={() => navigation.navigate("OrgSettings")}
      />
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
      <BottomNav
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
