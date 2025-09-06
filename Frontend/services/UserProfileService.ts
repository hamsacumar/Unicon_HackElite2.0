import axios from "axios";
import Constants from "expo-constants";

const api = axios.create({
  baseURL: Constants.expoConfig?.extra?.apiUrl,
});

export interface UserProfile {
  username: string;
  description: string;
  userImage?: string; 
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
    const response = await api.get(`/ProfileDetail/description/${username}`);
    return response.data;
  },

  getEventsByUsername: async (username: string): Promise<UserEvent[]> => {
    const response = await api.get(`/ProfileDetail/events/${username}`);
    return response.data;
  },

  getPostCountByUsername: async (username: string): Promise<number> => {
    const response = await api.get<{ username: string; postCount: number }>(
      `/ProfileDetail/posts/count/${username}`
    );
    return response.data.postCount;
  },

  

  
};
