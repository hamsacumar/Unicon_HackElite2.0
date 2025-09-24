import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  Image,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  addComment,
  getComments,
  getCommentCount,
  Comment,
} from "../services/eventService";
import Constants from "expo-constants";

const API_URL = Constants.expoConfig?.extra?.apiUrl?.replace("/api", "");

type Props<T = any> = {
  postId: string;
  userId?: string | null;
  onCommentAdd?: (count: number) => void;
  initialComments?: Comment[];
  initialCommentCount?: number;
  visible?: boolean;
  flatListRef?: React.RefObject<FlatList<T> | null>;
};

export default function CommentSection({
  postId,
  userId,
  onCommentAdd,
  initialComments = [],
  initialCommentCount = 0,
  visible = false,
}: Props) {
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [text, setText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [commentCount, setCommentCount] = useState(initialCommentCount);

  useEffect(() => {
    if (visible) loadComments();
  }, [visible]);

  const loadComments = async () => {
    setIsLoading(true);
    try {
      const [fetched, count] = await Promise.all([
        getComments(postId),
        getCommentCount(postId),
      ]);
      setComments(fetched);
      setCommentCount(count);
      onCommentAdd?.(count);
    } catch (error) {
      console.error("Error loading comments:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddComment = async () => {
  if (!userId) {
    Alert.alert("Login Required", "Please login to add a comment");
    return;
  }
  if (!text.trim() || isSubmitting) return;

  const tempComment: Comment = {
    id: `temp-${Date.now()}`,
    postId,
    userId,
    username: "You",
    text,
    createdAt: new Date().toISOString(),
  };

  // Optimistic update
  setComments((prev) => [tempComment, ...prev]);
  setCommentCount((prevCount) => {
    const newCount = prevCount + 1;
    // call parent callback here safely
    onCommentAdd?.(newCount);
    return newCount;
  });

  setText("");

  try {
    setIsSubmitting(true);
    const res = await addComment(postId, { text: tempComment.text });
    if (res?.success && res.comment) {
      setComments((prev) => [
        res.comment,
        ...prev.filter((c) => c.id !== tempComment.id),
      ]);
    }
  } catch (error) {
    console.error("Error adding comment:", error);
    setComments((prev) => prev.filter((c) => c.id !== tempComment.id));
    setCommentCount((prevCount) => {
      const newCount = prevCount - 1;
      onCommentAdd?.(newCount);
      return newCount;
    });
  } finally {
    setIsSubmitting(false);
  }
};


  if (!visible) return null;

  if (!userId) {
    return (
      <View style={{ padding: 16, alignItems: "center" }}>
        <Ionicons name="lock-closed-outline" size={40} color="#ccc" />
        <Text style={{ color: "#666", marginTop: 8 }}>
          Please login to view and add comments
        </Text>
      </View>
    );
  }

  return (
    <View style={{ paddingVertical: 10 }}>
      {isLoading ? (
        <ActivityIndicator size="large" color="#e74c3c" />
      ) : comments.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="chatbubble-ellipses-outline" size={48} color="#ccc" />
          <Text style={styles.emptyText}>No comments yet</Text>
        </View>
      ) : (
        <FlatList
          data={comments}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.commentContainer}>
              <View style={styles.commentHeader}>
                {item.userImage && item.userImage !== "string" ? (
                  <Image
                    source={{
                      uri: item.userImage.startsWith("http")
                        ? item.userImage
                        : `${API_URL}${item.userImage}`,
                    }}
                    style={styles.avatar}
                    onError={(e) => {
                      console.log("Error loading profile image:", e.nativeEvent.error);
                    }}
                  />
                ) : (
                  <View style={[styles.avatar, styles.avatarPlaceholder]}>
                    <Text style={styles.avatarText}>
                      {item.username?.charAt(0)?.toUpperCase() || "U"}
                    </Text>
                  </View>
                )}
                <View style={styles.commentContent}>
                  <Text style={styles.commentAuthor}>
                    {item.username || "Anonymous"}
                  </Text>
                  <Text style={styles.commentText}>{item.text}</Text>
                  <Text style={styles.commentTime}>
                    {item.createdAt
                      ? new Date(item.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "Just now"}
                  </Text>
                </View>
              </View>
            </View>
          )}
        />
      )}

      {/* Input */}
      <View style={styles.inputContainer}>
        <TextInput
          style={[styles.input, isSubmitting && styles.disabledInput]}
          value={text}
          onChangeText={setText}
          placeholder="Write a comment..."
          editable={!isSubmitting && !!userId}
          multiline
        />
        <TouchableOpacity
          style={[styles.sendButton, isSubmitting && styles.sendButtonDisabled]}
          onPress={handleAddComment}
          disabled={isSubmitting || !userId}
        >
          <Ionicons name="send" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  commentContainer: {
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  commentHeader: { flexDirection: "row", alignItems: "flex-start" },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 12,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#e0e0e0",
  },
  avatarPlaceholder: { backgroundColor: "#e74c3c" },
  avatarText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  commentContent: { flex: 1 },
  commentAuthor: {
    fontWeight: "600",
    fontSize: 14,
    color: "#333",
    marginBottom: 4,
  },
  commentText: { fontSize: 14, color: "#333", lineHeight: 20 },
  commentTime: { fontSize: 12, color: "#999", marginTop: 4 },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#eee",
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "#fff",
    marginTop: 10,
  },
  input: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    color: "#333",
    maxHeight: 120,
    marginRight: 8,
  },
  disabledInput: { backgroundColor: "#f9f9f9", color: "#999" },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#e74c3c",
    justifyContent: "center",
    alignItems: "center",
  },
  sendButtonDisabled: { backgroundColor: "#ccc" },
  emptyState: { justifyContent: "center", alignItems: "center", marginTop: 16 },
  emptyText: { fontSize: 14, color: "#999", marginTop: 8 },
});
