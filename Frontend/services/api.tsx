import * as SecureStore from "expo-secure-store";
import Constants from "expo-constants";
import axios from "axios";

// Define the type for test data items
export interface TestDataItem {
  id: string;
  value: string;
}

const BASE_URL =
  Constants.expoConfig?.extra?.apiUrl || "http://10.10.17.176:5179/api";

const api = axios.create({
  baseURL: BASE_URL,
});

// Add console log to verify the URL
console.log("API Base URL:", BASE_URL);

const apiFetch = async (endpoint: string, options: RequestInit = {}) => {
  const token = await SecureStore.getItemAsync("accessToken");
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const fullUrl = `${BASE_URL}${endpoint}`;
  console.log("Making request to:", fullUrl, "with options:", options);

  try {
    const response = await fetch(fullUrl, {
      ...options,
      headers,
    });

    console.log("Response status:", response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("API Error:", errorText);
      throw new Error(errorText || "Request failed");
    }

    const data = await response.json();
    console.log("Response data:", data);
    return data;
  } catch (error) {
    console.error("Network Error:", error);
    throw error;
  }
};

// Test connection function
export const testConnection = async (): Promise<boolean> => {
  try {
    console.log("Testing connection to backend...");
    const response = await fetch(`${BASE_URL}/Test`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    console.log("Connection test status:", response.status);

    if (response.ok) {
      const data = await response.json();
      console.log("Backend connection successful:", data);
      return true;
    } else {
      console.error("Backend connection failed:", response.status);
      return false;
    }
  } catch (error) {
    console.error("Backend connection error:", error);
    return false;
  }
};

// Health check function
export const healthCheck = async (): Promise<{
  status: string;
  message: string;
}> => {
  try {
    const response = await fetch(`${BASE_URL}/health`, {
      method: "GET",
    });

    if (response.ok) {
      return await response.json();
    } else {
      return { status: "error", message: `HTTP ${response.status}` };
    }
  } catch (error) {
    return { status: "error", message: (error as Error).message };
  }
};

export const signup = async (
  username: string,
  email: string,
  password: string
) => {
  return apiFetch("/auth/signup", {
    method: "POST",
    body: JSON.stringify({ username, email, password }),
  });
};

export const verifyEmail = async (
  userId: string,
  code: string,
  purpose: string
) => {
  return apiFetch("/auth/verify-email", {
    method: "POST",
    body: JSON.stringify({ userId, code, purpose }),
  });
};

export const resendCode = async (userId: string, purpose: string) => {
  return apiFetch("/auth/resend-code", {
    method: "POST",
    body: JSON.stringify({ userId, purpose }),
  });
};

export const classifyAccount = async (
  userId: string,
  firstName: string,
  lastName: string,
  address: string,
  description: string | undefined,
  role: string
) => {
  return apiFetch("/auth/classify", {
    method: "POST",
    body: JSON.stringify({
      userId,
      firstName,
      lastName,
      address,
      description,
      role,
    }),
  });
};

export const login = async (usernameOrEmail: string, password: string) => {
  return apiFetch("/auth/login", {
    method: "POST",
    body: JSON.stringify({ usernameOrEmail, password }),
  });
};

export const startForgotPassword = async (email: string) => {
  return apiFetch("/auth/forgot", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
};

export const resetPassword = async (
  email: string,
  code: string,
  newPassword: string,
  confirmPassword: string
) => {
  return apiFetch("/auth/reset-password", {
    method: "POST",
    body: JSON.stringify({ email, code, newPassword, confirmPassword }),
  });
};

export async function getTestData(): Promise<TestDataItem[]> {
  try {
    console.log("Fetching test data from:", `${BASE_URL}/Test`);
    const response = await api.get<TestDataItem[]>("/Test");
    console.log("Test data response:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error fetching test data:", error);
    return [];
  }
}
