//screens / Home.tsx

import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Image,
  TouchableOpacity,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../App";
import { EventItem, getEvents } from "../services/eventService";
import Constants from "expo-constants";
import PostActions from "../component/PostActions";
import RoleBasedBottomNav from "./Profile";
// Type for navigation props
type HomeNavigationProp = NativeStackNavigationProp<RootStackParamList, "Home">;
// Base API URL from Expo constants
const API_URL = Constants.expoConfig?.extra?.apiUrl?.replace("/api", "");

export default function Home() {
  const navigation = useNavigation<HomeNavigationProp>();
  const [events, setEvents] = useState<EventItem[]>([]);

  useEffect(() => {
    async function fetchData() {
      try {
        const data = await getEvents();
        setEvents(data);
      } catch (error) {
        console.error("Error fetching events:", error);
      }
    }
    fetchData();
  }, []);

  const handlePostPress = (item: EventItem) => {
    navigation.navigate("PostDetail", { post: item });
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={events}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.postCard}>
            {/* Profile section */}
            <View style={styles.userRow}>
              <Image
                source={{
                  uri: item.userImage
                    ? item.userImage
                    : "https://cdn-icons-png.flaticon.com/512/3135/3135715.png",
                }}
                style={styles.avatar}
              />
              <Text style={styles.username}>{item.username}</Text>
            </View>

            {/* Post image (clickable) */}
            {item.imageUrl ? (
              <TouchableOpacity onPress={() => handlePostPress(item)}>
                <Image
                  source={{
                    uri: item.imageUrl.startsWith("http")
                      ? item.imageUrl
                      : `${API_URL}${item.imageUrl.startsWith("/") ? "" : "/"}${item.imageUrl}`,
                  }}
                  style={styles.postImage}
                />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity onPress={() => handlePostPress(item)}>
                <View style={styles.noImage}>
                  <Text style={styles.noImageText}>No Image</Text>
                </View>
              </TouchableOpacity>
            )}

            {/* Post category, title, and description (clickable) */}
            <TouchableOpacity onPress={() => handlePostPress(item)}>
              <Text style={styles.category}>{item.category}</Text>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.description}>{item.description}</Text>
            </TouchableOpacity>

            {/* Post actions: Like + Comment */}
            <PostActions
              postId={item.id}
              userId={null} // Pass null for unauthenticated users
              initialLikeCount={item.likeCount || 0}
              initialCommentCount={item.commentCount || 0}
              onCommentPress={() => {
                // For unauthenticated users, you might want to show a login prompt
                // For now, we'll just log to console
                console.log("Please login to comment");
              }}
            />
          </View>
        )}
        contentContainerStyle={styles.listContent}
      />

      <RoleBasedBottomNav navigation={navigation} />
    </View>
  );
}

// Styles
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  listContent: { padding: 10, paddingBottom: 100 },

  postCard: {
    backgroundColor: "#f9f9f9",
    marginBottom: 15,
    padding: 10,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 4,
  },

  userRow: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  avatar: { width: 40, height: 40, borderRadius: 20, marginRight: 10 },
  username: { fontWeight: "600", fontSize: 14, color: "#333" },

  postImage: { width: "100%", height: 150, borderRadius: 8 },
  noImage: {
    width: "100%",
    height: 150,
    borderRadius: 8,
    backgroundColor: "#ddd",
    justifyContent: "center",
    alignItems: "center",
  },
  noImageText: { color: "#555" },

  category: {
    fontWeight: "bold",
    marginTop: 8,
    fontSize: 14,
    color: "#E64A0D",
  },
  title: { fontSize: 16, marginTop: 4, fontWeight: "600", color: "#333" },
  description: { fontSize: 13, marginTop: 4, color: "#666" },
});
