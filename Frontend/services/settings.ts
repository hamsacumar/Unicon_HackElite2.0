import axios from "axios";

const API_BASE = "http://10.10.16.239:5179/api/settings";

export const fetchHelp = async () => {
  const res = await axios.get(`${API_BASE}/help`);
  return res.data.content;
};

export const fetchTerms = async () => {
  const res = await axios.get(`${API_BASE}/terms`);
  return res.data.content;
};

export const fetchAbout = async () => {
  const res = await axios.get(`${API_BASE}/about`);
  return res.data.content;
};
