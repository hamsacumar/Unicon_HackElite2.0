import * as SecureStore from "expo-secure-store";
import Constants from "expo-constants";
import axios from "axios";

// Define the type for test data items
export interface TestDataItem {
  id: string;
  value: string;
}

// Ensure BASE_URL has no trailing slash
const BASE_URL = Constants.expoConfig?.extra?.apiUrl || 'http://10.10.8.24:5179';
const API_BASE = `${BASE_URL.replace(/\/+$/, '')}`;

// Create axios instance with base URL
export const api = axios.create({
  baseURL: `${API_BASE}`,
  timeout: 10000,
  validateStatus: function (status) {
    return status >= 200 && status < 500;
  },
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth toke
api.interceptors.request.use(
  async (config: any) => {
    const token = await SecureStore.getItemAsync('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: any) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

// Add console log to verify the URL
console.log("API Base URL:", API_BASE);

// Test function to verify backend connection
export const testBackendConnection = async () => {
  try {
    console.log("Testing backend connection to:", BASE_URL);
    const response = await fetch(`${BASE_URL}/Test`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`HTTP ${response.status}: ${text}`);
    }
    
    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error("Backend connection test failed:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error instanceof Error ? error.stack : String(error)
    };
  }
};


interface ApiError extends Error {
  status?: number;
  response?: any;
}

const apiFetch = async (endpoint: string, options: RequestInit = {}) => {
  // Ensure we have a fresh token for each request
  const token = await SecureStore.getItemAsync("accessToken");
  console.log('Current token:', token);
  
  // Prepare headers
  const headers = new Headers({
    "Content-Type": "application/json",
    ...(token ? { "Authorization": `Bearer ${token}` } : {}),
    ...(options.headers as Record<string, string> || {})
  });
  
  console.log('Request headers:', JSON.stringify(Object.fromEntries(headers.entries())));

  // Clean up the URL to avoid double slashes
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  const fullUrl = `${API_BASE}/${cleanEndpoint}`;
  
  // Log request details (without sensitive data)
  console.log(`[API] ${options.method || 'GET'} ${fullUrl}`);
  if (options.body) {
    console.log('[API] Request body:', options.body);
  }

  try {
    const response = await fetch(fullUrl, {
      ...options,
      headers,
      credentials: 'include',
    });

    console.log(`[API] Response: ${response.status} ${response.statusText}`);

    // Get response as text first
    const responseText = await response.text();
    console.log('Raw response text:', responseText);
    let responseData;
    
    // Try to parse as JSON, but don't fail if it's not JSON
    try {
      responseData = responseText ? JSON.parse(responseText) : {};
      console.log('Parsed response data:', responseData);
    } catch (e) {
      // If it's not JSON, use the text as the message
      console.warn('Response is not JSON, using as plain text:', responseText);
      if (!response.ok) {
        // If the response is an error, include the status text
        const error = new Error(responseText || response.statusText);
        (error as any).status = response.status;
        throw error;
      }
      responseData = { message: responseText };
    }

    if (!response.ok) {
      // Handle 401 Unauthorized - token might be expired
      if (response.status === 401) {
        await SecureStore.deleteItemAsync("accessToken");
        // TODO: Consider redirecting to login or refreshing token
      }

      // Create a detailed error message
      const errorMessage = responseData.message || 
                         responseData.title ||
                         responseData.detail ||
                         response.statusText ||
                         `Request failed with status ${response.status}`;
      
      const error = new Error(errorMessage) as ApiError;
      error.status = response.status;
      error.response = responseData;
      
      console.error(`[API] Error ${response.status}:`, {
        message: errorMessage,
        url: fullUrl,
        status: response.status,
        response: responseData
      });
      
      throw error;
    }

    return responseData;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    console.error("API Request Failed:", {
      url: fullUrl,
      error: errorMessage,
      stack: errorStack,
    });
    
    const apiError: ApiError = new Error(errorMessage);
    if (error && typeof error === 'object' && 'status' in error) {
      apiError.status = (error as any).status;
    }
    if (error && typeof error === 'object' && 'response' in error) {
      apiError.response = (error as any).response;
    }
    throw apiError;
  }
};

// Test connection function
export const testConnection = async (): Promise<{ success: boolean; message: string }> => {
  try {
    console.log("Testing connection to backend...");
    const response = await apiFetch("/Test", {
      method: "GET"
    });
    
    console.log("Backend connection successful:", response);
    return { success: true, message: "Connection successful" };
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'status' in error) {
      // Handle HTTP errors
      const status = (error as any).status;
      const message = (error as any).message || 'No error message';
      return { 
        success: false, 
        message: `Backend responded with ${status}: ${message}` 
      };
    } 
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    if (errorMessage.includes("Network request failed")) {
      // Handle network errors
      return { 
        success: false, 
        message: `Cannot connect to backend at ${BASE_URL}. Please check your network connection.` 
      };
    }
    
    // Handle other errors
    return { 
      success: false, 
      message: `Connection error: ${errorMessage}` 
    };
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
  try {
    console.log('Sending signup request to:', `${API_BASE}/auth/register`);
    const response = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        username: username.trim(), 
        email: email.trim().toLowerCase(), 
        password: password 
      }),
    });

    const responseText = await response.text();
    console.log('Raw response status:', response.status);
    console.log('Raw response headers:', JSON.stringify(Object.fromEntries(response.headers.entries())));
    console.log('Raw response text:', responseText);
    
    let responseData;
    try {
      responseData = responseText ? JSON.parse(responseText) : {};
      console.log('Parsed response data:', responseData);
    } catch (e) {
      console.error('Failed to parse JSON response:', e, 'Response text:', responseText);
      throw new Error('Invalid response from server');
    }

    if (!response.ok) {
      const errorMessage = responseData.message || 
                         responseData.title ||
                         response.statusText ||
                         'Registration failed';
      throw new Error(errorMessage);
    }

    return responseData;
  } catch (error) {
    console.error('Signup error:', error);
    throw error;
  }
};

export const verifyEmail = async (
  email: string,
  code: string
) => {
  try {
    console.log('Sending verify email request for:', email);
    
    // Make a direct fetch call to bypass the apiFetch wrapper for this specific endpoint
    const response = await fetch(`${API_BASE}/auth/verify-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        email: email.trim().toLowerCase(),
        code: code.trim(),
      }),
    });

    console.log('Raw verify email response status:', response.status);
    
    const responseText = await response.text();
    console.log('Raw response text:', responseText);
    
    let responseData;
    try {
      responseData = responseText ? JSON.parse(responseText) : {};
      
      // If we got a token in the response, save it
      if (responseData.token || responseData.Token) {
        const token = responseData.token || responseData.Token;
        await SecureStore.setItemAsync('accessToken', token);
        console.log('Token saved to SecureStore');
      } else {
        console.log('No token in verify email response');
      }
    } catch (e) {
      console.error('Failed to parse response as JSON:', e);
      throw new Error('Invalid response from server');
    }

    console.log('Parsed verify email response:', JSON.stringify(responseData, null, 2));

    // Handle token from response (case-insensitive)
    const token = responseData.token || responseData.Token;
    if (token) {
      console.log('Token found in response, saving to secure storage');
      await SecureStore.setItemAsync('accessToken', token);
      
      // Update axios default headers
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // Add token to response data for consistency
      responseData.token = token;
      
      // Verify the token was saved
      const storedToken = await SecureStore.getItemAsync('accessToken');
      console.log('Token saved successfully, stored token exists:', !!storedToken);
    } else {
      console.warn('No token found in verify email response');
    }

    return responseData;
  } catch (error) {
    console.error('Verify email error:', error);
    throw error;
  }
};

export const resendCode = async (email: string, purpose: 'signup' | 'reset-password' = 'signup') => {
  try {
    const endpoint = purpose === 'signup' 
      ? "/auth/resend-verification" 
      : "/auth/forgot-password";
    
    console.log(`[API] POST ${endpoint}`);
    console.log('[API] Request body:', JSON.stringify({ email: email.trim().toLowerCase() }));
    
    const response = await fetch(`${API_BASE}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        email: email.trim().toLowerCase() 
      })
    });
    
    const responseText = await response.text().catch(() => '');
    console.log(`[API] Response: ${response.status} ${response.statusText}`);
    console.log('Raw response text:', responseText);

    // For password reset flow - handle separately
    if (purpose === 'reset-password') {
      // Always return success for password reset to prevent email enumeration
      return {
        success: true,
        message: 'If an account exists with this email, a reset code has been sent.'
      };
    }

    // For signup verification flow
    // Check for rate limiting (400 with plain text response)
    if (response.status === 400) {
      if (responseText.includes('wait') || responseText.includes('Wait')) {
        throw new Error('Please wait 2 minutes before requesting a new verification code.');
      }
    }
    
    // Try to parse as JSON, but handle plain text responses
    let responseData;
    try {
      responseData = responseText ? JSON.parse(responseText) : {};
    } catch (e) {
      // If it's not JSON, treat it as plain text
      responseData = { message: responseText };
    }
    
    // Handle successful responses
    if (response.ok) {
      return { 
        success: true, 
        message: responseData.message || 'Verification code sent successfully.',
        ...responseData
      };
    }
    
    // Handle error responses for signup verification
    const errorMessage = responseData.message || 'Failed to process your request';
    
    if (response.status === 400) {
      if (errorMessage.toLowerCase().includes("already verified")) {
        throw new Error('This email is already verified. Please try logging in.');
      }
      if (errorMessage.toLowerCase().includes("wait")) {
        throw new Error('Please wait 2 minutes before requesting a new code.');
      }
    }
    
    throw new Error(errorMessage);
    
  } catch (error) {
    console.error('Resend code error:', error);
    
    // For password reset, always return success to prevent email enumeration
    if (purpose === 'reset-password') {
      return {
        success: true,
        message: 'If an account exists with this email, a reset code has been sent.'
      };
    }
    
    // For signup verification, handle the error
    if (error instanceof Error) {
      if (error.message.includes('wait') || error.message.includes('2 minutes')) {
        throw new Error('Please wait 2 minutes before requesting a new verification code.');
      }
      throw error;
    }
    
    throw new Error('Failed to resend verification code. Please try again.');
  }
};

export const classifyAccount = async (
  userId: string,
  firstName: string,
  lastName: string,
  address: string,
  description: string,
  role: 'Student' | 'Organizer' | 'Admin'
) => {
  try {
    
    
    // Get the token from secure storage
    const token = await SecureStore.getItemAsync("accessToken");
    
    
    if (!token) {
      throw new Error('Authentication token not found. Please log in again.');
    }
    
    const response = await fetch(`${API_BASE}/account/classify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        userId,
        firstName,
        lastName,
        address,
        description,
        role
      })
    });
    
    const responseText = await response.text();
    
    
    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }
    
    return responseText ? JSON.parse(responseText) : {};
  } catch (error) {
    console.error('Classify account error:', error);
    throw error;
  }
};

// Helper function to check if a string is an email
const isEmail = (str: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(str);
};

export const login = async (usernameOrEmail: string, password: string) => {
  try {
    console.log("Attempting login for:", usernameOrEmail);
    
    // Determine if the input is an email or username
    const loginData = isEmail(usernameOrEmail)
      ? { email: usernameOrEmail, password }
      : { username: usernameOrEmail, password };
        
    // Call the login endpoint
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(loginData),
    });
    
    console.log("Login response status:", response.status);
    
    // Get the response text first to handle both JSON and text responses
    const responseText = await response.text();
    
    let loginResponse;
    try {
      // Try to parse as JSON
      loginResponse = JSON.parse(responseText);
    } catch (e) {
      // If not JSON, use the text as the error message
      console.warn('Response is not JSON, using as plain text:', responseText);
      throw new Error(responseText);
    }
    
    if (!response.ok) {
      // Handle error responses
      const errorMessage = loginResponse.message || response.statusText || 'Login failed';
      console.error('Login error:', errorMessage);
      throw new Error(errorMessage);
    }
    
    console.log("Login successful, response:", loginResponse);
    
    // Handle different token property cases (Token, token, accessToken, etc.)
    const token = loginResponse.Token || loginResponse.token || loginResponse.accessToken;
    
    if (!token) {
      throw new Error("No authentication token received from server");
    }
    
    // Store the token for future requests
    await SecureStore.setItemAsync("accessToken", token);
    
    // Get user details from the token or user info in the login response
    // The backend should return the user details in the login response
    // If not, we can make a separate call to /account/me
    let userInfo = loginResponse.user || {};
    
    // If user details aren't in the login response, fetch them
    if (!userInfo || !userInfo.Id) {
      try {
        userInfo = await apiFetch("/account/me", { method: "GET" });
      } catch (error) {
        console.warn("Could not fetch user details:", error);
      }
    }
    
    return {
      accessToken: token,
      username: userInfo.Username || usernameOrEmail.split('@')[0],
      email: userInfo.Email || (isEmail(usernameOrEmail) ? usernameOrEmail : ''),
      role: userInfo.Role || 'user',
      userId: userInfo.Id,
      isEmailVerified: userInfo.IsEmailVerified || false
    };
  } catch (error) {
    console.error("Login error:", error);
    
    // Extract a more specific error message
    let errorMessage = "An error occurred during login";
    
    if (error instanceof Error) {
      // Handle network errors
      if (error.message.includes("Network request failed")) {
        errorMessage = "Unable to connect to the server. Please check your internet connection.";
      } 
      // Handle API error responses
      else if (error.message.includes("401")) {
        errorMessage = "Invalid username or password";
      }
      // Use the error message from the server if available
      else if (error.message) {
        errorMessage = error.message;
      }
    }
    
    console.error("Login failed with message:", errorMessage);
    throw new Error(errorMessage);
  }
};

export const startForgotPassword = async (email: string) => {
  return apiFetch("/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ 
      email: email.trim().toLowerCase() 
    }),
  });
};

export const resetPassword = async (
  email: string,
  code: string,
  newPassword: string,
  confirmPassword: string
) => {
  try {
    // First verify the reset code
    await apiFetch("/auth/verify-reset-code", {
      method: "POST",
      body: JSON.stringify({ 
        email: email.trim().toLowerCase(),
        code: code.trim()
      }),
    });

    // Reset the password in a single step with the code
    return apiFetch("/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ 
        email: email.trim().toLowerCase(),
        code: code.trim(),
        newPassword: newPassword,
        confirmPassword: confirmPassword
      }),
    });
  } catch (error) {
    console.error('Reset password error:', error);
    throw error;
  }
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
