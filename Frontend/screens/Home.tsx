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
import {
  EventItem,
  getEvents,
  getComments,
  getCommentCount,
  Comment,
  isBookmarked,
} from "../services/eventService";
import Constants from "expo-constants";
import PostActions from "../component/PostActions";
import RoleBasedBottomNav from "./Profile";
import AsyncStorage from "@react-native-async-storage/async-storage";
import CommentSection from "../component/CommentSection";

type HomeNavigationProp = NativeStackNavigationProp<RootStackParamList, "Home">;

type EventWithUI = Omit<EventItem, 'comments' | 'commentCount'> & { 
  showComments?: boolean;
  comments?: Comment[];
  commentCount?: number;
  isBookmarked?: boolean;
};

const API_URL = Constants.expoConfig?.extra?.apiUrl?.replace("/api", "");

export default function Home() {
  const navigation = useNavigation<HomeNavigationProp>();
  const [events, setEvents] = useState<EventWithUI[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch userId from AsyncStorage
  useEffect(() => {
    async function fetchUser() {
      try {
        const id = await AsyncStorage.getItem("userId");
        if (id) setUserId(id);
      } catch (err) {
        console.error("Error fetching userId:", err);
      }
    }
    fetchUser();
  }, []);

  // Fetch events, comments, and bookmark status
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const data = await getEvents();

        const postsWithUI = await Promise.all(
          data.map(async (post) => {
            const [comments, commentCount, bookmarked] = await Promise.all([
              getComments(post.id),
              getCommentCount(post.id),
              userId ? isBookmarked(post.id) : Promise.resolve(false),
            ]);

            return {
              ...post,
              showComments: false,
              comments,
              commentCount: commentCount || 0,
              isBookmarked: bookmarked,
            };
          })
        );

        setEvents(postsWithUI);
      } catch (error) {
        console.error("Error fetching events:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [userId]);

  const handlePostPress = (item: EventWithUI) => {
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
            {/* Profile Row */}
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
              <TouchableOpacity
                onPress={() =>
                  navigation.navigate("ViewProfile", { username: item.username })
                }
              >
                <Text style={styles.username}>{item.username}</Text>
              </TouchableOpacity>

            
            </View>

            {/* Post Image - full width and aspect ratio preserved */}
            {item.imageUrl ? (
              <TouchableOpacity onPress={() => handlePostPress(item)}>
                <Image
                  source={{
                    uri: item.imageUrl.startsWith('http')
                      ? item.imageUrl
                      : `${API_URL}${item.imageUrl.startsWith('/') ? '' : '/'}${item.imageUrl}`,
                  }}
                  style={styles.postImage}
                  resizeMode="contain" // <-- ensures entire image fits
                />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity onPress={() => handlePostPress(item)}>
                <View style={styles.noImage}>
                  <Text style={styles.noImageText}>No Image</Text>
                </View>
              </TouchableOpacity>
            )}

            {/* Category, title, description */}
            <TouchableOpacity onPress={() => handlePostPress(item)}>
              <Text style={styles.category}>{item.category}</Text>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.description}>{item.description}</Text>
            </TouchableOpacity>

            {/* Post actions: Like + Comment + Bookmark */}
            <PostActions
              postId={item.id}
              userId={userId}
              initialLikeCount={item.likeCount || 0}
              initialCommentCount={item.commentCount || 0}
              initialIsBookmarked={item.isBookmarked}
              onCommentPress={() => {
                setEvents((prev) =>
                  prev.map((ev) =>
                    ev.id === item.id ? { ...ev, showComments: !ev.showComments } : ev
                  )
                );
              }}
              onBookmarkToggle={(isBookmarked) => {
                setEvents((prev) =>
                  prev.map((ev) =>
                    ev.id === item.id ? { ...ev, isBookmarked } : ev
                  )
                );
              }}
            />

            {/* Inline Comment Section */}
            <CommentSection
              postId={item.id}
              userId={userId}
              visible={!!item.showComments}
              initialComments={item.comments || []}
              initialCommentCount={item.commentCount || 0}
              onCommentAdd={(newCount) => {
                setEvents((prev) =>
                  prev.map((ev) =>
                    ev.id === item.id ? { ...ev, commentCount: newCount } : ev
                  )
                );
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

// ====================
// Styles
// ====================
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

  userRow: { 
    flexDirection: "row", 
    alignItems: "center", 
    marginBottom: 8,
    justifyContent: "flex-start" // <-- avatar + username stay close
  },
  
  avatar: { width: 40, height: 40, borderRadius: 20, marginRight: 10 },
  username: { fontWeight: "600", fontSize: 14, color: "#333" },

  configButton: {
    padding: 5,
    marginLeft: "auto",
  },
  configButtonText: {
    fontSize: 20,
    color: "#555",
  },

  postImage: { 
    width: "100%", 
    height: 200, // increased to accommodate full image
    borderRadius: 8, 
    marginVertical: 5
  },
  noImage: {
    width: "100%",
    height: 200,
    borderRadius: 8,
    backgroundColor: "#ddd",
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 5
  },
  noImageText: { color: "#555" },

  category: { fontWeight: "bold", marginTop: 8, fontSize: 14, color: "#E64A0D" },
  title: { fontSize: 16, marginTop: 4, fontWeight: "600", color: "#333" },
  description: { fontSize: 13, marginTop: 4, color: "#666" },
});
