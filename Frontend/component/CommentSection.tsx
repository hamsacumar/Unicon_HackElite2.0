import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Image,
} from "react-native";
import {
  addComment,
  getComments,
  Comment,
  getCommentCount,
} from "../services/eventService";
import { Ionicons } from "@expo/vector-icons";

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

  const inputRef = useRef<TextInput>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loadComments = async () => {
      if (initialComments.length === 0) {
        try {
          setIsLoading(true);
          const [fetchedComments, count] = await Promise.all([
            getComments(postId),
            getCommentCount(postId),
          ]);
          setComments(fetchedComments);
          setCommentCount(count);
        } catch (error) {
          console.error("Error loading comments:", error);
        } finally {
          setIsLoading(false);
        }
      }
    };
    loadComments();
  }, [postId]);

  const handleAddComment = async () => {
    if (!text.trim() || isSubmitting || !userId) return;

    try {
      setIsSubmitting(true);
      const newComment = await addComment(postId, { userId, text });

      if (newComment) {
        const updatedComments = [newComment, ...comments];
        const updatedCount = commentCount + 1;

        setComments(updatedComments);
        setCommentCount(updatedCount);
        setText("");
        onCommentAdd?.(updatedCount);

        fadeAnim.setValue(0);
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
      }
    } catch (error) {
      console.error("Error adding comment:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderComment = ({ item }: { item: Comment }) => (
    <Animated.View style={[styles.commentContainer, { opacity: fadeAnim }]}>
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
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="chatbubble-ellipses-outline" size={48} color="#ccc" />
      <Text style={styles.emptyStateText}>No comments yet</Text>
      <Text style={styles.emptyStateSubtext}>Be the first to comment!</Text>
    </View>
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      <View style={styles.commentsContainer}>
        {isLoading ? (
          <ActivityIndicator
            size="large"
            color="#e74c3c"
            style={styles.loader}
          />
        ) : (
          <FlatList
            data={comments}
            keyExtractor={(item, index) =>
              `${item.id || index}-${item.createdAt || ""}`
            }
            renderItem={renderComment}
            ListEmptyComponent={renderEmptyState}
            contentContainerStyle={styles.commentsList}
            keyboardShouldPersistTaps="handled"
          />
        )}
      </View>

      <View style={styles.inputContainer}>
        <TextInput
          ref={inputRef}
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

      {!userId && (
        <View style={styles.loginPrompt}>
          <Text style={styles.loginText}>
            <Text>Please </Text>
            <Text
              style={styles.loginLink}
              onPress={() => console.log("Navigate to login")}
            >
              log in
            </Text>
            <Text> to add a comment</Text>
          </Text>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

// Styles remain unchanged
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  commentsContainer: { flex: 1, paddingHorizontal: 16 },
  commentsList: { paddingBottom: 16 },
  loader: { marginTop: 24 },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#666",
    marginTop: 12,
  },
  emptyStateSubtext: { fontSize: 14, color: "#999", marginTop: 4 },
  commentContainer: {
    marginBottom: 16,
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
  },
  loginPrompt: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#eee",
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  loginText: { color: "#666", fontSize: 14 },
  loginLink: { color: "#e74c3c", fontWeight: "600" },
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
  sendButtonDisabled: { opacity: 0.5 },
});
