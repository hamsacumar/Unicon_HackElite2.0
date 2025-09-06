import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

const API_BASE = "http://10.10.8.30:5179/api";

const api = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json" },
});

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

// Request interceptor to include token
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem("token");
  if (token) (config.headers as any).Authorization = `Bearer ${token}`;
  return config;
});

// Fetch inbox for logged-in user
export const getInbox = async (userId: string): Promise<Message[]> => {
  const res = await api.get(`/Messages/inbox/${userId}`);
  return res.data.data;
};

// Send a message
export const sendMessage = async (receiverUsername: string, text: string) => {
  const senderId = await AsyncStorage.getItem("userId");
  if (!senderId) throw new Error("No userId found");

  const res = await api.post("/Messages/send", { senderId, receiverUsername, text });
  return res.data;
};

// Get conversation between two users
export const getConversation = async (user1Id: string, user2Id: string): Promise<Message[]> => {
  const res = await api.get(`/Messages/conversation/${user1Id}/${user2Id}`);
  return res.data.data;
};

export default api;
