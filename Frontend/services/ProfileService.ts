import Constants from "expo-constants";
import axios from "axios";
import * as SecureStore from "expo-secure-store";

const api = axios.create({
  baseURL: Constants.expoConfig?.extra?.apiUrl,
});

// Helper to get token
async function getToken(): Promise<string | null> {
  return await SecureStore.getItemAsync("accessToken"); // adjust key if different
}

// Add Authorization header
async function authGet<T>(url: string): Promise<T> {
  const token = await getToken();
  if (!token) throw new Error("No access token found");

  const response = await api.get<T>(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
  return response.data;
}

export interface Profile {
  username: string;
  description: string;
  profileImageUrl?: string | null;
}

export interface Post {
  id: string;
  title: string;
  description: string;
  category: string;
  startDate: string;
  endDate: string;
  imageUrl: string;
  userId: string;
  createdAt: string;
}

export interface Posts {
  id: string;
  title: string;
  description: string;
  category: string;
  startDate: string;
  endDate: string;
  imageUrl: string;
  userId: string;
  createdAt: string;
}

export const ProfileService = {
  getProfile: async (): Promise<Profile> => {
    return authGet<Profile>("/ProfileDetail/me");
  },

  getPosts: async (): Promise<Post[]> => {
    return authGet<Post[]>("/ProfileDetail/my-events");
  },

  getBookmarkedPosts: async (): Promise<Posts[]> => {
    return authGet<Post[]>("/ProfileDetail/my-bookmarks");
  },

  getPostCount: async (): Promise<number> => {
    const posts = await authGet<Post[]>("/ProfileDetail/my-events");
    return posts.length; // simply return the number of posts
  },


};



