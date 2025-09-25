import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import * as SecureStore from "expo-secure-store";
import { Alert } from "react-native";
import Constants from "expo-constants";

type AuthUser = {
  id?: string;
  username?: string;
  email?: string;
  role?: string;
  isEmailVerified?: boolean;
};

type LoginPayload = {
  accessToken: string;
  userId?: string;
  username?: string;
  email?: string;
  role?: string;
  isEmailVerified?: boolean;
};

type AuthContextType = {
  isLoading: boolean;
  token: string | null;
  user: AuthUser | null;
  login: (data: LoginPayload) => Promise<void>;
  logout: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);

  // On mount, hydrate token and try to get basic user profile if available
  useEffect(() => {
    const init = async () => {
      try {
        const storedToken = await SecureStore.getItemAsync("accessToken");
        if (storedToken) {
          setToken(storedToken);
          // Optionally, try to hydrate a minimal user from storage if you save it
          const storedUserJson = await SecureStore.getItemAsync("userProfile");
          if (storedUserJson) {
            setUser(JSON.parse(storedUserJson));
          }
        }
      } catch (e) {
        console.warn("[Auth] Failed to hydrate token:", e);
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, []);

  const login = async (data: LoginPayload) => {
    try {
      if (!data?.accessToken)
        throw new Error("Missing access token in login payload");
      setIsLoading(true);

      // Persist token
      await SecureStore.setItemAsync("accessToken", data.accessToken);
      setToken(data.accessToken);

      // Build and persist a minimal user profile for quick hydration
      const nextUser: AuthUser = {
        id: data.userId,
        username: data.username,
        email: data.email,
        role: data.role,
        isEmailVerified: data.isEmailVerified,
      };
      setUser(nextUser);
      await SecureStore.setItemAsync("userProfile", JSON.stringify(nextUser));
    } catch (e) {
      console.error("[Auth] login error:", e);
      Alert.alert(
        "Login Error",
        e instanceof Error ? e.message : "Unknown error"
      );
      throw e;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      await SecureStore.deleteItemAsync("accessToken");
      await SecureStore.deleteItemAsync("userProfile");
      setToken(null);
      setUser(null);
    } catch (e) {
      console.error("[Auth] logout error:", e);
    } finally {
      setIsLoading(false);
    }
  };

  const value = useMemo<AuthContextType>(
    () => ({ isLoading, token, user, login, logout }),
    [isLoading, token, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
