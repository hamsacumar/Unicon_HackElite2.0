import Constants from "expo-constants";
import axios, { InternalAxiosRequestConfig, AxiosRequestHeaders } from "axios";
import * as SecureStore from "expo-secure-store";

// Axios instance
const api = axios.create({
  baseURL: Constants.expoConfig?.extra?.apiUrl,
});

// In-memory token cache
let inMemoryToken: string | null = null;
const TOKEN_KEY = "accessToken"; // Changed from 'authToken' to match AuthContext

// Save token
export async function saveToken(token: string) {
  try {
    inMemoryToken = token;
    await SecureStore.setItemAsync(TOKEN_KEY, token);
  } catch (error) {
    console.error("[Auth] Error saving token:", error);
    throw error;
  }
}

// Get token
export async function getToken(): Promise<string | null> {
  try {
    // First check in-memory
    if (inMemoryToken) {
      console.log("[Auth] Using in-memory token:", inMemoryToken);
      return inMemoryToken;
    }

    // Then check secure storage
    const token = await SecureStore.getItemAsync(TOKEN_KEY);
    if (token) {
      console.log("[Auth] Retrieved token from storage");
      inMemoryToken = token; // Cache it for next time
      return token;
    }

    console.log("[Auth] No token found");
    return null;
  } catch (error) {
    console.error("[Auth] Error getting token:", error);
    return null;
  }
}

// Clear token
export async function clearToken() {
  try {
    inMemoryToken = null;
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    console.log("[Auth] Token cleared");
  } catch (error) {
    console.error("[Auth] Error clearing token:", error);
  }
}

// Axios interceptor
api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    // Skip for login/refresh token endpoints to avoid infinite loops
    if (config.url?.includes("/auth/")) {
      return config;
    }

    // Get token from storage
    let token = await getToken();

    // If no token, try to get it from the response if this is a retry
    if (!token && config.headers?.Authorization) {
      const authHeader = config.headers.Authorization as string;
      if (authHeader.startsWith("Bearer ")) {
        token = authHeader.substring(7);
      }
    }

    if (token) {
      // Ensure headers exist
      if (!config.headers) {
        config.headers = {} as AxiosRequestHeaders;
      }
      // Set Authorization header with Bearer token
      (config.headers as Record<string, string>).Authorization =
        `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle 401 errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If error is not 401 or we've already tried to refresh, reject
    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    // Mark request as retried
    originalRequest._retry = true;

    try {
      // Try to refresh the token
      const refreshToken = await SecureStore.getItemAsync("refreshToken");
      if (!refreshToken) {
        // No refresh token available, clear everything and redirect to login
        await clearToken();
        // You might want to redirect to login here
        return Promise.reject(error);
      }

      // Call your refresh token endpoint
      const response = await axios.post(
        `${Constants.expoConfig?.extra?.apiUrl}/auth/refresh`,
        {
          refreshToken,
        }
      );

      const { token: newToken } = response.data;

      // Save the new token
      await saveToken(newToken);

      // Update the Authorization header
      originalRequest.headers.Authorization = `Bearer ${newToken}`;

      // Retry the original request
      return api(originalRequest);
    } catch (refreshError) {
      // Refresh token failed, clear everything and redirect to login
      await clearToken();
      // You might want to redirect to login here
      return Promise.reject(refreshError);
    }
  }
);

// Response type
export interface UserResponse {
  id: string;
  role: string;
}

// Fetch user role
export async function getUserRole(): Promise<string | null> {
  try {
    console.log("[Auth] Fetching user role...");

    // Try to get token with retry logic
    let token = await getToken();
    let retryCount = 0;
    const maxRetries = 2;

    while (!token && retryCount < maxRetries) {
      console.log(
        `[Auth] Token not found, retrying... (${retryCount + 1}/${maxRetries})`
      );
      await new Promise((resolve) => setTimeout(resolve, 500)); // Small delay
      token = await getToken();
      retryCount++;
    }

    if (!token) {
      console.error("[Auth] No token available after retries");
      // Check if we have a token in the axios defaults as a fallback
      const defaultAuth = api.defaults.headers.common["Authorization"];
      if (
        defaultAuth &&
        typeof defaultAuth === "string" &&
        defaultAuth.startsWith("Bearer ")
      ) {
        token = defaultAuth.substring(7);
        console.log("[Auth] Using token from axios defaults");
      } else {
        console.error("[Auth] No token available in any source");
        return null;
      }
    } else {
      console.log("[Auth] Using token:", `${token.substring(0, 20)}...`);
    }

    const response = await api.get<UserResponse>("/TokenCheck/me", {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      timeout: 10000, // 10 second timeout
    });

    if (!response.data?.role) {
      console.warn("[Auth] No role found in response");
      return null;
    }

    return response.data.role;
  } catch (error: any) {
    console.error("[Auth] Error fetching user role:", {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
      config: {
        url: error.config?.url,
        method: error.config?.method,
        headers: error.config?.headers,
      },
    });
    return null;
  }
}

export default api;
