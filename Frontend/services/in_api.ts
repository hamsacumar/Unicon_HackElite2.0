const BASE_URL = 'http://10.10.2.174:5179';

// Get token from localStorage (web) or AsyncStorage (React Native)
function getToken() {
    return localStorage.getItem("token"); // or await AsyncStorage.getItem("token") for React Native
}

export async function submitEvent(formData: FormData) {
    const token = getToken();
    const res = await fetch(`${BASE_URL}/api/Events`, {
        method: 'POST',
        body: formData,
        headers: {
            Authorization: `Bearer ${token}` // now token is defined
        }
    });
    return res.json();
}

export async function fetchEvents() {
    const res = await fetch(`${BASE_URL}/api/Events`);
    return res.json();
}
