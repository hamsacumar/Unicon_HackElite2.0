import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { getConversation, sendMessage, getCurrentUserId } from "../services/api/api";

interface Message {
  id: string;
  senderId: string;
  senderUsername: string;
  receiverId: string;
  receiverUsername: string;
  text: string;
  timestamp: string;
}

interface Props {
  otherUserId: string;
  otherUsername: string;
}

const Conversation: React.FC<Props> = ({ otherUserId, otherUsername }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const flatListRef = useRef<FlatList>(null);

// Fetch current user's ID on mount
useEffect(() => {
  const fetchCurrentUserId = async () => {
    try {
      const userId = await getCurrentUserId();
      setCurrentUserId(userId);
    } catch (err: any) {
      console.error("Error fetching user:", err);
      Alert.alert("Error", err.message || "Failed to get user info.");
    }
  };

  fetchCurrentUserId();
}, []);

  // Fetch conversation messages
  const fetchConversationMessages = async () => {
    if (!currentUserId) return;
    try {
      setLoading(true);
      const conversationData = await getConversation(otherUserId);
      setMessages(conversationData);
    } catch (err: any) {
      console.error("Error fetching conversation:", err);
      Alert.alert("Error", err.message || "Failed to load conversation.");
    } finally {
      setLoading(false);
    }
  };

  // Polling for new messages every 10s
  useEffect(() => {
    if (!currentUserId) return;
    fetchConversationMessages();
    const interval = setInterval(fetchConversationMessages, 10000);
    return () => clearInterval(interval);
  }, [otherUserId, currentUserId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    flatListRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  // Send a new message
  const handleSend = async () => {
    const trimmedText = text.trim();
    if (!trimmedText) return;

    try {
      await sendMessage(otherUsername, trimmedText);
      setText("");
      fetchConversationMessages();
    } catch (err: any) {
      console.error("Send message error:", err);
      Alert.alert("Error", err.message || "Failed to send message.");
    }
  };

  const renderItem = ({ item }: { item: Message }) => {
    const isMine = item.senderId === currentUserId;
    return (
      <View
        style={[styles.messageContainer, isMine ? styles.myMessage : styles.theirMessage]}
      >
        <Text style={[styles.messageText, isMine ? { color: "#fff" } : { color: "#000" }]}>
          {item.text}
        </Text>
        <Text style={styles.timestamp}>
          {new Date(item.timestamp).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </Text>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}
    >
      {messages.length === 0 ? (
        <View style={styles.center}>
          <Text>No messages yet</Text>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.flatListContainer}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
        />
      )}

      <View style={styles.inputContainer}>
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="Type a message..."
          style={styles.textInput}
          multiline
        />
        <TouchableOpacity onPress={handleSend} style={styles.sendButton}>
          <Text style={{ color: "#fff", fontWeight: "bold" }}>Send</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

// Use the existing api instance for fetching the current user
const fetchCurrentUser = async () => {
  const res = await import("../services/api").then((mod) => mod.api.get("/account/me"));
  return { id: res.data.Id };
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  flatListContainer: { padding: 16, paddingBottom: 80 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  messageContainer: { maxWidth: "80%", marginBottom: 12, padding: 10, borderRadius: 12 },
  myMessage: { backgroundColor: "green", alignSelf: "flex-end" },
  theirMessage: { backgroundColor: "#E5E5EA", alignSelf: "flex-start" },
  messageText: { fontSize: 16 },
  timestamp: { fontSize: 10, color: "#888", marginTop: 2, alignSelf: "flex-end" },
  inputContainer: {
    flexDirection: "row",
    padding: 10,
    borderTopWidth: 1,
    borderColor: "#ccc",
    backgroundColor: "#fff",
    alignItems: "flex-end",
  },
  textInput: {
    flex: 1,
    backgroundColor: "#f2f2f7",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
    maxHeight: 120,
  },
  sendButton: {
    marginLeft: 8,
    backgroundColor: "#FF5722",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default Conversation;