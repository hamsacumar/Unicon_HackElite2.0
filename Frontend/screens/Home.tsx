// screens/Home.tsx
import React from "react";
import { View, Text, FlatList, StyleSheet, Image, TouchableOpacity } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../App";
import RoleBasedBottomNav from "../component/rolebasedNav";

// 1. Dummy JSON data (static posts for now)
const dummyPosts = [
  {
    id: "1",
    company: "WSO2",
    title: "Proposal Submission Open",
    description: "Submit your proposal for Innovate with Ballerina 2025!",
    image: "https://via.placeholder.com/400x200.png?text=Event+1",
  },
  {
    id: "2",
    company: "IEEE",
    title: "Workshop on Data Handling",
    description: "Learn about Data Handling with industry experts.",
    image: "https://via.placeholder.com/400x200.png?text=Event+2",
  },
];

// Define navigation type for Home screen
type HomeNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

// 2. Home Screen Component
export default function Home() {
  const navigation = useNavigation<HomeNavigationProp>();

  return (
    <View style={styles.container}>
      <FlatList
        data={dummyPosts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.postCard}>
            <Image source={{ uri: item.image }} style={styles.postImage} />
            <Text style={styles.company}>{item.company}</Text>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.description}>{item.description}</Text>

            {/* Like + Comment buttons (just UI now) */}
            <View style={styles.actions}>
              <TouchableOpacity>
                <Text style={styles.actionButton}>❤️ Like</Text>
              </TouchableOpacity>
              <TouchableOpacity>
                <Text style={styles.actionButton}>💬 Comment</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        // Add some bottom padding to avoid content being hidden behind footer
        contentContainerStyle={styles.listContent}
      />
      
      {/* Add Role-Based Bottom Navigation Footer */}
      <RoleBasedBottomNav navigation={navigation} />
    </View>
  );
}

// 3. Styles (updated to accommodate footer)
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  listContent: {
    padding: 10,
    paddingBottom: 100, // Extra padding to ensure content isn't hidden behind footer
  },
  postCard: {
    backgroundColor: "#f9f9f9",
    marginBottom: 15,
    padding: 10,
    borderRadius: 10,
  },
  postImage: {
    width: "100%",
    height: 150,
    borderRadius: 8,
  },
  company: {
    fontWeight: "bold",
    marginTop: 8,
    fontSize: 16,
  },
  title: {
    fontSize: 14,
    marginTop: 4,
    color: "#333",
  },
  description: {
    fontSize: 12,
    marginTop: 2,
    color: "#666",
  },
  actions: {
    flexDirection: "row",
    marginTop: 8,
    justifyContent: "space-around",
  },
  actionButton: {
    fontSize: 14,
    fontWeight: "600",
    color: "#e74c3c",
  },
});