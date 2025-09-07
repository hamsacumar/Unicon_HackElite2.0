import axios from "axios";
import Constants from "expo-constants";

const api = axios.create({
  baseURL: Constants.expoConfig?.extra?.apiUrl,
});

export interface UserProfile {
  username: string;
  description: string;
  profileImageUrl?: string; 
  postCount?: number;
}

export interface UserEvent {
  id: string;
  title: string;
  description: string;
  category: string;
  startDate: string;
  endDate: string;
  imageUrl?: string;
  userId: string;
  createdAt: string;
}

export const UserProfileService = {
  getProfileByUsername: async (username: string): Promise<UserProfile> => {
    const encodedUsername = encodeURIComponent(username);
    const response = await api.get(`/ProfileDetail/description/${encodedUsername}`);
    return response.data;
  },

  getEventsByUsername: async (username: string): Promise<UserEvent[]> => {
    const encodedUsername = encodeURIComponent(username);
    const response = await api.get(`/ProfileDetail/events/${encodedUsername}`);
    return response.data;
  },

  getPostCountByUsername: async (username: string): Promise<number> => {
    const encodedUsername = encodeURIComponent(username);
    const response = await api.get<{ username: string; postCount: number }>(
      `/ProfileDetail/posts/count/${encodedUsername}`
    );
    return response.data.postCount;
  },

  

  
};
