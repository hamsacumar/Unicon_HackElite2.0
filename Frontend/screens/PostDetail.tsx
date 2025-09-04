import React, { useState, useEffect } from "react";
import { 
  View, 
  Text, 
  Image, 
  StyleSheet, 
  ScrollView, 
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity
} from "react-native";
import { RouteProp, useNavigation } from "@react-navigation/native";
import { RootStackParamList } from "../App";
import PostActions from "../component/PostActions";
import CommentSection from "../component/CommentSection";
import { getEventById, EventItem } from "../services/eventService";
import { Ionicons } from "@expo/vector-icons";
import { format } from 'date-fns';
import Constants from "expo-constants";

const API_URL = Constants.expoConfig?.extra?.apiUrl?.replace("/api", "");

// Route type
type PostDetailRouteProp = RouteProp<RootStackParamList, "PostDetail">;
type PostDetailNavigationProp = any; // Simplified for now

type Props = {
  route: PostDetailRouteProp;
  navigation: PostDetailNavigationProp;
};

export default function PostDetail({ route, navigation }: Props) {
  const { post: initialPost } = route.params;
  const postId = initialPost?.id;
  const [post, setPost] = useState<EventItem | null>(initialPost || null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [commentCount, setCommentCount] = useState(0);
  const [likeCount, setLikeCount] = useState(0);
  const [isLiked, setIsLiked] = useState(false);

  const fetchPost = async () => {
    try {
      const postData = await getEventById(postId);
      if (postData) {
        setPost(postData);
        setLikeCount(postData.likeCount || 0);
        setCommentCount(postData.commentCount || 0);
        setIsLiked(postData.isLiked || false);
      }
    } catch (error) {
      console.error("Error fetching post:", error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPost();
    
    // Set up navigation header
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity onPress={handleShare} style={{ marginRight: 16 }}>
          <Ionicons name="share-social-outline" size={24} color="#333" />
        </TouchableOpacity>
      ),
    });
  }, [postId]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchPost();
  };

  const handleLikeUpdate = (count: number, liked: boolean) => {
    setLikeCount(count);
    setIsLiked(liked);
  };

  const handleCommentAdd = (count: number) => {
    setCommentCount(count);
  };

  const handleShare = () => {
    // Implement share functionality
    console.log("Share post:", postId);
  };

  const handleUserPress = (userId: string) => {
    // Navigate to user profile
    navigation.navigate("UserProfile", { userId });
  };

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

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={["#e74c3c"]}
            tintColor="#e74c3c"
          />
        }
      >
        {/* User Info */}
        <TouchableOpacity 
          style={styles.userRow} 
          onPress={() => handleUserPress(post.userId)}
          activeOpacity={0.7}
        >
          <Image
            source={{
              uri: post.userImage || "https://cdn-icons-png.flaticon.com/512/3135/3135715.png",
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
          <Text style={styles.description}>{post.description}</Text>
          
          {/* Post Image */}
          {post.imageUrl && (
  <Image 
    source={{ 
      uri: post.imageUrl.startsWith("http") 
        ? post.imageUrl 
        : `${API_URL}${post.imageUrl.startsWith("/") ? "" : "/"}${post.imageUrl}` 
    }} 
    style={styles.postImage} 
    resizeMode="cover"
  />
)}
        </View>

        {/* Post Stats */}
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
          userId={null} // Pass null for unauthenticated users
          initialLikeCount={likeCount}
          initialCommentCount={commentCount}
          initialIsLiked={isLiked}
          onLikeUpdate={handleLikeUpdate}
          onCommentPress={() => {
            // For unauthenticated users, this will show the login prompt
            // For authenticated users, you can implement focus logic here
          }}
        />

        {/* Comments Section */}
        <CommentSection 
          postId={postId} 
          userId={null} // Pass null for unauthenticated users
          onCommentAdd={handleCommentAdd}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 8,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    backgroundColor: '#f0f0f0',
  },
  username: {
    fontWeight: '600',
    fontSize: 15,
    color: '#333',
  },
  timestamp: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  category: {
    fontSize: 12,
    fontWeight: '600',
    color: '#e74c3c',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#222',
    marginBottom: 8,
    lineHeight: 26,
  },
  description: {
    fontSize: 15,
    color: '#444',
    lineHeight: 22,
    marginBottom: 12,
  },
  postImage: {
    width: '100%',
    height: 280,
    borderRadius: 8,
    marginTop: 8,
    backgroundColor: '#f5f5f5',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#f0f0f0',
  },
  statsText: {
    fontSize: 14,
    color: '#666',
  },
});
