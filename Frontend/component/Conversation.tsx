import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet, Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getConversation, sendMessage, Message } from "../services/api/api";

interface Props {
  otherUserId: string;
  otherUsername: string;
}

const Conversation: React.FC<Props> = ({ otherUserId, otherUsername }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [reply, setReply] = useState("");
  const [senderId, setSenderId] = useState<string | null>(null);

  useEffect(() => {
    AsyncStorage.getItem("userId").then((id) => setSenderId(id));
  }, []);

  const fetchMessages = async () => {
    if (!senderId) return;
    try {
      const res = await getConversation(senderId, otherUserId);
      setMessages(res);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [senderId, otherUserId]);

  const handleReply = async () => {
    if (!reply || !senderId) return;
    try {
      await sendMessage(otherUsername, reply);
      setReply("");
      fetchMessages();
    } catch (err) {
      Alert.alert("Error", "Failed to send reply.");
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.container}>
        {messages.map((msg) => (
          <View key={msg.id} style={styles.messageContainer}>
            <Text>
              <Text style={styles.sender}>{msg.senderUsername}</Text>: {msg.text}
            </Text>
            <Text style={styles.timestamp}>{new Date(msg.timestamp).toLocaleString()}</Text>
          </View>
        ))}
      </ScrollView>
      <View style={styles.replyBox}>
        <TextInput
          placeholder="Type a reply"
          value={reply}
          onChangeText={setReply}
          style={styles.replyInput}
        />
        <TouchableOpacity onPress={handleReply} style={styles.replyButton}>
          <Text style={{ color: "#fff" }}>Send</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { padding: 16 },
  messageContainer: { marginBottom: 10, borderBottomWidth: 1, borderBottomColor: "#ccc", paddingBottom: 5 },
  sender: { fontWeight: "bold" },
  timestamp: { fontSize: 12, color: "#666" },
  replyBox: { flexDirection: "row", padding: 10, borderTopWidth: 1, borderColor: "#ccc" },
  replyInput: { flex: 1, borderWidth: 1, borderColor: "#ccc", borderRadius: 6, padding: 8, marginRight: 8 },
  replyButton: { backgroundColor: "#1E90FF", paddingHorizontal: 16, justifyContent: "center", borderRadius: 6 },
});

export default Conversation;
