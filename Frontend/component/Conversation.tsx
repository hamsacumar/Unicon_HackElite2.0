// components/Conversation.tsx
import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import api from "../services/api/api";

interface Message {
  id: string;
  senderUsername: string;
  receiverUsername: string;
  text: string;
  timestamp: string;
}

interface Props {
  user1: string;
  user2: string;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

const Conversation: React.FC<Props> = ({ user1, user2 }) => {
  const [messages, setMessages] = useState<Message[]>([]);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const res = await api.get<ApiResponse<Message[]>>(
          `/messages/conversation/${user1}/${user2}`
        );
        setMessages(res.data.data);
      } catch (err) {
        console.error(err);
      }
    };

    fetchMessages();
  }, [user1, user2]);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Conversation</Text>
      {messages.length === 0 ? (
        <Text>No messages</Text>
      ) : (
        messages.map((msg) => (
          <View key={msg.id} style={styles.messageContainer}>
            <Text>
              <Text style={styles.sender}>{msg.senderUsername}</Text>: {msg.text}
            </Text>
            <Text style={styles.timestamp}>
              {new Date(msg.timestamp).toLocaleString()}
            </Text>
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
});

export default Conversation;
