import Constants from "expo-constants";
import axios from "axios";
import * as SecureStore from "expo-secure-store";

const api = axios.create({
  baseURL: Constants.expoConfig?.extra?.apiUrl,
});

// Helper to get token
async function getToken(): Promise<string | null> {
  return await SecureStore.getItemAsync("accessToken");
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

// ----------------- Interfaces -----------------
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
export interface Profile {
  firstName: string;
  lastName: string;
  username: string;
  description?: string;
  profileImageUrl?: string | null;
}

export interface ProfileUpdateRequest {
  firstName?: string | null;
  lastName?: string | null;
  username?: string | null;
  description?: string | null;
  profileImageUrl?: string | null;
}


export interface ProfileResponse {
  firstName: string;
  lastName: string;
  username: string;
  description: string;
  profileImageUrl?: string | null;
}

// ----------------- Services -----------------
export const ProfileService = {
  getProfile: async (): Promise<ProfileResponse> => {
    return authGet<ProfileResponse>("/ProfileDetail/me");
  },

  getPosts: async (): Promise<Post[]> => {
    return authGet<Post[]>("/ProfileDetail/my-events");
  },

  getPostCount: async (): Promise<number> => {
    const posts = await authGet<Post[]>("/ProfileDetail/my-events");
    return posts.length;
  },
};

export const updateProfile = async (
  data: ProfileUpdateRequest
): Promise<ProfileResponse | null> => {
  const token = await SecureStore.getItemAsync("accessToken");
  if (!token) return null;

  try {
    const response = await api.put<ProfileResponse>("/ProfileDetail/me", data, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    console.error("Error updating profile:", error);
    return null;
  }
};
