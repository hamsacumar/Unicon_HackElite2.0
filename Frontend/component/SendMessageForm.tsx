import React, { useState } from "react";
import { View, TextInput, TouchableOpacity, Text, StyleSheet, ActivityIndicator, Alert } from "react-native";
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
      Alert.alert("Success", "Message sent!");
      onSent?.(); // callback to refresh inbox if needed
    } catch (err: any) {
      console.error(err.response?.data || err.message);
      Alert.alert("Error", "Failed to send message. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        placeholder="Receiver Username"
        value={receiverUsername}
        onChangeText={setReceiverUsername}
        style={styles.input}
        editable={!loading}
      />
      <TextInput
        placeholder="Type a message"
        value={text}
        onChangeText={setText}
        style={[styles.input, styles.textarea]}
        multiline
        editable={!loading}
      />
      <TouchableOpacity onPress={handleSend} style={styles.button} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Send</Text>}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { gap: 10, marginBottom: 16 },
  input: { borderWidth: 1, borderColor: "#ccc", padding: 10, borderRadius: 6 },
  textarea: { height: 80, textAlignVertical: "top" },
  button: { backgroundColor: "#1E90FF", padding: 12, borderRadius: 6, alignItems: "center" },
  buttonText: { color: "#fff", fontWeight: "bold" },
});

export default SendMessageForm;
