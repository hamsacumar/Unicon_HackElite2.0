import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  likePost,
  getLikeCount,
  checkIfLiked,
  getCommentCount,
  toggleBookmark,
  isBookmarked,
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
  const [isPostBookmarked, setIsPostBookmarked] = useState(initialIsBookmarked);
  const [isLiking, setIsLiking] = useState(false);
  const [isBookmarking, setIsBookmarking] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

 // Fetch counts and user-specific info
useEffect(() => {
  const fetchData = async () => {
    try {
      setIsLoading(true);

      // Always fetch like and comment counts (visible to all users)
      const [likeRes, commentRes] = await Promise.all([
        getLikeCount(postId),
        getCommentCount(postId),
      ]);

      setLikeCount(likeRes);
      setCommentCount(commentRes);

      // Only fetch user-specific data if authenticated
      if (isAuthenticated && userId) {
        try {
          const [liked, bookmarkedResponse] = await Promise.all([
            checkIfLiked(postId, userId),
            isBookmarked(postId)
          ]);
          
          const bookmarked = !!bookmarkedResponse;
          
          setIsLiked(liked);
          setIsPostBookmarked(bookmarked);
          onLikeUpdate?.(likeCount, liked);
        } catch (error) {
          console.error("Error fetching user-specific data:", error);
        }
      } else {
        // Reset user-specific states when not authenticated
        setIsLiked(false);
        setIsPostBookmarked(false);
      }
    } catch (error) {
      console.error("Error fetching post actions:", error);
    } finally {
      setIsLoading(false);
    }
  };

  fetchData();
}, [postId, userId, isAuthenticated]);

// <<< Add this new useEffect BELOW the above useEffect >>>
useEffect(() => {
  if (!isAuthenticated) {
    setIsLiked(false);
  }
}, [isAuthenticated]);


  // Show login prompt for unauthenticated users
  const handleUnauthenticated = () => {
    Alert.alert(
      "Login Required",
      "You need to be logged in to perform this action.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Login",
          onPress: () => {
            // You can implement navigation to login screen here if needed
            // navigation.navigate('Login');
            console.log("Navigate to login screen");
          },
        },
      ]
    );
  };

  // Handle like button
  const handleLike = async () => {
    if (!isAuthenticated || !userId) {
      handleUnauthenticated();
      return;
    }

    try {
      setIsLiking(true);
      const newIsLiked = !isLiked;
      const newLikeCount = newIsLiked ? likeCount + 1 : Math.max(0, likeCount - 1);

      // Optimistic update
      setIsLiked(newIsLiked);
      setLikeCount(newLikeCount);
      onLikeUpdate?.(newLikeCount, newIsLiked);

      // API call - the server handles the user context from the auth token
      await likePost(postId);
    } catch (error) {
      console.error("Error liking post:", error);
      // Revert on error
      setIsLiked(!isLiked);
      setLikeCount(likeCount);
      Alert.alert("Error", "Could not update like. Please try again.");
    } finally {
      setIsLiking(false);
    }
  };

  // Handle bookmark button
  const handleBookmarkPress = async () => {
    if (!isAuthenticated || !userId) {
      handleUnauthenticated();
      return;
    }

    try {
      setIsBookmarking(true);
      const newBookmarkState = !isPostBookmarked;
      
      // Optimistic update
      setIsPostBookmarked(newBookmarkState);
      
      // API call - the server handles the user context from the auth token
      const res = await toggleBookmark(postId);
      
      if (res && res.success) {
        onBookmarkToggle?.(res.isBookmarked);
      } else {
        // Revert on failure
        setIsPostBookmarked((prev) => !prev);
        throw new Error("Failed to update bookmark");
      }
    } catch (error) {
      console.error("Error toggling bookmark:", error);
      Alert.alert("Error", "Could not update bookmark. Please try again.");
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

  // Common button props for unauthenticated state
  const getButtonStyle = (isActive: boolean) => ({
    ...styles.actionButton,
    opacity: isAuthenticated ? 1 : 0.6,
  });

  return (
    <View style={styles.container}>
      <View style={styles.actionContainer}>
        {/* Like button + count */}
        <TouchableOpacity
          style={getButtonStyle(isLiked)}
          onPress={isAuthenticated ? handleLike : handleUnauthenticated} // ← here
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

        {/* Comment button + count */}
        <TouchableOpacity
          style={getButtonStyle(false)}
          onPress={isAuthenticated ? onCommentPress : handleUnauthenticated} // ← here
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

        {/* Bookmark button - visible to all but disabled when not authenticated */}
        <TouchableOpacity
          style={getButtonStyle(isPostBookmarked)}
          onPress={isAuthenticated ? handleBookmarkPress : handleUnauthenticated}
          disabled={!isAuthenticated || isBookmarking}
          activeOpacity={0.7}
        >
          <Ionicons
            name={isPostBookmarked ? "bookmark" : "bookmark-outline"}
            size={24}
            color={isPostBookmarked ? "#f39c12" : "#999"}
          />
        </TouchableOpacity>
        

        {/* Configure button - only for authenticated users */}
        {isAuthenticated && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => {
              // Handle configure action
              console.log("Configure button pressed");
            }}
            activeOpacity={0.7}
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
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: "#f0f0f0",
    marginVertical: 8,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    gap: 24,
  },
  countText: { 
    marginLeft: 4, 
    fontSize: 14, 
    color: "#666",
    minWidth: 16,
    textAlign: 'center',
  },
  actionButton: { 
    flexDirection: "row", 
    alignItems: "center",
    padding: 4,
    borderRadius: 8,
  },
});

export default PostActions;
