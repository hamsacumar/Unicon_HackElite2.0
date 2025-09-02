import Constants from "expo-constants";
import axios from "axios";

const api = axios.create({
  baseURL: Constants.expoConfig?.extra?.apiUrl,
});

const TEMP_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJodHRwOi8vc2NoZW1hcy54bWxzb2FwLm9yZy93cy8yMDA1LzA1L2lkZW50aXR5L2NsYWltcy9uYW1laWRlbnRpZmllciI6IjY4YjNmNzZiNzk0NTE4ZmI0YTA1Y2MzYSIsImh0dHA6Ly9zY2hlbWFzLnhtbHNvYXAub3JnL3dzLzIwMDUvMDUvaWRlbnRpdHkvY2xhaW1zL25hbWUiOiJLdW1hcjIiLCJodHRwOi8vc2NoZW1hcy54bWxzb2FwLm9yZy93cy8yMDA1LzA1L2lkZW50aXR5L2NsYWltcy9lbWFpbGFkZHJlc3MiOiJtYW5hZ2VybWFuMTAxMEBnbWFpbC5jb20iLCJodHRwOi8vc2NoZW1hcy5taWNyb3NvZnQuY29tL3dzLzIwMDgvMDYvaWRlbnRpdHkvY2xhaW1zL3JvbGUiOiJPcmdhbml6ZXIiLCJleHAiOjE3NTczNDQyMDQsImlzcyI6IkJhY2tlbmRBcHAiLCJhdWQiOiJCYWNrZW5kVXNlcnMifQ.n_GQo-sF-uZOWuqqS0woicJ-MZ3U26kF3pmzF94Cr20";

// Define the type for user response
export interface UserResponse {
  id: string;
  role: string;
}

export async function getUserRole(): Promise<string | null> {
  try {
    const response = await api.get<UserResponse>("/TokenCheck/me", {
      headers: {
        Authorization: `Bearer ${TEMP_TOKEN}`, // <-- replace or inject token dynamically
      },
    });
    return response.data.role;
  } catch (error) {
    console.error("Error fetching user role:", error);
    return null;
  }
}
