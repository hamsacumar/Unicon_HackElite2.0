import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
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
import PostText from "../component/PostText";

type HomeNavigationProp = NativeStackNavigationProp<RootStackParamList, "Home">;

type EventWithUI = Omit<EventItem, "comments" | "commentCount"> & {
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
  const flatListRef = useRef<FlatList<EventWithUI>>(null);
  const [refreshing, setRefreshing] = useState(false);

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

  // 🔹 fetchData logic
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getEvents();
      setEvents(data as EventWithUI[]);
    } catch (err) {
      console.error("Error fetching events:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // 🔹 pull-to-refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, [fetchData]);

  const handlePostPress = (item: EventWithUI) => {
    navigation.navigate("PostDetail", { post: item, userId });
  };

  if (loading && !refreshing) {
    return (
      <ActivityIndicator
        size="large"
        color="#e74c3c"
        style={{ flex: 1, justifyContent: "center" }}
      />
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={80}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <View style={styles.container}>
          <FlatList
            ref={flatListRef}
            data={events}
            keyExtractor={(item) => item.id.toString()}
            refreshing={refreshing}
            onRefresh={onRefresh}
            renderItem={({ item }) => (
              <View style={styles.postCard}>
                {/* User row */}
                <View style={styles.userRow}>
                  <Image
                    source={{
                      uri: item.userImage && item.userImage !== "string"
                        ? item.userImage.startsWith("http")
                          ? item.userImage
                          : `${API_URL}${item.userImage}`
                        : "https://cdn-icons-png.flaticon.com/512/3135/3135715.png",
                    }}
                    style={styles.avatar}
                  />
                  <TouchableOpacity
                    onPress={() =>
                      navigation.navigate("ViewProfile", {
                        username: item.username,
                      })
                    }
                  >
                    <Text style={styles.username}>{item.username}</Text>
                  </TouchableOpacity>
                </View>

                {/* Post image */}
                {item.imageUrl ? (
                  <TouchableOpacity onPress={() => handlePostPress(item)}>
                    <View
                      style={{
                        marginHorizontal: -12,
                        borderRadius: 10,
                        overflow: "hidden",
                      }}
                    >
                      <Image
                        source={{
                          uri: item.imageUrl.startsWith("http")
                            ? item.imageUrl
                            : `${API_URL}${
                                item.imageUrl.startsWith("/") ? "" : "/"
                              }${item.imageUrl}`,
                        }}
                        style={{ width: "100%", height: 250 }}
                        resizeMode="cover"
                      />
                    </View>
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
                  <PostText
                    content={item.description}
                    style={styles.description}
                  />
                </TouchableOpacity>

                {/* Post actions */}
                <PostActions
                  postId={item.id}
                  userId={userId}
                  initialLikeCount={item.likeCount || 0}
  commentCount={item.commentCount || 0} // pass the current count
                  initialIsBookmarked={item.isBookmarked}
                  onCommentPress={() => {
                    setEvents((prev) =>
                      prev.map((ev) =>
                        ev.id === item.id
                          ? { ...ev, showComments: !ev.showComments }
                          : ev
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
                  organizerId={item.userId}
                  organizerName={item.username}
                  postTitle={item.title}
                  category={item.category}
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
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="interactive"
          />

          <RoleBasedBottomNav navigation={navigation} />
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

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
});
