import AsyncStorage from "@react-native-async-storage/async-storage";

const BASE_URL = "http://10.10.12.109:5179";

// Get token from AsyncStorage (React Native)
async function getToken(): Promise<string | null> {
  try {
    const token = await AsyncStorage.getItem("token");
    return token;
  } catch (err) {
    console.error("Failed to get token from storage", err);
    return null;
  }
}

// Helper to safely parse JSON
async function safeJson(res: Response) {
  const text = await res.text(); // read raw response
  try {
    return text ? JSON.parse(text) : {}; // parse only if not empty
  } catch (err) {
    console.error("Failed to parse JSON:", text, err);
    return { success: false, message: "Invalid JSON response" };
  }
}

// Submit event
export async function submitEvent(formData: FormData) {
  const token = await getToken();

  try {
    const res = await fetch(`${BASE_URL}/api/Events`, {
      method: "POST",
      body: formData,
      headers: {
        Authorization: token ? `Bearer ${token}` : "",
      },
    });

    // Optional: log status for debugging
    console.log("submitEvent response status:", res.status);
    console.log("submitEvent content-type:", res.headers.get("content-type"));

    return await safeJson(res);
  } catch (err) {
    console.error("submitEvent error:", err);
    return { success: false, message: "Network error" };
  }
}

// Fetch events
export async function fetchEvents() {
  try {
    const res = await fetch(`${BASE_URL}/api/Events`);

    console.log("fetchEvents response status:", res.status);
    console.log("fetchEvents content-type:", res.headers.get("content-type"));

    return await safeJson(res);
  } catch (err) {
    console.error("fetchEvents error:", err);
    return { success: false, message: "Network error" };
  }
}
