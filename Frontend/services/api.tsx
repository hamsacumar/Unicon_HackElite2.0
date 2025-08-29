import Constants from "expo-constants";
import axios from "axios";

// Define the type for test data items
export interface TestDataItem {
  id: string;
  value: string;
}

const api = axios.create({
  baseURL: Constants.expoConfig?.extra?.apiUrl,
});


export async function getTestData(): Promise<TestDataItem[]> {
  try {
    const response = await api.get<TestDataItem[]>("/Test");
    return response.data;
  } catch (error) {
    console.error("Error fetching test data:", error);
    return [];
  }
}
