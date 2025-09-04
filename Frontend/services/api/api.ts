// api.ts
import axios from "axios";

export interface Message {
    id: string;
    senderId: string;
    senderUsername: string;
    receiverId: string;
    text: string;
    status: string;
  }

const BASE_URL = "http://10.10.2.174:5179//api";

export const sendMessage = async (data: any) => {
    const res = await axios.post(`${BASE_URL}/Messages/send`, data);
    return res.data;
};

export const getConversation = async (user1: string, user2: string) => {
    const res = await axios.get(`${BASE_URL}/Messages/conversation/${user1}/${user2}`);
    return res.data;
};

export const markSeen = async (messageId: string) => {
    const res = await axios.post(`${BASE_URL}/Messages/seen/${messageId}`);
    return res.data;
};

export const getInbox = async (userId: string): Promise<Message[]> => {
    const res = await axios.get<Message[]>(`${BASE_URL}/Messages/inbox/${userId}`);
    return res.data; // res.data is correctly Message[]
};