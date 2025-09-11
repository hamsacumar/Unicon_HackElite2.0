import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Animated,
  Image,
  Alert,
  FlatList,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  addComment,
  getComments,
  getCommentCount,
  Comment,
} from "../services/eventService";

// Props expected by the CommentSection component
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
  flatListRef,
}: Props) {
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [text, setText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [commentCount, setCommentCount] = useState(initialCommentCount);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (visible) {
      loadComments();
    }
  }, [visible, postId]);

  const loadComments = async () => {
    if (isLoading) return;
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
    if (!text.trim() || isSubmitting) return;
    if (!userId) {
      Alert.alert("Login Required", "Please login to add a comment");
      return;
    }

    const tempId = `temp-${Date.now()}`;
    const tempComment: Comment = {
      id: tempId,
      postId,
      userId,
      username: "You",
      text,
      createdAt: new Date().toISOString(),
      userImage: undefined,
    };

    setComments((prev) => [tempComment, ...prev]);
    const updatedCount = commentCount + 1;
    setCommentCount(updatedCount);

    // Blur the input so keyboard hides
    inputRef.current?.blur();
    setText("");
    onCommentAdd?.(updatedCount);

    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    try {
      setIsSubmitting(true);
      const res = await addComment(postId, { text });
      if (res?.success && res.comment) {
        setComments((prev) => [
          res.comment,
          ...prev.filter((c) => c.id !== tempId),
        ]);
      } else {
        throw new Error("Failed to add comment");
      }
    } catch (error) {
      console.error("Error adding comment:", error);
      setComments((prev) => prev.filter((c) => c.id !== tempId));
      setCommentCount((prev) => prev - 1);
      setText(text);
    } finally {
      setIsSubmitting(false);
    }
  };

  // =================== FIXED JSX ===================
  if (!visible) return null;

  return (
    <View style={{ paddingVertical: 10 }}>
      {isLoading ? (
        <ActivityIndicator size="large" color="#e74c3c" />
      ) : comments.length > 0 ? (
        <FlatList
          data={comments}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.commentContainer}>
              <View style={styles.commentHeader}>
                {item.userImage ? (
                  <Image source={{ uri: item.userImage }} style={styles.avatar} />
                ) : (
                  <View style={[styles.avatar, styles.avatarPlaceholder]}>
                    <Text style={styles.avatarText}>
                      {item.username?.charAt(0)?.toUpperCase() || "U"}
                    </Text>
                  </View>
                )}
                <View style={styles.commentContent}>
                  <Text style={styles.commentAuthor}>
                    {item.username || (item.userId === userId ? "You" : "Anonymous")}
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
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="chatbubble-ellipses-outline" size={48} color="#ccc" />
          <Text style={styles.emptyText}>No comments yet</Text>
        </View>
      )}

      {/* Input */}
      <View style={styles.inputContainer}>
        <TextInput
          ref={inputRef}
          style={[styles.input, isSubmitting && styles.disabledInput]}
          value={text}
          onChangeText={setText}
          placeholder="Write a comment..."
          editable={!isSubmitting}
          multiline
          onFocus={() => flatListRef?.current?.scrollToEnd({ animated: true })}
        />
        <TouchableOpacity
          style={[styles.sendButton, isSubmitting && styles.sendButtonDisabled]}
          onPress={handleAddComment}
          disabled={isSubmitting}
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
