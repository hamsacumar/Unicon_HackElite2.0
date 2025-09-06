
import Constants from "expo-constants";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

// ---------------------------
// Types
// ---------------------------
export interface User { id: string; username: string; imageUrl?: string; }
export interface Comment { id: string; postId: string; userId: string; username: string; userImage?: string; text: string; createdAt: Date | string; }
export interface EventItem { id: string; title: string; description: string; category: string; imageUrl?: string; userId: string; username: string; userImage?: string; likeCount?: number; commentCount?: number; isLiked?: boolean; date?: string; }
export interface LikeResponse { success: boolean; likeCount: number; }
export interface CommentResponse { success: boolean; comment: Comment; }

// ---------------------------
// Axios API
// ---------------------------
const api = axios.create({ baseURL: Constants.expoConfig?.extra?.apiUrl });

// ---------------------------
// Helper: Get token
// ---------------------------
async function getToken(): Promise<string | null> {
  return AsyncStorage.getItem("token");
}

// ---------------------------
// Read-only APIs (for all users)
// ---------------------------
export async function getEvents(): Promise<EventItem[]> {
  try { const res = await api.get<EventItem[]>("/Posts"); return res.data; } 
  catch { return []; }
}

export async function getEventById(postId: string): Promise<EventItem | null> {
  try { const res = await api.get<EventItem>(`/Posts/${postId}`); return res.data; } 
  catch { return null; }
}

export async function getComments(postId: string): Promise<Comment[]> {
  try { const res = await api.get<Comment[]>(`/Posts/${postId}/comments`); return res.data; } 
  catch { return []; }
}

export async function getCommentCount(postId: string): Promise<number> {
  try { const res = await api.get<{ count: number }>(`/Posts/${postId}/comments/count`); return res.data.count; } 
  catch { return 0; }
}

export async function getLikeCount(postId: string): Promise<number> {
  try { const res = await api.get<{ likeCount: number }>(`/Posts/${postId}/likeCount`); return res.data.likeCount; } 
  catch { return 0; }
}

export async function checkIfLiked(postId: string, userId: string): Promise<boolean> {
  try { const res = await api.get<{ isLiked: boolean }>(`/Posts/${postId}/isLiked?userId=${userId}`); return res.data.isLiked; } 
  catch { return false; }
}

// ---------------------------
// Write APIs (token required)
// ---------------------------
export async function addComment(postId: string, data: { text: string }) {
  try {
    const token = await getToken(); if (!token) throw new Error("Not authenticated");
    const res = await api.post(`/Posts/${postId}/comment`, data, { headers: { Authorization: `Bearer ${token}` } });
    return res.data;
  } catch { return null; }
}

export async function likePost(postId: string) {
  try {
    const token = await getToken(); if (!token) throw new Error("Not authenticated");
    const res = await api.post(`/Posts/${postId}/like`, {}, { headers: { Authorization: `Bearer ${token}` } });
    return res.data;
  } catch { return null; }
}

/*
import Constants from "expo-constants";
import axios from "axios";

// ---------------------------
// Types
// ---------------------------
export interface User {
  id: string;
  username: string;
  imageUrl?: string;
}
export interface Comment {
  id: string;
  postId: string;
  userId: string;
  username: string;
  userImage?: string;
  text: string;
  createdAt: Date | string;
}
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
  date?: string;
}
export interface LikeResponse {
  success: boolean;
  likeCount: number;
}
export interface CommentResponse {
  success: boolean;
  comment: Comment;
}

// ---------------------------
// Axios API
// ---------------------------
const api = axios.create({ baseURL: Constants.expoConfig?.extra?.apiUrl });

// ---------------------------
// Temporary hardcoded token
// ---------------------------
const TEMP_TOKEN =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJodHRwOi8v...GvPmYCg1uIFVfm80VfxGeN-6RkfJdrOiXtLE-u4GWSM";
const TEMP_USER_ID = "niro1234"; // any unique string

// ---------------------------
// Read-only APIs (for all users)
// ---------------------------
export async function getEvents(): Promise<EventItem[]> {
  try {
    const res = await api.get<EventItem[]>("/Posts");
    return res.data;
  } catch {
    return [];
  }
}

export async function getEventById(postId: string): Promise<EventItem | null> {
  try {
    const res = await api.get<EventItem>(`/Posts/${postId}`);
    return res.data;
  } catch {
    return null;
  }
}

export async function getComments(postId: string): Promise<Comment[]> {
  try {
    const res = await api.get<Comment[]>(`/Posts/${postId}/comments`);
    return res.data;
  } catch {
    return [];
  }
}

export async function getCommentCount(postId: string): Promise<number> {
  try {
    const res = await api.get<{ count: number }>(
      `/Posts/${postId}/comments/count`
    );
    return res.data.count;
  } catch {
    return 0;
  }
}

export async function getLikeCount(postId: string): Promise<number> {
  try {
    const res = await api.get<{ likeCount: number }>(
      `/Posts/${postId}/likeCount`
    );
    return res.data.likeCount;
  } catch {
    return 0;
  }
}

export async function checkIfLiked(
  postId: string,
  userId: string
): Promise<boolean> {
  try {
    const res = await api.get<{ isLiked: boolean }>(
      `/Posts/${postId}/isLiked?userId=${userId}`
    );
    return res.data.isLiked;
  } catch {
    return false;
  }
}

// ---------------------------
// Write APIs (token required)
// ---------------------------
export async function addComment(postId: string, data: { text: string }) {
  try {
    const res = await api.post(`/Posts/${postId}/comment`, data, {
      headers: { Authorization: `Bearer ${TEMP_TOKEN}` },
    });
    return res.data;
  } catch (error) {
    console.error("Error adding comment:", error);
    return null;
  }
}

export async function likePost(postId: string) {
  try {
    const res = await api.post(
      `/Posts/${postId}/like`,
      {},
      { headers: { Authorization: `Bearer ${TEMP_TOKEN}` } }
    );
    return res.data;
  } catch (error) {
    console.error("Error liking post:", error);
    return null;
  }
}
*/