import Constants from "expo-constants";
import axios from "axios";

const api = axios.create({
  baseURL: Constants.expoConfig?.extra?.apiUrl,
});

const TEMP_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJodHRwOi8vc2NoZW1hcy54bWxzb2FwLm9yZy93cy8yMDA1LzA1L2lkZW50aXR5L2NsYWltcy9uYW1laWRlbnRpZmllciI6IjY4YjNmMGNlNzA1ZDhjY2JmNjVlNGNiNiIsImh0dHA6Ly9zY2hlbWFzLnhtbHNvYXAub3JnL3dzLzIwMDUvMDUvaWRlbnRpdHkvY2xhaW1zL25hbWUiOiJLdW1hciIsImh0dHA6Ly9zY2hlbWFzLnhtbHNvYXAub3JnL3dzLzIwMDUvMDUvaWRlbnRpdHkvY2xhaW1zL2VtYWlsYWRkcmVzcyI6ImhhbXNha3VtYXIxMDEwQGdtYWlsLmNvbSIsImh0dHA6Ly9zY2hlbWFzLm1pY3Jvc29mdC5jb20vd3MvMjAwOC8wNi9pZGVudGl0eS9jbGFpbXMvcm9sZSI6IlN0dWRlbnQiLCJleHAiOjE3NTcyNDg3MTAsImlzcyI6IkJhY2tlbmRBcHAiLCJhdWQiOiJCYWNrZW5kVXNlcnMifQ.r-M-S-USMuD1I8Q2dFVkSk_Q4atCLGQDmcQxo47M5A0";

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
