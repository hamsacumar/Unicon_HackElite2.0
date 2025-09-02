import Constants from "expo-constants";
import axios from "axios";

// Matches your EventDto from backend
export interface EventItem {
  id: string;
  title: string;
  description: string;
  category: string;
  imageUrl?: string;
}

const api = axios.create({
  baseURL: Constants.expoConfig?.extra?.apiUrl, // reads API_URL from .env
});

// Fetch all events
export async function getEvents(): Promise<EventItem[]> {
  try {
    const response = await api.get<EventItem[]>("/Posts");
    return response.data;
  } catch (error) {
    console.error("Error fetching events:", error);
    return [];
  }
}
