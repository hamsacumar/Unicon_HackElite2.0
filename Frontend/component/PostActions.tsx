import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  likePost,
  getLikeCount,
  checkIfLiked,
  getCommentCount,
  toggleBookmark,
} from "../services/eventService";

type Props = {
  postId: string;
  userId?: string | null;
  initialLikeCount?: number;
  initialCommentCount?: number;
  initialIsLiked?: boolean;
  initialIsBookmarked?: boolean;
  onCommentPress?: () => void;
  onLikeUpdate?: (likeCount: number, isLiked: boolean) => void;
  onBookmarkToggle?: (bookmarked: boolean) => void;
};

export default function PostActions({
  postId,
  userId,
  initialLikeCount = 0,
  initialCommentCount = 0,
  initialIsLiked = false,
  initialIsBookmarked = false,
  onCommentPress,
  onLikeUpdate,
  onBookmarkToggle,
}: Props) {
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [commentCount, setCommentCount] = useState(initialCommentCount);
  const [isLiked, setIsLiked] = useState(initialIsLiked);
  const [isBookmarked, setIsBookmarked] = useState(initialIsBookmarked);
  const [isLoading, setIsLoading] = useState(true);
  const [isLiking, setIsLiking] = useState(false);
  const [isBookmarking, setIsBookmarking] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [likeRes, likedRes, commentRes] = await Promise.all([
          getLikeCount(postId),
          userId ? checkIfLiked(postId, userId) : Promise.resolve(false),
          getCommentCount(postId),
        ]);
        setLikeCount(likeRes);
        setIsLiked(likedRes);
        setCommentCount(commentRes);
        onLikeUpdate?.(likeRes, likedRes);
      } catch (error) {
        console.error("Error fetching post actions:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [postId, userId]);

  const handleLike = async () => {
    if (!userId || isLiking) return;
    const newIsLiked = !isLiked;
    const newLikeCount = newIsLiked ? likeCount + 1 : Math.max(0, likeCount - 1);
    setIsLiked(newIsLiked);
    setLikeCount(newLikeCount);
    onLikeUpdate?.(newLikeCount, newIsLiked);

    try {
      setIsLiking(true);
      await likePost(postId);
    } catch (error) {
      console.error("Error liking post:", error);
      setIsLiked(isLiked);
      setLikeCount(likeCount);
      onLikeUpdate?.(likeCount, isLiked);
    } finally {
      setIsLiking(false);
    }
  };

  const handleBookmark = async () => {
    if (!userId || isBookmarking) return;
    try {
      setIsBookmarking(true);
      const res = await toggleBookmark(postId);
      if (res?.success) {
        setIsBookmarked(res.isBookmarked);
        onBookmarkToggle?.(res.isBookmarked);
      }
    } catch (error) {
      console.error("Error toggling bookmark:", error);
    } finally {
      setIsBookmarking(false);
    }
  };

  if (isLoading) return <ActivityIndicator size="small" color="#e74c3c" />;

  const isAuthenticated = !!userId;

  return (
    <View style={styles.container}>
      <View style={styles.actionContainer}>
        {/* Like */}
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
          <Text
            style={[
              styles.actionText,
              !isAuthenticated && styles.disabledText,
              isLiked && styles.likedText,
            ]}
          >
            {likeCount}
          </Text>
        </TouchableOpacity>

        {/* Comment */}
        <TouchableOpacity
          style={[styles.actionButton, !isAuthenticated && styles.disabledButton]}
          onPress={isAuthenticated ? onCommentPress : undefined}
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

        {/* Bookmark */}
        <TouchableOpacity
          style={[styles.actionButton, !isAuthenticated && styles.disabledButton]}
          onPress={isAuthenticated ? handleBookmark : undefined}
          disabled={!isAuthenticated || isBookmarking}
        >
          <Ionicons
            name={isBookmarked ? "bookmark" : "bookmark-outline"}
            size={22}
            color={isBookmarked ? "#f39c12" : "#999"}
          />
        </TouchableOpacity>

        {/* configure Button */}
<TouchableOpacity
  style={styles.actionButton}
  onPress={() => Alert.alert("configure enabled")}
>
  <Ionicons name="settings-outline" size={22} color="#333" />
</TouchableOpacity>

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#f0f0f0",
    marginVertical: 8,
  },
  actionContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingHorizontal: 16,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
    borderRadius: 20,
  },
  disabledButton: { opacity: 0.7 },
  actionText: { marginLeft: 6, fontSize: 14, color: "#333" },
  disabledText: { color: "#999" },
  likedText: { color: "#e74c3c", fontWeight: "bold" },
});
