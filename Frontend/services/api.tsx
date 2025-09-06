import Constants from "expo-constants";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Define the type for test data items
export interface TestDataItem {
  id: string;
  value: string;
}

const api = axios.create({
  baseURL: Constants.expoConfig?.extra?.apiUrl,
});

// ✅ Add token to all requests
api.interceptors.request.use(async (config: any) => {
  const token = await AsyncStorage.getItem("token"); // React Native storage
  if (token) {
    if (!config.headers) config.headers = {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;

export async function getTestData(): Promise<TestDataItem[]> {
  try {
    const response = await api.get<TestDataItem[]>("/Test");
    return response.data;
  } catch (error) {
    console.error("Error fetching test data:", error);
    return [];
  }
}
