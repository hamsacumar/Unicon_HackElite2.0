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
import { getInbox, deleteMessages, Message } from "../services/api/api";

interface Props {
  onSelectConversation: (otherUserId: string, otherUsername: string) => void;
}

const Inbox: React.FC<Props> = ({ onSelectConversation }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [deleteMode, setDeleteMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Fetch inbox messages
  const fetchInboxMessages = async () => {
    try {
      setLoading(true);
      setError(null);
      const inboxData = await getInbox();
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
    fetchInboxMessages();
    const interval = setInterval(fetchInboxMessages, 10000);
    return () => clearInterval(interval);
  }, []);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const selectAll = () => setSelectedIds(messages.map((m) => m.id));
  const clearSelection = () => setSelectedIds([]);

  const handleDelete = async () => {
    try {
      await deleteMessages(selectedIds);
      setMessages((prev) => prev.filter((m) => !selectedIds.includes(m.id)));
      setSelectedIds([]);
      setDeleteMode(false);
    } catch (err) {
      console.error("Delete failed", err);
    }
  };

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
    <View style={{ flex: 1 }}>
      {/* Toolbar */}
      {deleteMode ? (
        <View style={styles.toolbar}>
          <Button title="All" onPress={selectAll} />
          <Button title="None" onPress={clearSelection} />
          <Button title="Delete" onPress={handleDelete} color="red" />
          <Button title="Cancel" onPress={() => setDeleteMode(false)} />
        </View>
      ) : (
        <View style={styles.toolbar}>
          <Button title="Delete" onPress={() => setDeleteMode(true)} color= "#FF5722"/>
        </View>
      )}

      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Inbox</Text>
        {messages.length === 0 ? (
          <Text style={styles.noMessages}>No messages yet</Text>
        ) : (
          messages.map((msg) => {
            const selected = selectedIds.includes(msg.id);
            return (
              <TouchableOpacity
                key={msg.id}
                style={[
                  styles.messageContainer,
                  msg.status === "unseen" && styles.unseenMessage,
                  selected && { backgroundColor: "#e0f7fa" },
                ]}
                onPress={() =>
                  deleteMode
                    ? toggleSelect(msg.id)
                    : onSelectConversation(msg.senderId, msg.senderUsername)
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
            );
          })
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 16 },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 20, color: "#333" },
  toolbar: {
    flexDirection: "row",
    justifyContent: "space-around",
    padding: 10,
    backgroundColor: "#f2f2f2",
  },
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
  senderName: {
    fontWeight: "600",
    fontSize: 16,
    marginBottom: 4,
    color: "#000",
  },
  messageText: { color: "#666", marginBottom: 4 },
  timestamp: { fontSize: 12, color: "#999", alignSelf: "flex-end" },
  noMessages: {
    textAlign: "center",
    marginTop: 20,
    color: "#666",
    fontSize: 16,
  },
  errorText: { color: "red", marginBottom: 10, textAlign: "center" },
});

export default Inbox;