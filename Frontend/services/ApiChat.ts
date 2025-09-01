import axios from 'axios';
import { Message } from '../types/chat';

const API_URL = 'http://192.168.218.134:5179/api/messages';

export const getMessages = (userId: string, otherUserId: string) =>
  axios.get<Message[]>(`${API_URL}/${userId}/${otherUserId}`).then(res => res.data);

export const sendMessageApi = (message: Message) =>
  axios.post<Message>(`${API_URL}/send`, message).then(res => res.data);

export const markMessageSeenApi = (messageId: string) =>
  axios.post(`${API_URL}/seen/${messageId}`);
