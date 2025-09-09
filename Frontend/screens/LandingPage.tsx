// screens/LandingPage.tsx

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
import BottomNav from "../component/bottomNav";
import { EventItem, getEvents } from "../services/eventService";
import Constants from "expo-constants";

// ---------------------
// Type for navigation props
// ---------------------
type LandingPageNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "LandingPage"
>;

// ---------------------
// Base API URL from Expo constants
// ---------------------
const API_URL = Constants.expoConfig?.extra?.apiUrl?.replace("/api", "");

export default function LandingPage() {
  const navigation = useNavigation<LandingPageNavigationProp>();
  const [events, setEvents] = useState<EventItem[]>([]);

  // ---------------------
  // Fetch public posts (no login required)
  // ---------------------
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

  // Navigate to PostDetail screen when a post is clicked
  const handlePostPress = (item: EventItem) => {
    navigation.navigate("PostDetail", { post: item });
  };

  return (
    <View style={styles.container}>
      {/* Post Feed */}
      <FlatList
        data={events}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.postCard}>
            {/* ---------------------
                Profile Row
              --------------------- */}
            <View style={styles.userRow}>
              <Image
                source={{
                  uri: item.userImage
                    ? (item.userImage.startsWith("http")
                        ? item.userImage
                        : `${API_URL}${item.userImage}`)
                    : "https://cdn-icons-png.flaticon.com/512/3135/3135715.png",
                }}
                style={styles.avatar}
              />
              <Text style={styles.username}>{item.username}</Text>
            </View>

            {/* ---------------------
                Post Image (clickable)
              --------------------- */}
            {item.imageUrl ? (
              <TouchableOpacity onPress={() => handlePostPress(item)}>
                <Image
                  source={{
                    uri: item.imageUrl.startsWith("http")
                      ? item.imageUrl
                      : `${API_URL}${item.imageUrl.startsWith("/") ? "" : "/"}${item.imageUrl}`,
                  }}
                  style={styles.postImage}
                  resizeMode="cover"
                />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity onPress={() => handlePostPress(item)}>
                <View style={styles.noImage}>
                  <Text style={styles.noImageText}>No Image</Text>
                </View>
              </TouchableOpacity>
            )}

            {/* ---------------------
                Post Info (category, title, description)
              --------------------- */}
            <TouchableOpacity onPress={() => handlePostPress(item)}>
              <Text style={styles.category}>{item.category}</Text>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.description}>{item.description}</Text>
            </TouchableOpacity>

            {/* ---------------------
                Stats (Only counts for guests)
                - No like/comment buttons for unauthenticated users
              --------------------- */}
            <View style={styles.statsContainer}>
              <Text style={styles.statsText}>
                {item.likeCount || 0} {item.likeCount === 1 ? "Like" : "Likes"}
              </Text>
              <Text style={[styles.statsText, { marginLeft: 16 }]}>
                {item.commentCount || 0}{" "}
                {item.commentCount === 1 ? "Comment" : "Comments"}
              </Text>
            </View>
          </View>
        )}
        contentContainerStyle={styles.listContent}
      />

      {/* ---------------------
          Bottom Navigation (Login / Signup buttons)
        --------------------- */}
      <BottomNav
        onPressLogin={() => navigation.navigate("Login")}
        onPressRegister={() => navigation.navigate("Signup")}
      />
    </View>
  );
}

// ====================
// Styles
// ====================
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  listContent: { padding: 10, paddingBottom: 100 },

  postCard: {
    backgroundColor: "#f9f9f9",
    marginBottom: 15,
    padding: 12,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 5,
    elevation: 4,
  },

  userRow: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  avatar: { width: 42, height: 42, borderRadius: 21, marginRight: 10 },
  username: { fontWeight: "600", fontSize: 15, color: "#333" },

  postImage: { width: "100%", height: 200, borderRadius: 10, marginTop: 6 },
  noImage: {
    width: "100%",
    height: 200,
    borderRadius: 10,
    backgroundColor: "#ddd",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 6,
  },
  noImageText: { color: "#555", fontSize: 14 },

  category: {
    fontWeight: "bold",
    marginTop: 10,
    fontSize: 14,
    color: "#E64A0D",
    textTransform: "uppercase",
  },
  title: { fontSize: 18, marginTop: 4, fontWeight: "700", color: "#222" },
  description: { fontSize: 14, marginTop: 6, color: "#555", lineHeight: 20 },

  statsContainer: {
    flexDirection: "row",
    paddingTop: 10,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  statsText: { fontSize: 14, color: "#666" },
});
