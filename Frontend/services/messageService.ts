import { api } from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Message {
  _id: string;
  senderId: string;
  senderUsername: string;
  receiverId: string;
  receiverUsername: string;
  text: string;
  status: 'seen' | 'unseen';
  timestamp: string;
}

export const sendMessage = async (receiverUsername: string, text: string) => {
  try {
    const userData = await AsyncStorage.getItem('userData');
    if (!userData) throw new Error('User not authenticated');
    
    const { _id: senderId } = JSON.parse(userData);
    
    const response = await api.post('/messages/send', {
      senderId,
      receiverUsername,
      text
    });
    
    if (response.data.success) {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Failed to send message');
  } catch (error: any) {
    console.error('Error sending message:', error);
    throw new Error(error.response?.data?.message || 'Failed to send message');
  }
};

export const getInbox = async (userId: string): Promise<Message[]> => {
  try {
    const response = await api.get(`/messages/inbox/${userId}`);
    if (response.data.success) {
      return response.data.data;
    }
    throw new Error('Failed to fetch inbox');
  } catch (error) {
    console.error('Error fetching inbox:', error);
    throw error;
  }
};

export const getSentMessages = async (userId: string): Promise<Message[]> => {
  try {
    const response = await api.get(`/messages/sent/${userId}`);
    if (response.data.success) {
      return response.data.data;
    }
    throw new Error('Failed to fetch sent messages');
  } catch (error) {
    console.error('Error fetching sent messages:', error);
    throw error;
  }
};

export const getConversation = async (user1: string, user2: string): Promise<Message[]> => {
  try {
    const response = await api.get(`/messages/conversation/${user1}/${user2}`);
    if (response.data.success) {
      return response.data.data;
    }
    throw new Error('Failed to fetch conversation');
  } catch (error) {
    console.error('Error fetching conversation:', error);
    throw error;
  }
};

export const markAsSeen = async (messageId: string): Promise<boolean> => {
  try {
    const response = await api.put(`/messages/mark-seen/${messageId}`);
    return response.data.success;
  } catch (error) {
    console.error('Error marking message as seen:', error);
    return false;
  }
};
