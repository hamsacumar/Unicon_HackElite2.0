import React, { useState } from "react";
import { View, TextInput, TouchableOpacity, Text, StyleSheet, ActivityIndicator, Alert, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { sendMessage } from "../services/api/api";

const SendMessageForm: React.FC<{ onSent?: () => void }> = ({ onSent }) => {
  const [receiverUsername, setReceiverUsername] = useState("");
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    const receiver = receiverUsername.trim();
    const message = text.trim();

    if (!receiver || !message) {
      Alert.alert("Error", "Please fill all fields.");
      return;
    }

    setLoading(true);
    try {
      await sendMessage(receiver, message);
      setText("");
      setReceiverUsername("");
      Alert.alert("Success", `Message sent to @${receiver}!`);
      onSent?.();
    } catch (err: any) {
      console.error("Send message error:", err);
      Alert.alert("Error", err.message || "Failed to send message");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.inputContainer}>
        <View style={styles.usernameInputContainer}>
          <Ionicons name="at" size={20} color="#8E8E93" style={styles.icon} />
          <TextInput
            placeholder="Username"
            placeholderTextColor="#8E8E93"
            value={receiverUsername}
            onChangeText={setReceiverUsername}
            style={styles.usernameInput}
            editable={!loading}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>
        <View style={styles.messageInputContainer}>
          <TextInput
            placeholder="Type a message..."
            placeholderTextColor="#8E8E93"
            value={text}
            onChangeText={setText}
            style={styles.messageInput}
            multiline
            editable={!loading}
          />
          <TouchableOpacity
            onPress={handleSend}
            style={[styles.sendButton, (!text.trim() || !receiverUsername.trim() || loading) && styles.sendButtonDisabled]}
            disabled={!text.trim() || !receiverUsername.trim() || loading}
          >
            {loading ? <ActivityIndicator color="#fff" size="small" /> : <Ionicons name="send" size={20} color="#fff" />}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: "#fff", borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "#e0e0e0" },
  inputContainer: { gap: 12 },
  usernameInputContainer: { flexDirection: "row", alignItems: "center", backgroundColor: "#F2F2F7", borderRadius: 10, paddingHorizontal: 12, height: 44 },
  icon: { marginRight: 8 },
  usernameInput: { flex: 1, fontSize: 16, color: "#000", padding: 0, paddingVertical: 12 },
  messageInputContainer: { flexDirection: "row", alignItems: "flex-end", gap: 8 },
  messageInput: { flex: 1, backgroundColor: "#F2F2F7", borderRadius: 20, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 12, maxHeight: 120, fontSize: 16, textAlignVertical: "top", ...Platform.select({ ios: { paddingTop: 12 }, android: { textAlignVertical: "center" } }) },
  sendButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#007AFF", justifyContent: "center", alignItems: "center", marginBottom: 4 },
  sendButtonDisabled: { backgroundColor: "#C7C7CC" },
});

export default SendMessageForm;