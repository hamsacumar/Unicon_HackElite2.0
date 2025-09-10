import axios from "axios";
import Constants from "expo-constants";

// Use API base from Expo config
const API_BASE = `${Constants.expoConfig?.extra?.apiUrl}/settings`;

// Fetch help content
export const fetchHelp = async () => {
  const res = await axios.get(`${API_BASE}/help`);
  return res.data.content;
};

// Fetch terms content
export const fetchTerms = async () => {
  const res = await axios.get(`${API_BASE}/terms`);
  return res.data.content;
};

// Fetch about content
export const fetchAbout = async () => {
  const res = await axios.get(`${API_BASE}/about`);
  return res.data.content;
};

// Optional: reusable Axios instance for future requests
export const api = axios.create({
  baseURL: Constants.expoConfig?.extra?.apiUrl,
  headers: {
    Accept: "application/json",
  },
});
