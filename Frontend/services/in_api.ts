import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const BASE_URL = "http://10.10.12.232:5179/api";

// Helper to get storage based on platform
const secureStorage = {
  async getItem(key: string): Promise<string | null> {
    if (Platform.OS === 'web') {
      return localStorage.getItem(key);
    }
    return await SecureStore.getItemAsync(key);
  },
  async setItem(key: string, value: string): Promise<void> {
    if (Platform.OS === 'web') {
      localStorage.setItem(key, value);
    } else {
      await SecureStore.setItemAsync(key, value);
    }
  },
  async removeItem(key: string): Promise<void> {
    if (Platform.OS === 'web') {
      localStorage.removeItem(key);
    } else {
      await SecureStore.deleteItemAsync(key);
    }
  }
};

// Save token
export async function saveToken(token: string) {
  try {
    await secureStorage.setItem("accessToken", token);
  } catch (err) {
    console.error("Failed to save token:", err);
    throw err;
  }
}

// Get token from storage
export async function getToken(): Promise<string | null> {
  try {
    // Try to get token from both possible locations
    return await secureStorage.getItem("accessToken") || 
           await secureStorage.getItem("token");
  } catch (err) {
    console.error("Failed to get token from storage:", err);
    return null;
  }
}

// Clear all auth tokens
export async function clearToken() {
  try {
    await Promise.all([
      secureStorage.removeItem("accessToken"),
      secureStorage.removeItem("token")
    ]);
  } catch (err) {
    console.error("Failed to clear tokens:", err);
    throw err;
  }
}

// Helper to safely parse JSON
async function safeJson(res: Response) {
  const text = await res.text();
  try {
    return text ? JSON.parse(text) : {};
  } catch (err) {
    console.error("Failed to parse JSON:", text, err);
    return { success: false, message: "Invalid JSON response" };
  }
}

// Generic fetch with token & retry on 401
async function fetchWithToken(
  url: string,
  options: RequestInit = {},
  retry: boolean = true
): Promise<any> {
  const token = await getToken();
  
  // Ensure headers exist
  options.headers = {
    'Accept': 'application/json',
    ...options.headers,
  };
  
  // Add authorization header if token exists
  if (token) {
    options.headers = {
      ...options.headers,
      'Authorization': `Bearer ${token}`,
    };
  }

  try {
    const fullUrl = url.startsWith('http') ? url : `${BASE_URL}${url}`;
    const res = await fetch(fullUrl, options);

    // Handle 401 Unauthorized
    if (res.status === 401 && retry) {
      console.warn('401 Unauthorized. Clearing token and retrying...');
      await clearToken();
      // You might want to trigger a refresh token flow here if you have refresh tokens
      throw new Error('Session expired. Please log in again.');
    }

    return await safeJson(res);
  } catch (err) {
    console.error("Network error:", err);
    return { success: false, message: "Network error" };
  }
}

// Submit event (FormData)
export async function submitEvent(formData: FormData): Promise<{ success: boolean; eventId?: string; message?: string }> {
  try {
    const token = await getToken();
    console.log('Current token:', token ? 'Token exists' : 'No token found');
    
    if (!token) {
      throw new Error('No authentication token found. Please log in again.');
    }

    console.log('Submitting event with form data...');
    
    console.log('Sending request to:', `${BASE_URL}/Events`);
    
    const response = await fetch(`${BASE_URL}/Events`, {
      method: 'POST',
      body: formData,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      },
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));

    console.log('Response status:', response.status);
    
    // First, get the response text
    const responseText = await response.text();
    console.log('Raw response text:', responseText);
    
    // Try to parse the JSON
    let data;
    try {
      data = responseText ? JSON.parse(responseText) : {};
    } catch (e) {
      console.error('Failed to parse response as JSON:', responseText);
      throw new Error('Invalid response from server');
    }
    
    console.log('Parsed response data:', data);
    
    if (!response.ok) {
      throw new Error(data.message || `Server returned ${response.status}`);
    }

    return { success: true, ...data };
  } catch (error) {
    console.error('Submit event error:', error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'An unknown error occurred' 
    };
  }
}

// Fetch events (JSON)
export async function fetchEvents() {
  return fetchWithToken(`${BASE_URL}/Events`, {
    method: "GET",
  });
}

// Login and save token
export async function login(username: string, password: string) {
  try {
    const res = await fetch(`${BASE_URL.replace("/api", "")}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    const data = await safeJson(res);
    if (data.token) await saveToken(data.token);

    return data;
  } catch (err) {
    console.error("Login error:", err);
    return { success: false, message: "Login failed" };
  }
}

// Get current user info
export async function getCurrentUser() {
  return fetchWithToken(`${BASE_URL}/account/me`, { method: "GET" });
}
