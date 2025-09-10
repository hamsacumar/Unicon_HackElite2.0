import axios from "axios";
import * as SecureStore from "expo-secure-store";
import { jwtDecode } from "jwt-decode";

// -------------------- Types --------------------
interface TokenPayload {
  sub?: string;
  userId?: string;
  id?: string;
  nameid?: string;
  exp?: number;
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

export interface ProfileResponse {
  firstName: string;
  lastName: string;
  description: string;
  username: string;
}

export interface ProfileUpdateRequest {
  firstName?: string;
  lastName?: string;
  description?: string;
  username?: string;
}

// -------------------- Constants --------------------
const API_BASE = "http://10.10.10.158:5179/api";
const TOKEN_KEY = "accessToken";
const USER_ID_CLAIM =
  "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier";

// -------------------- Secure Storage Helpers --------------------
const secureStorage = {
  async getItem(key: string) {
    try {
      return await SecureStore.getItemAsync(key);
    } catch (error) {
      console.warn(`Error getting ${key} from secure store:`, error);
      return null;
    }
  },
  async setItem(key: string, value: string) {
    try {
      await SecureStore.setItemAsync(key, value);
    } catch (error) {
      console.warn(`Error setting ${key} in secure store:`, error);
    }
  },
  async removeItem(key: string) {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch (error) {
      console.warn(`Error removing ${key} from secure store:`, error);
    }
  },
};

// -------------------- Auth Storage --------------------
let authToken: string | null = null;
let currentUserId: string | null = null;

export const setAuthToken = (token: string) => {
  authToken = token;

  try {
    const decoded = jwtDecode<any>(token);
    console.log("[Auth] Decoded JWT payload:", decoded);

    currentUserId =
      decoded.sub ||
      decoded.userId ||
      decoded.id ||
      decoded.nameid ||
      decoded[USER_ID_CLAIM] ||
      null;

    if (!currentUserId) {
      console.warn("[Auth] Could not extract userId from token");
    }

    secureStorage.setItem(TOKEN_KEY, token);
    if (currentUserId) secureStorage.setItem("userId", currentUserId);
  } catch (error) {
    console.error("[Auth] Failed to decode JWT:", error);
  }
};

export const getAuthToken = async (): Promise<string> => {
  if (authToken) return authToken;

  const token = await secureStorage.getItem(TOKEN_KEY);
  if (token) {
    authToken = token;
    return token;
  }

  throw new Error("No authentication token available");
};

export const getCurrentUserId = async (): Promise<string> => {
  if (currentUserId) return currentUserId;

  const storedUserId = await secureStorage.getItem("userId");
  if (storedUserId) {
    currentUserId = storedUserId;
    return storedUserId;
  }

  const token = await getAuthToken();
  if (token) {
    const decoded = jwtDecode<any>(token);
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
  await Promise.all([
    secureStorage.removeItem(TOKEN_KEY),
    secureStorage.removeItem("userId"),
  ]);
  console.log("[Auth] Cleared authentication data");
};

// -------------------- Axios Instance --------------------
const api = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json" },
  timeout: 10000,
});

api.interceptors.request.use(async (config) => {
  try {
    const token = await getAuthToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch {
    console.warn("No auth token available, request will be unauthenticated");
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401 && !error.config._retry) {
      console.warn("401 Unauthorized - clearing auth data");
      await clearAuth();
    }
    return Promise.reject(error);
  }
);

// -------------------- Messaging API --------------------
export const sendMessage = async (receiverUsername: string, text: string) => {
  const userId = await getCurrentUserId();
  const res = await api.post("/Messages/send", {
    SenderId: userId,
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

export const getConversation = async (
  otherUserId: string
): Promise<Message[]> => {
  const userId = await getCurrentUserId();
  const res = await api.get(`/Messages/conversation/${userId}/${otherUserId}`);
  return res.data?.data || [];
};

// ---------------- PROFILE SERVICE ----------------
export async function getProfile(): Promise<ProfileResponse | null> {
  try {
    const response = await api.get<ProfileResponse>("/account/profile");
    return response.data;
  } catch (error) {
    console.error("[Profile] Error fetching profile:", error);
    return null;
  }
}

export async function updateProfile(
  profile: ProfileUpdateRequest
): Promise<ProfileResponse | null> {
  try {
    const response = await api.put<ProfileResponse>("/account/update", profile);
    return response.data;
  } catch (error) {
    console.error("[Profile] Error updating profile:", error);
    return null;
  }
}

export default api;
