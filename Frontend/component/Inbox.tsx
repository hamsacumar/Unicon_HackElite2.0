import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getInbox, Message } from "../services/api/api";

interface Props {
  onSelectConversation: (otherUserId: string, otherUsername: string) => void;
}

const Inbox: React.FC<Props> = ({ onSelectConversation }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserId = async () => {
      const id = await AsyncStorage.getItem("userId");
      if (id) setUserId(id);
    };
    fetchUserId();
  }, []);

  useEffect(() => {
    if (!userId) return;

    const fetchInbox = async () => {
      try {
        const inboxData = await getInbox(userId);
        setMessages(inboxData);
      } catch (err) {
        console.error(err);
      }
    };

    fetchInbox();
    const interval = setInterval(fetchInbox, 3000);
    return () => clearInterval(interval);
  }, [userId]);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Inbox</Text>
      {messages.length === 0 ? (
        <Text>No messages</Text>
      ) : (
        messages.map((msg) => (
          <TouchableOpacity
            key={msg.id}
            style={styles.messageContainer}
            onPress={() => onSelectConversation(msg.senderId, msg.senderUsername)}
          >
            <Text style={{ fontWeight: msg.status === "unseen" ? "bold" : "normal" }}>
              {msg.senderUsername}: {msg.text}
            </Text>
            <Text style={styles.timestamp}>{new Date(msg.timestamp).toLocaleString()}</Text>
          </TouchableOpacity>
        ))
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { padding: 16 },
  title: { fontSize: 20, fontWeight: "bold", marginBottom: 12 },
  messageContainer: { borderBottomWidth: 1, borderBottomColor: "#ccc", paddingVertical: 8 },
  timestamp: { fontSize: 12, color: "#666" },
});

export default Inbox;
