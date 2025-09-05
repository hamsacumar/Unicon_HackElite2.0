// Frontend/services/eventService.tsx

import Constants from "expo-constants";
import axios from "axios";

// ---------------------------
// Types for application data
// ---------------------------

// User information
export interface User {
  id: string;
  username: string;
  imageUrl?: string;
}

// Comment model
export interface Comment {
  id: string;
  postId: string;
  userId: string;
  username: string;
  userImage?: string;
  text: string; // Comment text
  createdAt: Date | string;
  updatedAt?: Date | string;
}

// Event/Post model
export interface EventItem {
  id: string;
  title: string;
  description: string;
  category: string;
  imageUrl?: string;
  userId: string;
  username: string;
  userImage?: string;
  likeCount?: number;
  commentCount?: number;
  isLiked?: boolean;
  date?: string | Date;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

// Response for liking a post
export interface LikeResponse {
  success: boolean;
  likeCount: number;
}

// Response for adding a comment
export interface CommentResponse {
  success: boolean;
  comment: Comment;
}

// ---------------------------
// Axios API instance
// ---------------------------
const api = axios.create({
  baseURL: Constants.expoConfig?.extra?.apiUrl, // Base URL from Expo config
});

// ---------------------------
// Event / Post APIs
// ---------------------------

// Fetch all events/posts
export async function getEvents(): Promise<EventItem[]> {
  try {
    const response = await api.get<EventItem[]>("/Posts");
    return response.data;
  } catch (error) {
    console.error("Error fetching events:", error);
    return [];
  }
}

// Fetch a single event/post by ID
export async function getEventById(postId: string): Promise<EventItem | null> {
  try {
    const response = await api.get<EventItem>(`/Posts/${postId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching event:", error);
    return null;
  }
}

// ---------------------------
// Like APIs
// ---------------------------

// Like a post
export async function likePost(
  postId: string,
  userId: string
): Promise<boolean> {
  try {
    const response = await api.post<LikeResponse>(`/Posts/${postId}/like`, {
      userId,
    });
    return response.data.success;
  } catch (error) {
    console.error("Error liking post:", error);
    return false;
  }
}

// Get like count for a post
export async function getLikeCount(postId: string): Promise<number> {
  try {
    const response = await api.get<{ likeCount: number }>(
      `/Posts/${postId}/likeCount`
    );
    return response.data.likeCount;
  } catch (error) {
    console.error("Error getting like count:", error);
    return 0;
  }
}

// Check if the user has liked a post
export async function checkIfLiked(
  postId: string,
  userId: string
): Promise<boolean> {
  try {
    const response = await api.get<{ isLiked: boolean }>(
      `/Posts/${postId}/isLiked?userId=${userId}`
    );
    return response.data.isLiked;
  } catch (error) {
    console.error("Error checking like status:", error);
    return false;
  }
}

// ---------------------------
// Comment APIs
// ---------------------------

// Add a comment to a post
export async function addComment(
  postId: string,
  data: { userId: string; text: string }
) {
  try {
    const response = await api.post<CommentResponse>(
      `/Posts/${postId}/comment`,
      {
        userId: data.userId,
        text: data.text, // Must match backend property
      }
    );
    return response.data.comment;
  } catch (error) {
    console.error("Error adding comment:", error);
    return null;
  }
}

// Get all comments for a post
export async function getComments(postId: string): Promise<Comment[]> {
  try {
    const response = await api.get<Comment[]>(`/Posts/${postId}/comments`);
    return response.data;
  } catch (error) {
    console.error("Error fetching comments:", error);
    return [];
  }
}

// Get comment count for a post
export async function getCommentCount(postId: string): Promise<number> {
  try {
    const response = await api.get<{ count: number }>(
      `/Posts/${postId}/comments/count`
    );
    return response.data.count;
  } catch (error) {
    console.error("Error getting comment count:", error);
    return 0;
  }
}
