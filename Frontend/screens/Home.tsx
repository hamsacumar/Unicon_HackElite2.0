// screens/Home.tsx

import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Image,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../App";
import { EventItem, getEvents } from "../services/eventService";
import Constants from "expo-constants";
import PostActions from "../component/PostActions";
import RoleBasedBottomNav from "./Profile";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Type for navigation props
type HomeNavigationProp = NativeStackNavigationProp<RootStackParamList, "Home">;

// Base API URL
 const API_URL = Constants.expoConfig?.extra?.apiUrl?.replace("/api", "");
// const TEMP_USER_ID = "niro1234"; // any unique string
export default function Home() {
  const navigation = useNavigation<HomeNavigationProp>();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch logged-in user ID
  useEffect(() => {
    async function fetchUser() {
      try {
        const id = await AsyncStorage.getItem("userId"); // adjust key if needed
        if (id) setUserId(id);
      } catch (err) {
        console.error("Error fetching userId:", err);
      }
    }
    fetchUser();
  }, []);

  /*useEffect(() => {
  async function fetchUser() {
    try {
      let id = await AsyncStorage.getItem("userId"); // try to get stored ID
      if (!id) {
        // if not found, set the temp ID
        await AsyncStorage.setItem("userId", TEMP_USER_ID);
        id = TEMP_USER_ID;
      }
      setUserId(id); // update state
    } catch (err) {
      console.error("Error fetching userId:", err);
    }
  }
  fetchUser();
}, []);

  */
  // Fetch events
  useEffect(() => {
    async function fetchData() {
      try {
        const data = await getEvents();
        setEvents(data);
      } catch (error) {
        console.error("Error fetching events:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const handlePostPress = (item: EventItem) => {
    navigation.navigate("PostDetail", { post: item, userId });
  };

  if (loading)
    return (
      <ActivityIndicator
        size="large"
        color="#e74c3c"
        style={{ flex: 1, justifyContent: "center" }}
      />
    );

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
              userId={userId} // ✅ logged-in user temporary
              initialLikeCount={item.likeCount || 0}
              initialCommentCount={item.commentCount || 0}
              onCommentPress={() => handlePostPress(item)} // navigate to PostDetail for commenting
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
