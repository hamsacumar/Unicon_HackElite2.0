// screens/LandingPostDetail.tsx

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  FlatList,
} from "react-native";
import { RouteProp } from "@react-navigation/native";
import { RootStackParamList } from "../App";
import { getEventById, EventItem } from "../services/eventService";
import { Ionicons } from "@expo/vector-icons";
import { format } from "date-fns";
import Constants from "expo-constants";
import BottomNav from "../component/bottomNav";
import PostText from "../component/PostText";

const API_URL = Constants.expoConfig?.extra?.apiUrl?.replace("/api", "");

type LandingPostDetailRouteProp = RouteProp<RootStackParamList, "LandingPostDetail">;
type LandingPostDetailNavigationProp = any;

type Props = {
  route: LandingPostDetailRouteProp;
  navigation: LandingPostDetailNavigationProp;
};

export default function LandingPostDetail({ route, navigation }: Props) {
  const { post: initialPost } = route.params;
  const postId = initialPost?.id;

  // ---------- State ----------
  const [post, setPost] = useState<EventItem | null>(initialPost || null);
  const [isLoading, setIsLoading] = useState(true);

  // ---------- Fetch post details ----------
  useEffect(() => {
    if (!postId) return;

    const fetchPost = async () => {
      try {
        setIsLoading(true);
        const postData = await getEventById(postId);
        if (postData) {
          setPost(postData);
        }
      } catch (error) {
        console.error("Error fetching post:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPost();
  }, [postId]);

  // ---------- Render loading / error ----------
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#e74c3c" />
      </View>
    );
  }

  if (!post) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={48} color="#e74c3c" />
        <Text style={styles.errorText}>Post not found</Text>
      </View>
    );
  }

  // ---------- Main Render ----------
  return (
    <View style={styles.container}>
      <FlatList
        data={[]} // no actual list items
        keyExtractor={() => "dummy"}
        renderItem={null}
        ListHeaderComponent={
          <>
            {/* User Profile Row */}
            <View style={styles.userRow}>
              <Image
                source={{
                  uri: post.userImage
                    ? (post.userImage.startsWith("http")
                        ? post.userImage
                        : `${API_URL}${post.userImage}`)
                    : "https://cdn-icons-png.flaticon.com/512/3135/3135715.png",
                }}
                style={styles.avatar}
              />
              <View>
                <Text style={styles.username}>{post.username}</Text>
                <Text style={styles.timestamp}>
                  {post.date ? format(new Date(post.date), "MMM d, yyyy") : "Recent"}
                </Text>
              </View>
            </View>

            {/* Post Content */}
            <View style={styles.contentContainer}>
              <Text style={styles.category}>{post.category}</Text>
              <Text style={styles.title}>{post.title}</Text>
              <PostText content={post.description} style={styles.description} />
              {post.imageUrl && (
                <Image
                  source={{
                    uri: post.imageUrl.startsWith("http")
                      ? post.imageUrl
                      : `${API_URL}${post.imageUrl.startsWith("/") ? "" : "/"}${post.imageUrl}`,
                  }}
                  style={styles.postImage}
                  resizeMode="contain"
                />
              )}
            </View>

            {/* Stats with Disabled Buttons */}
            <View style={styles.statsRow}>
              <TouchableOpacity disabled style={styles.disabledButton}>
                <Ionicons name="heart-outline" size={20} color="#bbb" />
                <Text style={styles.statsText}>{post.likeCount || 0}</Text>
              </TouchableOpacity>

              <TouchableOpacity disabled style={[styles.disabledButton, { marginLeft: 16 }]}>
                <Ionicons name="chatbubble-outline" size={20} color="#bbb" />
                <Text style={styles.statsText}>{post.commentCount || 0}</Text>
              </TouchableOpacity>
            </View>
          </>
        }
        contentContainerStyle={{ paddingBottom: 100 }}
      />

      {/* Bottom Nav for login/register */}
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
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  errorContainer: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20 },
  errorText: { marginTop: 16, fontSize: 16, color: "#666" },
  userRow: { flexDirection: "row", alignItems: "center", padding: 16, paddingBottom: 8 },
  avatar: { width: 42, height: 42, borderRadius: 21, marginRight: 10, backgroundColor: "#f0f0f0" },
  username: { fontWeight: "600", fontSize: 15, color: "#333" },
  timestamp: { fontSize: 12, color: "#999", marginTop: 2 },
  contentContainer: { paddingHorizontal: 16, paddingBottom: 12 },
  category: {
    fontSize: 12,
    fontWeight: "600",
    color: "#e74c3c",
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  title: { fontSize: 20, fontWeight: "700", color: "#222", marginBottom: 8, lineHeight: 26 },
  description: { fontSize: 15, color: "#444", lineHeight: 22, marginBottom: 12 },
  postImage: { width: "100%", height: 280, borderRadius: 8, marginTop: 8, backgroundColor: "#f5f5f5" },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderColor: "#f0f0f0",
  },
  disabledButton: { flexDirection: "row", alignItems: "center", opacity: 0.6 },
  statsText: { marginLeft: 6, fontSize: 14, color: "#999" },
});
