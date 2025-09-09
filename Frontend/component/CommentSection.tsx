import React, { useState, useEffect, useRef } from "react";
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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  addComment,
  getComments,
  getCommentCount,
  Comment,
} from "../services/eventService";
import { fontSize } from "../styles/globalStyles";

// Props expected by the CommentSection component
type Props = {
  postId: string; // ID of the post to load comments for
  userId?: string | null; // ID of logged-in user (optional)
  onCommentAdd?: (count: number) => void; // Callback to update parent with new comment count
  initialComments?: Comment[]; // Preloaded comments (optional)
  initialCommentCount?: number; // Preloaded comment count (optional)
  visible?: boolean; // Whether the comment section is visible
};

export default function CommentSection({
  postId,
  userId,
  onCommentAdd,
  initialComments = [],
  initialCommentCount = 0,
  visible = false,
}: Props) {
  // Local states
  const [comments, setComments] = useState<Comment[]>([]); // Stores all comments
  const [text, setText] = useState(""); // Stores input text
  const [isLoading, setIsLoading] = useState(false); // Tracks comment loading
  const [isSubmitting, setIsSubmitting] = useState(false); // Tracks comment submission
  const [commentCount, setCommentCount] = useState(0); // Tracks comment count
  const fadeAnim = useRef(new Animated.Value(0)).current; // For fade-in animation
  const inputRef = useRef<TextInput>(null); // Reference to input field

  // Load comments when section becomes visible or when postId changes
  useEffect(() => {
    if (visible) {
      loadComments();
      // Auto-focus input after section is visible
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [visible, postId]);

  // Initialize with provided props (if any)
  useEffect(() => {
    if (initialComments?.length) {
      setComments(initialComments);
    }
    if (initialCommentCount) {
      setCommentCount(initialCommentCount);
    }
  }, [initialComments, initialCommentCount]);

  // Function to load comments + comment count
  const loadComments = async () => {
    if (isLoading) return; // Prevent duplicate calls
    
    setIsLoading(true);
    try {
      // Fetch comments and count in parallel
      const [fetched, count] = await Promise.all([
        getComments(postId),
        getCommentCount(postId),
      ]);
      setComments(fetched);
      setCommentCount(count);
      onCommentAdd?.(count); // Update parent component
    } catch (error) {
      console.error("Error loading comments:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Function to handle adding a new comment
  const handleAddComment = async () => {
    if (!text.trim() || isSubmitting) return; // Prevent empty or duplicate submissions
    if (!userId) {
      Alert.alert("Login Required", "Please login to add a comment");
      return;
    }

    // Create a temporary comment for optimistic UI update
    const tempId = `temp-${Date.now()}`;
    const tempComment: Comment = {
      id: tempId,
      postId,
      userId,
      username: 'You', // Placeholder, replaced with server username
      text,
      createdAt: new Date().toISOString(),
      userImage: undefined, // Server will provide image
    };

    // Optimistic UI: show new comment immediately
    setComments(prev => [tempComment, ...prev]);
    const updatedCount = commentCount + 1;
    setCommentCount(updatedCount);
    setText(""); // Clear input
    onCommentAdd?.(updatedCount);

    // Animate comment fade-in
    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    try {
      setIsSubmitting(true);
      // Call API to add comment
      const res = await addComment(postId, { text });
      
      if (res?.success && res.comment) {
        // Replace temporary comment with server response
        setComments(prev => [
          res.comment,
          ...prev.filter(c => c.id !== tempId)
        ]);
      } else {
        throw new Error("Failed to add comment");
      }
    } catch (error) {
      console.error("Error adding comment:", error);
      // Rollback optimistic update on failure
      setComments(prev => prev.filter(c => c.id !== tempId));
      setCommentCount(prev => prev - 1);
      // Restore text back to input
      setText(text);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={{ paddingVertical: 10 }}>
      {/* Loading indicator */}
      {isLoading ? (
        <ActivityIndicator size="large" color="#e74c3c" />

      ) : comments.length ? (
        // Render comment list
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
              {/* Avatar (image or fallback letter) */}
              {item.userImage ? (
                <Image source={{ uri: item.userImage }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, styles.avatarPlaceholder]}>
                  <Text style={styles.avatarText}>
                    {item.username?.charAt(0)?.toUpperCase() || "U"}
                  </Text>
                </View>
              )}
              {/* Comment content */}
              <View style={styles.commentContent}>
                <Text style={styles.commentAuthor}>
                  {item.username || (item.userId === userId ? 'You' : 'Anonymous')}
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
        // Empty state
        <View style={styles.emptyState}>
          <Ionicons name="chatbubble-ellipses-outline" size={48} color="#ccc" />
          <Text style={styles.emptyText}>No comments yet</Text>
        </View>
      )}

      {/* Comment input field */}
      <View style={styles.inputContainer}>
        <TextInput
          ref={inputRef}
          style={[styles.input, isSubmitting && styles.disabledInput]}
          value={text}
          onChangeText={setText}
          placeholder="Write a comment..."
          editable={!isSubmitting}
          multiline
        />
        {/* Send button */}
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

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  } as const,
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
  commentAuthor: { fontWeight: "600", fontSize: 14, color: "#333", marginBottom: 4 },
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
