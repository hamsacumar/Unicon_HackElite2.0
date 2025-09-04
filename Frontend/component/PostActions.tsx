import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { likePost, getLikeCount, checkIfLiked, getCommentCount } from "../services/eventService";
import { Ionicons } from "@expo/vector-icons";

type Props = {
  postId: string;                              // Post ID for actions
  userId?: string | null;                      // Optional logged-in user ID (null for unauthenticated users)
  initialLikeCount?: number;                   // Optional initial like count
  initialCommentCount?: number;                // Optional initial comment count
  initialIsLiked?: boolean;                    // Optional initial liked state
  onCommentPress?: () => void;                 // Callback for opening comments
  onLikeUpdate?: (likeCount: number, isLiked: boolean) => void; // Callback when like changes
};

export default function PostActions({
  postId,
  userId,
  initialLikeCount = 0,
  initialCommentCount = 0,
  initialIsLiked = false,
  onCommentPress,
  onLikeUpdate,
}: Props) {
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [commentCount, setCommentCount] = useState(initialCommentCount);
  const [isLiked, setIsLiked] = useState(initialIsLiked);
  const [isLoading, setIsLoading] = useState(true);
  const [isLiking, setIsLiking] = useState(false);

  // Fetch initial like and comment data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [likeCountRes, isLikedRes, commentCountRes] = await Promise.all([
          getLikeCount(postId),
          userId ? checkIfLiked(postId, userId) : Promise.resolve(false),
          getCommentCount(postId),
        ]);

        setLikeCount(likeCountRes);
        setIsLiked(isLikedRes);
        setCommentCount(commentCountRes);
        onLikeUpdate?.(likeCountRes, isLikedRes);
      } catch (error) {
        console.error("Error fetching post actions data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [postId, userId]);

  // Handle liking/unliking a post
  const handleLike = async () => {
    if (isLiking || !userId) return;

    try {
      setIsLiking(true);
      const newIsLiked = !isLiked;
      const newLikeCount = newIsLiked ? likeCount + 1 : Math.max(0, likeCount - 1);

      // Optimistic update
      setIsLiked(newIsLiked);
      setLikeCount(newLikeCount);
      onLikeUpdate?.(newLikeCount, newIsLiked);

      // API call
      await likePost(postId, userId);
    } catch (error) {
      // Revert on error
      setIsLiked(!isLiked);
      setLikeCount(likeCount);
      onLikeUpdate?.(likeCount, !isLiked);
      console.error("Error toggling like:", error);
    } finally {
      setIsLiking(false);
    }
  };

  // Handle comment button press
  const handleCommentPress = () => {
    onCommentPress?.();
  };

  // Loading state
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color="#e74c3c" />
      </View>
    );
  }

  // Show disabled state for unauthenticated users
  const isAuthenticated = !!userId;

  return (
    <View style={styles.container}>
      <View style={styles.actionContainer}>
        {/* Like button */}
        <TouchableOpacity
          style={[styles.actionButton, !isAuthenticated && styles.disabledButton]}
          onPress={isAuthenticated ? handleLike : undefined}
          disabled={!isAuthenticated || isLiking}
        >
          <Ionicons
            name={isLiked ? "heart" : "heart-outline"}
            size={24}
            color={isLiked ? "#e74c3c" : "#999"}
          />
          <Text style={[
            styles.actionText, 
            !isAuthenticated && styles.disabledText,
            isLiked && styles.likedText
          ]}>
            {likeCount}
          </Text>
        </TouchableOpacity>

        {/* Comment button */}
        <TouchableOpacity 
          style={[styles.actionButton, !isAuthenticated && styles.disabledButton]} 
          onPress={isAuthenticated ? handleCommentPress : undefined}
          disabled={!isAuthenticated}
        >
          <Ionicons 
            name="chatbubble-outline" 
            size={20} 
            color={isAuthenticated ? "#333" : "#999"} 
          />
          <Text style={[styles.actionText, !isAuthenticated && styles.disabledText]}>
            {commentCount}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// Styles for PostActions
const styles = StyleSheet.create({
  container: { 
    paddingVertical: 8, 
    borderTopWidth: 1, 
    borderBottomWidth: 1, 
    borderColor: "#f0f0f0", 
    marginVertical: 8 
  },
  loadingContainer: { 
    padding: 16, 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  actionContainer: { 
    flexDirection: "row", 
    justifyContent: "space-around", 
    paddingHorizontal: 16 
  },
  actionButton: { 
    flexDirection: "row", 
    alignItems: "center", 
    padding: 8, 
    borderRadius: 20 
  },
  disabledButton: {
    opacity: 0.7,
  },
  actionText: { 
    marginLeft: 6, 
    fontSize: 14, 
    color: "#333" 
  },
  disabledText: {
    color: "#999",
  },
  likedText: { 
    color: "#e74c3c", 
    fontWeight: "bold" 
  },
});
