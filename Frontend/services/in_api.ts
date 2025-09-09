import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import Constants from "expo-constants";
import axios, { AxiosError, AxiosHeaders, InternalAxiosRequestConfig } from "axios";

const api = axios.create({
  baseURL: Constants.expoConfig?.extra?.apiUrl,
  headers: {
    Accept: "application/json",
  },
});

// 🔒 Secure storage wrapper
const secureStorage = {
  async getItem(key: string): Promise<string | null> {
    if (Platform.OS === "web") {
      return localStorage.getItem(key);
    }
    return await SecureStore.getItemAsync(key);
  },
  async setItem(key: string, value: string): Promise<void> {
    if (Platform.OS === "web") {
      localStorage.setItem(key, value);
    } else {
      await SecureStore.setItemAsync(key, value);
    }
  },
  async removeItem(key: string): Promise<void> {
    if (Platform.OS === "web") {
      localStorage.removeItem(key);
    } else {
      await SecureStore.deleteItemAsync(key);
    }
  },
};

// 🔑 Token management
export async function saveToken(token: string) {
  await secureStorage.setItem("accessToken", token);
}

export async function getToken(): Promise<string | null> {
  return (
    (await secureStorage.getItem("accessToken")) ||
    (await secureStorage.getItem("token"))
  );
}

export async function clearToken() {
  await Promise.all([
    secureStorage.removeItem("accessToken"),
    secureStorage.removeItem("token"),
  ]);
}

// 📌 Axios interceptor to attach token
api.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const token = await getToken();
  if (token) {
    if (config.headers instanceof AxiosHeaders) {
      config.headers.set("Authorization", `Bearer ${token}`);
    } else {
      const headers = new AxiosHeaders(config.headers);
      headers.set("Authorization", `Bearer ${token}`);
      config.headers = headers;
    }
  }
  return config;
});

// 📌 Axios interceptor to handle 401
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      console.warn("401 Unauthorized. Clearing token...");
      await clearToken();
      throw new Error("Session expired. Please log in again.");
    }
    return Promise.reject(error);
  }
);

// 📤 Submit event
export async function submitEvent(
  formData: FormData
): Promise<{ success: boolean; eventId?: string; message?: string }> {
  try {
    const { data } = await api.post("/Events", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return { success: true, ...data };
  } catch (err) {
    console.error("Submit event error:", err);
    const message =
      err instanceof Error ? err.message : "An unknown error occurred";
    return { success: false, message };
  }
}

// 📥 Fetch events
export async function fetchEvents() {
  try {
    const { data } = await api.get("/Events");
    return data;
  } catch (err) {
    console.error("Fetch events error:", err);
    return { success: false, message: "Failed to fetch events" };
  }
}

// 🔐 Login
export async function login(username: string, password: string) {
  try {
    const { data } = await api.post(
      `${Constants.expoConfig?.extra?.apiUrl?.replace("/api", "")}/auth/login`,
      { username, password }
    );

    if (data.token) {
      await saveToken(data.token);
    }
    return data;
  } catch (err) {
    console.error("Login error:", err);
    return { success: false, message: "Login failed" };
  }
}

// 👤 Get current user
export async function getCurrentUser() {
  try {
    const { data } = await api.get("/account/me");
    return data;
  } catch (err) {
    console.error("Get current user error:", err);
    return { success: false, message: "Failed to fetch user" };
  }
}

export default api;
