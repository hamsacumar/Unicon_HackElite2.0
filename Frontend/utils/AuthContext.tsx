import React, {
  createContext,
  useState,
  useEffect,
  ReactNode,
  useContext,
} from "react";
import * as SecureStore from "expo-secure-store";
import Constants from "expo-constants";
import Toast from "react-native-toast-message";

const BASE_URL = Constants.expoConfig?.extra?.backendUrl;

interface User {
  username: string;
  email: string;
  role: string;
}

interface AuthContextType {
  token: string | null;
  user: User | null;
  login: (data: {
    accessToken: string;
    username: string;
    email: string;
    role: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const loadAuth = async () => {
      const savedToken = await SecureStore.getItemAsync("accessToken");
      if (savedToken) {
        try {
          const response = await fetch(`${BASE_URL}/api/account/me`, {
            headers: { Authorization: `Bearer ${savedToken}` },
          });
          if (response.ok) {
            const data = await response.json();
            setToken(savedToken);
            setUser({
              username: data.username,
              email: data.email,
              role: data.role,
            });
          } else {
            await logout();
          }
        } catch {
          await logout();
        }
      }
    };
    loadAuth();
  }, []);

  const login = async (data: {
    accessToken: string;
    username: string;
    email: string;
    role: string;
  }) => {
    await SecureStore.setItemAsync("accessToken", data.accessToken);
    setToken(data.accessToken);
    setUser({ username: data.username, email: data.email, role: data.role });
  };

  const logout = async () => {
    await SecureStore.deleteItemAsync("accessToken");
    setToken(null);
    setUser(null);
    Toast.show({ type: "success", text1: "Logged out" });
  };

  return (
    <AuthContext.Provider value={{ token, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// Add this custom hook for safe context access
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
