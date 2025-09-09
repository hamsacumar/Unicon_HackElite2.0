import axios from "axios";
import * as SecureStore from "expo-secure-store";

const API_BASE = "http://10.10.10.193:5179/api";

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

// In-memory token storage
let authToken: string | null = null;
let currentUserId: string | null = null;

export const setAuthToken = (token: string, userId: string) => {
  authToken = token;
  currentUserId = userId;
  // Also save to secure storage for persistence
  secureStorage.setItem("accessToken", token);
  secureStorage.setItem("userId", userId);
};

export const getAuthToken = async (): Promise<string> => {
  if (authToken) return authToken;
  
  // Try to get from secure storage
  const token = await secureStorage.getItem("accessToken");
  if (token) {
    authToken = token;
    return token;
  }
  
  throw new Error("No authentication token available");
};

export const getCurrentUserId = async (): Promise<string> => {
  if (currentUserId) return currentUserId;
  
  // Try to get from secure storage
  const userId = await secureStorage.getItem("userId");
  if (userId) {
    currentUserId = userId;
    return userId;
  }
  
  throw new Error("User ID not available");
};

export const clearAuth = async () => {
  authToken = null;
  currentUserId = null;
  await Promise.all([
    secureStorage.removeItem("accessToken"),
    secureStorage.removeItem("userId"),
  ]);};

// -------------------- Axios Instance --------------------
const api = axios.create({
  baseURL: API_BASE,
  headers: { 
    "Content-Type": "application/json",
  },
  timeout: 10000, // 10 seconds
});

// Request interceptor to attach token
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await getAuthToken();
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.warn("No auth token available, request will be unauthenticated");
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // If error is 401 and we haven't tried to refresh the token yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      console.warn("401 Unauthorized - clearing auth data");
      await clearAuth();
    }
    
    return Promise.reject(error);
  }
);

// -------------------- Messaging API --------------------
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

// Send a message
export const sendMessage = async (receiverUsername: string, text: string) => {
  const userId = await getCurrentUserId();
  
  try {
    const res = await api.post("/Messages/send", {
      SenderId: userId,
      ReceiverUsername: receiverUsername.trim(),
      Text: text.trim(),
    });
    
    return res.data;
  } catch (error) {
    console.error("Error sending message:", error);
    throw error;
  }
};

// Get inbox messages
export const getInbox = async (): Promise<Message[]> => {
  try {
    const userId = await getCurrentUserId();
    const res = await api.get(`/Messages/inbox/${userId}`);
    return res.data?.data || [];
  } catch (error) {
    console.error("Error fetching inbox:", error);
    throw error;
  }
};

// Get conversation with another user
export const getConversation = async (otherUserId: string): Promise<Message[]> => {
  try {
    const userId = await getCurrentUserId();
    const res = await api.get(`/Messages/conversation/${userId}/${otherUserId}`);
    return res.data?.data || [];
  } catch (error) {
    console.error("Error fetching conversation:", error);
    throw error;
  }
};

export default api;
