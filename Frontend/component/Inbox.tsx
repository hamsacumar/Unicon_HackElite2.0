import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Button,
} from "react-native";
import { getInbox, Message } from "../services/api/api";

interface Props {
  onSelectConversation: (otherUserId: string, otherUsername: string) => void;
}

const Inbox: React.FC<Props> = ({ onSelectConversation }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch inbox messages
  const fetchInboxMessages = async () => {
    try {
      setLoading(true);
      setError(null);
      const inboxData = await getInbox(); // No userId needed
      setMessages(inboxData);
    } catch (err: any) {
      console.error("Error fetching inbox:", err);
      setError(err.message || "Failed to load messages. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Auto-refresh inbox every 10 seconds
  useEffect(() => {
    fetchInboxMessages(); // fetch immediately
    const interval = setInterval(fetchInboxMessages, 10000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <Button title="Retry" onPress={fetchInboxMessages} />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Inbox</Text>
      {messages.length === 0 ? (
        <Text style={styles.noMessages}>No messages yet</Text>
      ) : (
        messages.map((msg) => (
          <TouchableOpacity
            key={msg.id}
            style={[
              styles.messageContainer,
              msg.status === "unseen" && styles.unseenMessage,
            ]}
            onPress={() =>
              onSelectConversation(msg.senderId, msg.senderUsername)
            }
          >
            <Text style={styles.senderName}>{msg.senderUsername}</Text>
            <Text
              style={styles.messageText}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {msg.text}
            </Text>
            <Text style={styles.timestamp}>
              {new Date(msg.timestamp).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </Text>
          </TouchableOpacity>
        ))
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 16 },
  centerContainer: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20 },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 20, color: "#333" },
  messageContainer: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  unseenMessage: {
    borderLeftWidth: 4,
    borderLeftColor: "#007AFF",
    paddingLeft: 11,
  },
  senderName: { fontWeight: "600", fontSize: 16, marginBottom: 4, color: "#000" },
  messageText: { color: "#666", marginBottom: 4 },
  timestamp: { fontSize: 12, color: "#999", alignSelf: "flex-end" },
  noMessages: { textAlign: "center", marginTop: 20, color: "#666", fontSize: 16 },
  errorText: { color: "red", marginBottom: 10, textAlign: "center" },
});

export default Inbox;
