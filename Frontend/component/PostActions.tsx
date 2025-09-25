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
import NotificationConfigButton from "./NotificationConfigButton";
import {
  likePost,
  getLikeCount,
  checkIfLiked,
  getCommentCount,
  toggleBookmark,
isBookmarked as fetchIsBookmarked,} from "../services/eventService";
import { useNavigation } from "@react-navigation/native";
import { RootStackParamList } from "../App";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

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
  disabled?: boolean; 
  // Notification configuration inputs
  organizerId: string;
  organizerName: string;
  postTitle: string;
  category?: string;
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList, "Login">;

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
  disabled = false,
  organizerId,
  organizerName,
  postTitle,
  category,
}) => {
  const navigation = useNavigation<NavigationProp>();

  const isAuthenticated = !!userId && !disabled;
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [commentCount, setCommentCount] = useState(initialCommentCount);
  const [isLiked, setIsLiked] = useState(initialIsLiked);
  const [isBookmarked, setIsBookmarked] = useState(initialIsBookmarked);
  const [isLiking, setIsLiking] = useState(false);
  const [isBookmarking, setIsBookmarking] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch counts + user-specific state
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);

        const [likeRes, commentRes] = await Promise.all([
          getLikeCount(postId),
          getCommentCount(postId),
        ]);
        setLikeCount(likeRes);
        setCommentCount(commentRes);

        if (isAuthenticated && userId) {
          const [liked, bookmarkedRes] = await Promise.all([
            checkIfLiked(postId, userId),
            fetchIsBookmarked(postId),
          ]);
          setIsLiked(liked);
          setIsBookmarked(!!bookmarkedRes);
          onLikeUpdate?.(likeRes, liked);
        } else {
          setIsLiked(false);
          setIsBookmarked(false);
        }
      } catch (error) {
        console.error("Error fetching post actions:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [postId, userId]);

  // Alert for guests
  const handleUnauthenticated = () => {
    Alert.alert(
      "Login Required",
      "You must be logged in to perform this action.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Login", onPress: () => navigation.navigate("Login") },
      ]
    );
  };

  // Like handler
  const handleLike = async () => {
    if (!isAuthenticated) return handleUnauthenticated();

    try {
      setIsLiking(true);
      const newLiked = !isLiked;
      const newCount = newLiked ? likeCount + 1 : Math.max(0, likeCount - 1);

      setIsLiked(newLiked);
      setLikeCount(newCount);
      onLikeUpdate?.(newCount, newLiked);

      await likePost(postId);
    } catch (error) {
      console.error("Error liking post:", error);
    } finally {
      setIsLiking(false);
    }
  };

  // Bookmark handler
  const handleBookmark = async () => {
    if (!isAuthenticated) return handleUnauthenticated();

    try {
      setIsBookmarking(true);
      const newBookmark = !isBookmarked;
      setIsBookmarked(newBookmark);

      const res = await toggleBookmark(postId);
      if (res?.success) onBookmarkToggle?.(res.isBookmarked);
      else setIsBookmarked(!newBookmark);
    } catch (error) {
      console.error("Error toggling bookmark:", error);
    } finally {
      setIsBookmarking(false);
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="small" color="#e74c3c" />
      </View>
    );
  }

  const disabledStyle = { opacity: isAuthenticated ? 1 : 0.5 };

  return (
    <View style={styles.container}>
      <View style={styles.actionContainer}>
        {/* Like */}
        <TouchableOpacity
          style={[styles.actionButton, disabledStyle]}
          onPress={handleLike}
          disabled={!isAuthenticated || isLiking}
          activeOpacity={0.7}
        >
          <Ionicons
            name={isLiked ? "heart" : "heart-outline"}
            size={24}
            color={isLiked ? "#e74c3c" : "#999"}
          />
          <Text style={styles.countText}>{likeCount}</Text>
        </TouchableOpacity>

        {/* Comment */}
        <TouchableOpacity
          style={[styles.actionButton, disabledStyle]}
          onPress={isAuthenticated ? onCommentPress : handleUnauthenticated}
          disabled={!isAuthenticated}
          activeOpacity={0.7}
        >
          <Ionicons
            name="chatbubble-outline"
            size={24}
            color={isAuthenticated ? "#333" : "#999"}
          />
          <Text style={styles.countText}>{commentCount}</Text>
        </TouchableOpacity>

        {/* Bookmark */}
        <TouchableOpacity
          style={[styles.actionButton, disabledStyle]}
          onPress={handleBookmark}
          disabled={!isAuthenticated || isBookmarking}
          activeOpacity={0.7}
        >
          <Ionicons
            name={isBookmarked ? "bookmark" : "bookmark-outline"}
            size={24}
            color={isBookmarked ? "#f39c12" : "#999"}
          />
        </TouchableOpacity>

        {/* Configure title-based notifications for this organizer */}
        <NotificationConfigButton
          postId={postId}
          postTitle={postTitle}
          organizerId={organizerId}
          organizerName={organizerName}
          category={category}
          size={22}
          color="#333"
        />
      </View>

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#f0f0f0",
    marginVertical: 8,
    backgroundColor: "#fff",
  },
  loadingContainer: {
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  actionContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    gap: 24,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 4,
    borderRadius: 8,
  },
  countText: {
    marginLeft: 4,
    fontSize: 14,
    color: "#666",
    minWidth: 16,
    textAlign: "center",
  },
});

export default PostActions;
