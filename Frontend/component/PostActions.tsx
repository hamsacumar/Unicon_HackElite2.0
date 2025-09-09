import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  likePost,
  getLikeCount,
  checkIfLiked,
  getCommentCount,
  toggleBookmark,
} from "../services/eventService";
import BottomNav from "../component/bottomNav";

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

const PostActions: React.FC<Props> = ({
  postId,
  userId,
  initialLikeCount = 0,
  initialCommentCount = 0,
  initialIsLiked = false,
  initialIsBookmarked = false,
  onCommentPress,
  onLikeUpdate,
  onBookmarkToggle,
}) => {
  const isAuthenticated = !!userId;

  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [commentCount, setCommentCount] = useState(initialCommentCount);
  const [isLiked, setIsLiked] = useState(initialIsLiked);
  const [isBookmarked, setIsBookmarked] = useState(initialIsBookmarked);
  const [isLiking, setIsLiking] = useState(false);
  const [isBookmarking, setIsBookmarking] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch counts and user-specific info if authenticated
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);

        const likeRes = await getLikeCount(postId);
        const commentRes = await getCommentCount(postId);

        setLikeCount(likeRes);
        setCommentCount(commentRes);

        if (isAuthenticated) {
          const likedRes = await checkIfLiked(postId, userId!);
          setIsLiked(likedRes);

          // Optional: fetch bookmark status if your API supports it
          const bookmarkRes = await toggleBookmark(postId); // or another API to check
          setIsBookmarked(bookmarkRes?.isBookmarked ?? false);

          onLikeUpdate?.(likeRes, likedRes);
        }
      } catch (error) {
        console.error("Error fetching post actions:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [postId, userId]);

  // Show alert for unauthenticated users
  const handleUnauthenticated = () => {
    Alert.alert("Login required", "Please login to use this feature");
  };

  // Handle like button
  const handleLike = async () => {
    if (!isAuthenticated) return handleUnauthenticated();

    try {
      setIsLiking(true);
      const newIsLiked = !isLiked;
      const newLikeCount = newIsLiked
        ? likeCount + 1
        : Math.max(0, likeCount - 1);

      setIsLiked(newIsLiked);
      setLikeCount(newLikeCount);
      onLikeUpdate?.(newLikeCount, newIsLiked);

      await likePost(postId);
    } catch (error) {
      console.error("Error liking post:", error);
      Alert.alert("Error", "Could not update like. Please try again.");
    } finally {
      setIsLiking(false);
    }
  };

  // Handle bookmark button
  const handleBookmarkPress = async () => {
    if (!isAuthenticated) return handleUnauthenticated();

    try {
      setIsBookmarking(true);
      const res = await toggleBookmark(postId);
      if (res && res.success) {
        setIsBookmarked(res.isBookmarked);
        onBookmarkToggle?.(res.isBookmarked);
      }
    } catch (error) {
      console.error("Error toggling bookmark:", error);
      Alert.alert("Error", "Could not update bookmark. Please try again.");
    } finally {
      setIsBookmarking(false);
    }
  };

  if (isLoading) return <ActivityIndicator size="small" color="#e74c3c" />;

  return (
    <View style={styles.container}>
      <View style={styles.actionContainer}>
        {/* Like button + count */}
        <TouchableOpacity
          style={styles.actionButton}
          onPress={isAuthenticated ? handleLike : handleUnauthenticated}
          disabled={!isAuthenticated || isLiking}
        >
          <Ionicons
            name={isLiked ? "heart" : "heart-outline"}
            size={24}
            color={isLiked ? "#e74c3c" : "#999"}
          />
          <Text style={styles.countText}>{likeCount}</Text>
        </TouchableOpacity>

        {/* Comment button + count */}
        <TouchableOpacity
          style={styles.actionButton}
          onPress={isAuthenticated ? onCommentPress : handleUnauthenticated}
          disabled={!isAuthenticated}
        >
          <Ionicons
            name="chatbubble-outline"
            size={24}
            color={isAuthenticated ? "#333" : "#999"}
          />
          <Text style={styles.countText}>{commentCount}</Text>
        </TouchableOpacity>

        {/* Bookmark button */}
        {isAuthenticated && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleBookmarkPress}
            disabled={isBookmarking}
          >
            <Ionicons
              name={isBookmarked ? "bookmark" : "bookmark-outline"}
              size={24}
              color={isBookmarked ? "#f39c12" : "#999"}
            />
          </TouchableOpacity>
        )}

        {/* Configure button */}
        {isAuthenticated && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => alert("Configure enabled")}
          >
            <Ionicons name="settings-outline" size={24} color="#333" />
          </TouchableOpacity>
        )}
      </View>

      {/* Show BottomNav only for unauthenticated users */}
      {!isAuthenticated && <BottomNav />}
    </View>
  );
};

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
    alignItems: "center",
    paddingHorizontal: 16,
    gap: 16,
  },
  countText: { marginLeft: 4, fontSize: 14, color: "#666" },
  actionButton: { flexDirection: "row", alignItems: "center", marginLeft: 12 },
});

export default PostActions;
