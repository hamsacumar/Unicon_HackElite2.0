import Constants from "expo-constants";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

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
export interface BookmarkResponse {
  success: boolean;
  isBookmarked: boolean;
}

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
  console.log("Fetching comments for postId:", postId);
  try {
    const res = await api.get<Comment[]>(`/Posts/${postId}/comments`);
    console.log("comments::", res.data);
    return res.data || [];
  } catch (err) {
    console.error("Error fetching comments:", err);
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
    const token = await getToken();
    if (!token) return false;

    const res = await api.get<{ isLiked: boolean }>(
      `/Posts/${postId}/isLiked`,
      { headers: { Authorization: `Bearer ${token}` } }
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
    const token = await getToken();
    if (!token) throw new Error("Not authenticated");

    const res = await api.post<{ success: boolean; comment: Comment }>(
      `/Posts/${postId}/comment`,
      data,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    // Ensure the returned comment has username and userImage
    if (res.data?.success && res.data.comment) {
      return res.data; // { success: true, comment: { id, postId, userId, username, userImage, text, createdAt } }
    }

    return null;
  } catch (error) {
    console.error("Error adding comment:", error);
    return null;
  }
}

export async function likePost(postId: string) {
  try {
    const token = await getToken();
    if (!token) throw new Error("Not authenticated");
    const res = await api.post(
      `/Posts/${postId}/like`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
  } catch {
    return null;
  }
}

// ---------------------------
// Bookmarks
// ---------------------------
export async function toggleBookmark(
  postId: string
): Promise<BookmarkResponse | null> {
  try {
    const token = await getToken();
    if (!token) throw new Error("Not authenticated");

    const res = await api.post<BookmarkResponse>(
      `/Posts/${postId}/bookmark`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );

    return res.data; // ✅ now TS knows it has success + isBookmarked
  } catch (error) {
    console.error("Error toggling bookmark:", error);
    return null;
  }
}
export async function isBookmarked(postId: string): Promise<boolean> {
  try {
    const token = await getToken();
    if (!token) return false;

    const res = await api.get<{ isBookmarked: boolean }>(
      `/Posts/${postId}/isBookmarked`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data.isBookmarked;
  } catch {
    return false;
  }
}
export async function deletePost(postId: string): Promise<boolean> {
  try {
    const token = await getToken();
    if (!token) throw new Error("Not authenticated");

    const res = await api.delete<{ success: boolean; message: string }>(
      `/Posts/${postId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    return res.data.success;
  } catch (error) {
    console.error("Error deleting post:", error);
    return false;
  }
}

// get saved post
export async function getBookmarks(): Promise<EventItem[]> {
  console.log("[getBookmarks] Start fetching bookmarks");

  try {
    const token = await getToken();
    console.log("[getBookmarks] Retrieved token:", token);

    if (!token) {
      console.warn("[getBookmarks] No token found, user not authenticated");
      throw new Error("Not authenticated");
    }

    // 👇 fix: type it as object with bookmarks
    const res = await api.get<{ bookmarks: EventItem[]; success: boolean }>(
      `/Posts/bookmarks`, // ✅ uppercase "P"
      { headers: { Authorization: `Bearer ${token}` } }
    );

    console.log("[getBookmarks] Response data:", res.data);
    console.log(
      `[getBookmarks] Fetched ${res.data.bookmarks.length} bookmarks`
    );

    return res.data.bookmarks || []; // ✅ always return an array
  } catch (error) {
    console.error("[getBookmarks] Error fetching bookmarks:", error);
    return [];
  } finally {
    console.log("[getBookmarks] Finished fetching bookmarks");
  }
}
