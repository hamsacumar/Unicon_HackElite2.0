import axios from "axios";
import * as SecureStore from "expo-secure-store";
import Constants from "expo-constants";
import { jwtDecode } from "jwt-decode";

// -------------------- Types --------------------
interface TokenPayload {
  sub?: string;
  userId?: string;
  id?: string;
  nameid?: string;
  exp?: number;
  [key: string]: any;
}

export interface Message {
  id: string;
  senderId: string;
  senderUsername: string;
  receiverId: string;
  receiverUsername: string;
  text: string;
  status: string;
  timestamp: string;
}

// -------------------- Constants --------------------
const API_BASE = Constants.expoConfig?.extra?.apiUrl || "http://localhost:5000/api";
const TOKEN_KEY = "accessToken";
const USER_ID_KEY = "userId";
const USER_ID_CLAIM = "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier";

// -------------------- Secure Storage --------------------
const storage = {
  async get(key: string) {
    try {
      return await SecureStore.getItemAsync(key);
    } catch (err) {
      console.warn(`[Storage] Error getting ${key}:`, err);
      return null;
    }
  },
  async set(key: string, value: string) {
    try {
      await SecureStore.setItemAsync(key, value);
    } catch (err) {
      console.warn(`[Storage] Error setting ${key}:`, err);
    }
  },
  async remove(key: string) {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch (err) {
      console.warn(`[Storage] Error removing ${key}:`, err);
    }
  },
};

// -------------------- Auth Helpers --------------------
let authToken: string | null = null;
let currentUserId: string | null = null;

export const setAuthToken = async (token: string) => {
  authToken = token;

  try {
    const decoded: TokenPayload = jwtDecode(token);
    console.log("[Auth] Decoded token:", decoded);

    currentUserId =
      decoded.sub ||
      decoded.userId ||
      decoded.id ||
      decoded.nameid ||
      decoded[USER_ID_CLAIM] ||
      null;

    if (!currentUserId) console.warn("[Auth] Could not extract userId from token");

    await storage.set(TOKEN_KEY, token);
    if (currentUserId) await storage.set(USER_ID_KEY, currentUserId);
  } catch (err) {
    console.error("[Auth] Failed to decode token:", err);
  }
};

export const getAuthToken = async (): Promise<string> => {
  if (authToken) return authToken;

  const token = await storage.get(TOKEN_KEY);
  if (token) {
    authToken = token;
    return token;
  }

  throw new Error("No authentication token available");
};

export const getCurrentUserId = async (): Promise<string> => {
  if (currentUserId) return currentUserId;

  const storedId = await storage.get(USER_ID_KEY);
  if (storedId) {
    currentUserId = storedId;
    return storedId;
  }

  const token = await getAuthToken();
  if (token) {
    const decoded: TokenPayload = jwtDecode(token);
    currentUserId =
      decoded.sub ||
      decoded.userId ||
      decoded.id ||
      decoded.nameid ||
      decoded[USER_ID_CLAIM] ||
      null;
    if (currentUserId) return currentUserId;
  }

  throw new Error("User ID not available");
};

export const clearAuth = async () => {
  authToken = null;
  currentUserId = null;
  await Promise.all([storage.remove(TOKEN_KEY), storage.remove(USER_ID_KEY)]);
  console.log("[Auth] Cleared authentication");
};

// -------------------- Axios Instance --------------------
const api = axios.create({
  baseURL: API_BASE,
  headers: { Accept: "application/json", "Content-Type": "application/json" },
  timeout: 10000,
});

api.interceptors.request.use(async (config) => {
  try {
    const token = await getAuthToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch {
    console.warn("[API] No auth token available");
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    if (err.response?.status === 401 && !err.config._retry) {
      console.warn("[API] 401 Unauthorized - clearing auth");
      await clearAuth();
    }
    return Promise.reject(err);
  }
);

// -------------------- Messaging API --------------------
export const sendMessage = async (receiverUsername: string, text: string) => {
  const senderId = await getCurrentUserId();
  const res = await api.post("/Messages/send", {
    SenderId: senderId,
    ReceiverUsername: receiverUsername.trim(),
    Text: text.trim(),
  });
  return res.data;
};

export const getInbox = async (): Promise<Message[]> => {
  const userId = await getCurrentUserId();
  const res = await api.get(`/Messages/inbox/${userId}`);
  return res.data?.data || [];
};

export const getConversation = async (otherUserId: string): Promise<Message[]> => {
  const currentUserId = await getCurrentUserId();
  const res = await api.get(`/Messages/conversation/${currentUserId}/${otherUserId}`);
  return res.data?.data || [];
};

export const deleteMessages = async (ids: string[]) => {
  const res = await api.post("/Messages/delete", ids);
  return res.data;
};

export default api;
