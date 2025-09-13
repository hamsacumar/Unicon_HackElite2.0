// screens/OrgPostDetail.tsx

import React, { useState, useEffect, useCallback } from "react";
import {
    View,
    Text,
    Image,
    StyleSheet,
    ScrollView,
    ActivityIndicator,
    RefreshControl,
    TouchableOpacity,
    Alert,
} from "react-native";
import { RouteProp } from "@react-navigation/native";
import { RootStackParamList } from "../App";
import PostActions from "../component/PostActions";
import CommentSection from "../component/CommentSection";
import { getEventById, EventItem, isBookmarked, deletePost } from "../services/eventService";
import { Ionicons } from "@expo/vector-icons";
import Constants from "expo-constants";
import BottomNav from "../component/bottomNav";
import AsyncStorage from "@react-native-async-storage/async-storage";
import PostText from "../component/PostText";

const API_URL = Constants.expoConfig?.extra?.apiUrl?.replace("/api", "");

type OrgPostDetailParams = {
    post: EventItem;
};

type PostDetailRouteProp = RouteProp<{ OrgPostDetail: OrgPostDetailParams }, "OrgPostDetail">;
type PostDetailNavigationProp = any;

type Props = {
    route: PostDetailRouteProp;
    navigation: PostDetailNavigationProp;
};

export default function OrgPostDetail({ route, navigation }: Props) {
    const { post: initialPost } = route.params;
    const postId = initialPost?.id;

    const [post, setPost] = useState<EventItem | null>(initialPost || null);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const [commentCount, setCommentCount] = useState(0);
    const [likeCount, setLikeCount] = useState(0);
    const [isLiked, setIsLiked] = useState(false);
    const [userId, setUserId] = useState<string | null>(null);
    const [isBookmarkedPost, setIsBookmarkedPost] = useState(false);
    const [showComments, setShowComments] = useState(false);

    // Fetch logged-in user ID
    useEffect(() => {
        const fetchUser = async () => {
            try {
                const id = await AsyncStorage.getItem("userId");
                setUserId(id || null);
            } catch (err) {
                console.error("Error fetching userId:", err);
            }
        };
        fetchUser();
    }, []);

    // Fetch post details
    const fetchPost = useCallback(async () => {
        if (!postId) return;
        try {
            if (!isRefreshing) setIsLoading(true);

            const postData = await getEventById(postId);
            if (postData) {
                setPost(postData);
                setLikeCount(postData.likeCount || 0);
                setCommentCount(postData.commentCount || 0);
                setIsLiked(postData.isLiked || false);

                if (userId) {
                    const bookmarked = await isBookmarked(postId);
                    setIsBookmarkedPost(bookmarked);
                }
            }
        } catch (error) {
            console.error("Error fetching post:", error);
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, [postId, userId, isRefreshing]);

    useEffect(() => {
        fetchPost();
    }, [fetchPost]);

    // Refresh handler
    const handleRefresh = () => {
        setIsRefreshing(true);
        setShowComments(false);
        fetchPost();
    };

    // Handlers
    const handleLikeUpdate = (count: number, liked: boolean) => {
        setLikeCount(count);
        setIsLiked(liked);
    };
    const handleCommentAdd = (count: number) => setCommentCount(count);
    const handleBookmarkToggle = (bookmarked: boolean) => setIsBookmarkedPost(bookmarked);

    const handleUserPress = (userId: string) => {
        navigation.navigate("ViewProfile", { userId });
    };

    const handleCommentPress = () => {
        if (!userId) {
            navigation.navigate("Login");
            return;
        }
        setShowComments(true);
    };

    const handleDeletePost = async () => {
        if (!postId) return;

        Alert.alert(
            "Confirm Delete",
            "Are you sure you want to delete this post?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            const success = await deletePost(postId);
                            if (success) {
                                Alert.alert("Success", "Post deleted successfully");
                                navigation.goBack();
                            } else {
                                Alert.alert("Error", "Failed to delete post. Please try again.");
                            }
                        } catch (err) {
                            console.error("Error deleting post:", err);
                            Alert.alert("Error", "Something went wrong. Please try again.");
                        }
                    },
                },
            ]
        );
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
                contentContainerStyle={{ paddingBottom: 120 }}
            >
                {/* Top Action Buttons */}
                <View style={styles.topButtonContainer}>
                    <TouchableOpacity
                        style={[styles.actionButton, { backgroundColor: "#e74c3c" }]}
                        onPress={handleDeletePost}
                    >
                        <Text style={styles.actionButtonText}>Delete Post</Text>
                    </TouchableOpacity>
                </View>

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
                                    : `${API_URL}${
                                          post.imageUrl.startsWith("/") ? "" : "/"
                                      }${post.imageUrl}`,
                            }}
                            style={styles.postImage}
                            resizeMode="contain"
                        />
                    )}
                </View>

                {/* Stats */}
                <View style={styles.statsContainer}>
                    <Text style={styles.statsText}>
                        {likeCount} {likeCount === 1 ? "like" : "likes"}
                    </Text>
                    <Text style={[styles.statsText, { marginLeft: 16 }]}>
                        {commentCount} {commentCount === 1 ? "comment" : "comments"}
                    </Text>
                </View>

                <PostActions
                    postId={postId}
                    userId={userId}
                    initialLikeCount={likeCount}
                    initialCommentCount={commentCount}
                    initialIsLiked={userId ? isLiked : false}
                    initialIsBookmarked={userId ? isBookmarkedPost : false}
                    onLikeUpdate={handleLikeUpdate}
                    onBookmarkToggle={handleBookmarkToggle}
                    onCommentPress={handleCommentPress}
                />

                {/* Comment Section */}
                {showComments && (
                    <CommentSection
                        postId={postId}
                        userId={userId || undefined}
                        onCommentAdd={handleCommentAdd}
                        initialComments={[]}
                        initialCommentCount={commentCount}
                    />
                )}
            </ScrollView>

            {/* BottomNav for unauthenticated users */}
            {!userId && (
                <BottomNav
                    onPressLogin={() => navigation.navigate("Login")}
                    onPressRegister={() => navigation.navigate("Signup")}
                />
            )}
        </View>
    );
}

// ====================
// Styles
// ====================
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#fff" },
    scrollView: { flex: 1 },

    topButtonContainer: {
        flexDirection: "row",
        justifyContent: "flex-end",
        paddingHorizontal: 16,
        marginTop: 12,
        marginBottom: 8,
    },
    actionButton: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 6,
        marginLeft: 8,
    },
    actionButtonText: {
        color: "#fff",
        fontSize: 14,
        fontWeight: "600",
    },

    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#fff",
    },
    errorContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
        backgroundColor: "#fff",
    },
    errorText: { marginTop: 16, fontSize: 16, color: "#666" },

    contentContainer: {
        marginTop: 16,
        paddingHorizontal: 16,
        paddingBottom: 12,
    },
    category: {
        fontSize: 12,
        fontWeight: "600",
        color: "#e74c3c",
        marginBottom: 4,
        textTransform: "uppercase",
        letterSpacing: 0.5,
    },
    title: {
        fontSize: 20,
        fontWeight: "700",
        color: "#222",
        marginBottom: 8,
        lineHeight: 26,
    },
    description: { fontSize: 15, color: "#444", lineHeight: 22, marginBottom: 12 },
    postImage: {
        width: "100%",
        height: 280,
        borderRadius: 8,
        marginTop: 8,
        backgroundColor: "#f5f5f5",
    },

    statsContainer: {
        flexDirection: "row",
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: "#f0f0f0",
    },
    statsText: { fontSize: 14, color: "#666" },
});
