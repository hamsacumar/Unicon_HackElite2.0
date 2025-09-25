// screens/PostDetail.tsx

import React, { useState, useEffect, useRef } from "react";
import { 
  View, 
  Text, 
  Image, 
  StyleSheet, 
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  FlatList,
  Keyboard,
} from "react-native";
import { RouteProp } from "@react-navigation/native";
import { RootStackParamList } from "../App";
import PostActions from "../component/PostActions";
import CommentSection from "../component/CommentSection";
import { getEventById, EventItem, isBookmarked as fetchIsBookmarked } from "../services/eventService";
import { Ionicons } from "@expo/vector-icons";
import { format } from 'date-fns';
import Constants from "expo-constants";
import RoleBasedBottomNav  from "../component/rolebasedNav"
import AsyncStorage from "@react-native-async-storage/async-storage";
import PostText from "../component/PostText";
import { useFocusEffect } from '@react-navigation/native';


const API_URL = Constants.expoConfig?.extra?.apiUrl?.replace("/api", "");

type PostDetailRouteProp = RouteProp<RootStackParamList, "PostDetail">;
type PostDetailNavigationProp = any;

type Props = {
  route: PostDetailRouteProp;
  navigation: PostDetailNavigationProp;
  
};

export default function PostDetail({ route, navigation }: Props) {
  const { post: initialPost } = route.params;
  const postId = initialPost?.id;

  // ---------- State ----------
  const [post, setPost] = useState<EventItem | null>(initialPost || null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [commentCount, setCommentCount] = useState(0);
  const [likeCount, setLikeCount] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [isBookmarkedPost, setIsBookmarkedPost] = useState(false);
  const [showComments, setShowComments] = useState(false);

  // Ref for FlatList to scroll to comments
  const flatListRef = useRef<FlatList>(null);
useFocusEffect(
  React.useCallback(() => {
    const fetchUser = async () => {
      const id = await AsyncStorage.getItem("userId");
      setUserId(id || null);
    };
    fetchUser();
  }, [])
);
  

  // ---------- Fetch post details ----------
  useEffect(() => {
    if (!postId) return;

    const fetchPost = async () => {
      try {
        setIsLoading(true);
        const postData = await getEventById(postId);
        if (postData) {
          setPost(postData);
          setLikeCount(postData.likeCount || 0);
          setCommentCount(postData.commentCount || 0);
          setIsLiked(postData.isLiked || false);

          if (userId) {
            const bookmarked = await fetchIsBookmarked(postId);
            setIsBookmarkedPost(bookmarked);
          }
        }
      } catch (error) {
        console.error("Error fetching post:", error);
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    };

    fetchPost();
  }, [postId, userId]);

  // ---------- Handlers ----------

  // Toggle comment section
  const handleCommentPress = () => {
    if (!userId) {
      navigation.navigate("Login"); // redirect if not logged in
      return;
    }

    setShowComments(prev => {
      // Scroll to comment section when opening
      if (!prev) {
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100); // delay to ensure render
      }
      return !prev;
    });
  };

  // Refresh post
  const handleRefresh = () => {
    setIsRefreshing(true);
    setShowComments(false);
    Keyboard.dismiss();
  };

  // Update like count
  const handleLikeUpdate = (count: number, liked: boolean) => {
    setLikeCount(count);
    setIsLiked(liked);
  };

  // Update comment count
  const handleCommentAdd = (count: number) => setCommentCount(count);

  // Update bookmark
  const handleBookmarkToggle = (bookmarked: boolean) => setIsBookmarkedPost(bookmarked);

  // Navigate to user profile
  const handleUserPress = (id: string) => navigation.navigate("ViewProfile", { userId: id });

  // ---------- Render loading / error ----------
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#e74c3c" />
      </View>
    );
  }

  if (!post) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={48} color="#e74c3c" />
        <Text style={styles.errorText}>Post not found</Text>
      </View>
    );
  }

  // ---------- Main Render ----------
  return (
    <KeyboardAvoidingView
       style={{ flex: 1 }}
  behavior={Platform.OS === "ios" ? "padding" : undefined}
  keyboardVerticalOffset={Platform.OS === "ios" ? Constants.statusBarHeight + 80 : 0}
>
      <View style={styles.container}>
        <FlatList
          ref={flatListRef}
          data={[]} // no actual data, using ListHeaderComponent
          keyExtractor={() => "dummy"}
          renderItem={null}
          ListHeaderComponent={
            <>
              {/* User Profile Row */}
              <TouchableOpacity style={styles.userRow} onPress={() => handleUserPress(post.userId)} activeOpacity={0.7}>
                <Image
  source={{
    uri: post.userImage && post.userImage !== "string"
      ? (post.userImage.startsWith("http")
          ? post.userImage
          : `${API_URL}${post.userImage.startsWith("/") ? "" : "/"}${post.userImage}`)
      : "https://cdn-icons-png.flaticon.com/512/3135/3135715.png",
  }}
  style={styles.avatar}
/>
 
                <View>
                  <Text style={styles.username}>{post.username}</Text>
                  <Text style={styles.timestamp}>
                    {post.date ? format(new Date(post.date), 'MMM d, yyyy') : 'Recent'}
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Post Content */}
              <View style={styles.contentContainer}>
                <Text style={styles.category}>{post.category}</Text>
                <Text style={styles.title}>{post.title}</Text>
                <PostText content={post.description} style={styles.description} />
                {post.imageUrl && (
                  <Image
                    source={{
                      uri: post.imageUrl.startsWith("http")
                        ? post.imageUrl
                        : `${API_URL}${post.imageUrl.startsWith("/") ? "" : "/"}${post.imageUrl}`,
                    }}
                    style={styles.postImage}
                    resizeMode="contain"
                  />
                )}
              </View>

              {/* Stats */}
              <View style={styles.statsContainer}>
                <Text style={styles.statsText}>
                  {likeCount} {likeCount === 1 ? 'like' : 'likes'}
                </Text>
                <Text style={[styles.statsText, { marginLeft: 16 }]}>
                  {commentCount} {commentCount === 1 ? 'comment' : 'comments'}
                </Text>
              </View>

              {/* Post Actions */}
<PostActions
  postId={postId}
                userId={userId}
                
  initialLikeCount={likeCount}
  initialCommentCount={commentCount}
  initialIsLiked={userId ? isLiked : false}
  initialIsBookmarked={userId ? isBookmarkedPost : false}
  onLikeUpdate={handleLikeUpdate}
  onBookmarkToggle={handleBookmarkToggle}
  onCommentPress={handleCommentPress} // toggle comments
                disabled={!userId} // 👈 add this
                  commentCount={commentCount}   // ✅ add this

/>

            </>
          }
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              colors={["#e74c3c"]}
              tintColor="#e74c3c"
            />
          }
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: showComments ? 300 : 80 }}
        />

      {/* Comment Section */}
{showComments && (
  <CommentSection
    postId={postId}
    userId={userId}
    onCommentAdd={handleCommentAdd}
    initialComments={[]}
    initialCommentCount={commentCount}
    visible={showComments}
  />
)}



        
<RoleBasedBottomNav navigation={navigation} />
            
      </View>
    </KeyboardAvoidingView>
  );
}

// ====================
// Styles
// ====================
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: '#fff' },
  errorText: { marginTop: 16, fontSize: 16, color: '#666' },
  userRow: { flexDirection: 'row', alignItems: 'center', padding: 16, paddingBottom: 8 },
  avatar: { width: 40, height: 40, borderRadius: 20, marginRight: 12, backgroundColor: '#f0f0f0' },
  username: { fontWeight: '600', fontSize: 15, color: '#333' },
  timestamp: { fontSize: 12, color: '#999', marginTop: 2 },
  contentContainer: { paddingHorizontal: 16, paddingBottom: 12 },
  category: { fontSize: 12, fontWeight: '600', color: '#e74c3c', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  title: { fontSize: 20, fontWeight: '700', color: '#222', marginBottom: 8, lineHeight: 26 },
  description: { fontSize: 15, color: '#444', lineHeight: 22, marginBottom: 12 },
  postImage: { width: '100%', height: 280, borderRadius: 8, marginTop: 8, backgroundColor: '#f5f5f5' },
  statsContainer: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 8, borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#f0f0f0' },
  statsText: { fontSize: 14, color: '#666' },
});
