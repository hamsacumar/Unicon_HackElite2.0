import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

const API_BASE = "http://10.10.12.109:5179/api";

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    return AsyncStorage.getItem("token").then((token) => {
      if (token) {
        // Use optional chaining and type assertion
        (config.headers as any).Authorization = `Bearer ${token}`;
      }
      return config;
    });
  },
  (error) => Promise.reject(error)
);

export const setToken = async (token: string) => {
  await AsyncStorage.setItem("token", token);
};

export default api;
