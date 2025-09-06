import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "../services/api/api";

interface Message {
  id: string;
  senderId: string;
  senderUsername: string;
  receiverId: string;
  receiverUsername: string;
  text: string;
  status: string;
  timestamp: string;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

const Inbox: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [userId, setUserId] = useState<string | null>(null);

  // Get userId from AsyncStorage
  useEffect(() => {
    AsyncStorage.getItem("userId").then((id) => setUserId(id));
  }, []);

  useEffect(() => {
    if (!userId) return; // Wait until userId is loaded

    const fetchInbox = async () => {
      try {
        const res = await api.get<ApiResponse<Message[]>>(`/Messages/inbox/${userId}`);
        setMessages(res.data.data);
      } catch (err) {
        console.error(err);
      }
    };

    fetchInbox();
  }, [userId]);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Inbox</Text>
      {messages.length === 0 ? (
        <Text>No messages</Text>
      ) : (
        messages.map((msg) => (
          <View key={msg.id} style={styles.messageContainer}>
            <Text>
              <Text style={styles.sender}>{msg.senderUsername}</Text>: {msg.text}
            </Text>
            <Text style={styles.timestamp}>{new Date(msg.timestamp).toLocaleString()}</Text>
            <Text style={styles.status}>{msg.status}</Text>
          </View>
        ))
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 12,
  },
  messageContainer: {
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
    paddingVertical: 8,
  },
  sender: {
    fontWeight: "bold",
  },
  timestamp: {
    fontSize: 12,
    color: "#666",
  },
  status: {
    fontSize: 12,
    marginTop: 2,
  },
});

export default Inbox;
