import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  addComment,
  getComments,
  getCommentCount,
  Comment,
} from "../services/eventService";

type Props = {
  postId: string;
  userId?: string | null;
  onCommentAdd?: (count: number) => void;
  initialComments?: Comment[];
  initialCommentCount?: number;
};

export default function CommentSection({
  postId,
  userId,
  onCommentAdd,
  initialComments = [],
  initialCommentCount = 0,
}: Props) {
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [text, setText] = useState("");
  const [isLoading, setIsLoading] = useState(!initialComments.length);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [commentCount, setCommentCount] = useState(initialCommentCount);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!initialComments.length) loadComments();
  }, [postId]);

  const loadComments = async () => {
    setIsLoading(true);
    try {
      const [fetched, count] = await Promise.all([
        getComments(postId),
        getCommentCount(postId),
      ]);
      setComments(fetched);
      setCommentCount(count);
    } catch (error) {
      console.error("Error loading comments:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddComment = async () => {
    if (!text.trim() || isSubmitting) return;

    const tempComment: Comment = {
      id: `temp-${Date.now()}`,
      postId,
      userId: userId || "guest",
      username: userId ? "You" : "Guest", // temporary placeholder
      text,
      createdAt: new Date().toISOString(),
    };

    setComments([tempComment, ...comments]);
    const updatedCount = commentCount + 1;
    setCommentCount(updatedCount);
    setText("");
    onCommentAdd?.(updatedCount);

    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    if (!userId) return;

    try {
      setIsSubmitting(true);
      // Call backend API which returns { success, comment }
      const res = (await addComment(postId, { text })) as { success: boolean; comment: Comment };

      if (res?.success && res.comment) {
        // Replace temp comment with real comment from backend
        setComments((prev) => [
          res.comment,
          ...prev.filter((c) => c.id !== tempComment.id),
        ]);
      } else {
        throw new Error("Failed to add comment");
      }
    } catch (error) {
      console.error("Error adding comment:", error);
      // Remove temp comment on failure
      setComments((prev) => prev.filter((c) => c.id !== tempComment.id));
      setCommentCount((prev) => prev - 1);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {isLoading ? (
          <ActivityIndicator size="large" color="#e74c3c" />
        ) : comments.length ? (
          comments.map((item, index) => (
            <Animated.View
          key={item.id || `comment-${index}`}
              style={{
                opacity: fadeAnim,
                marginBottom: 16,
                ...styles.commentContainer,
              }}
            >
              <View style={styles.commentHeader}>
                {item.userImage ? (
                  <Image
                    source={{ uri: item.userImage }}
                    style={styles.avatar}
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
            </Animated.View>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Ionicons
              name="chatbubble-ellipses-outline"
              size={48}
              color="#ccc"
            />
            <Text style={styles.emptyText}>No comments yet</Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.inputContainer}>
        <TextInput
          style={[styles.input, !userId && styles.disabledInput]}
          value={text}
          onChangeText={setText}
          placeholder={userId ? "Add a comment..." : "Log in to comment"}
          placeholderTextColor="#999"
          multiline
          maxLength={500}
          onSubmitEditing={handleAddComment}
          returnKeyType="send"
          blurOnSubmit={false}
          editable={!!userId}
          pointerEvents={userId ? "auto" : "none"}
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            (!text.trim() || isSubmitting || !userId) &&
              styles.sendButtonDisabled,
          ]}
          onPress={handleAddComment}
          disabled={!text.trim() || isSubmitting || !userId}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Ionicons name="send" size={20} color="#fff" />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
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
    backgroundColor: "#e0e0e0",
    justifyContent: "center",
    alignItems: "center",
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
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
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
  emptyState: { justifyContent: "center", alignItems: "center", marginTop: 32 },
  emptyText: { fontSize: 14, color: "#999", marginTop: 8 },
});
