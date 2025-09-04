// components/SendMessageForm.tsx
import React, { useState } from "react";
import { View, TextInput, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import api from "../services/api/api";

interface Props {
  onSent?: () => void;
}

const SendMessageForm: React.FC<Props> = ({ onSent }) => {
  const [receiverUsername, setReceiverUsername] = useState("");
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!receiverUsername || !text) return;
    setLoading(true);
    try {
      const res = await api.post("/messages/sendByUsername", {
        receiverUsername,
        text,
      });
      console.log(res.data);
      setReceiverUsername("");
      setText("");
      onSent?.();
    } catch (err: any) {
      console.error(err.response?.data || err.message);
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
      />
      <TextInput
        placeholder="Type your message"
        value={text}
        onChangeText={setText}
        style={[styles.input, styles.textarea]}
        multiline
      />
      <TouchableOpacity
        onPress={handleSubmit}
        style={[styles.button, loading && styles.buttonDisabled]}
        disabled={loading}
      >
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Send Message</Text>}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
    maxWidth: 400,
    marginVertical: 12,
    gap: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    borderRadius: 6,
    backgroundColor: "#fff",
  },
  textarea: {
    height: 80,
    textAlignVertical: "top",
  },
  button: {
    backgroundColor: "#1E90FF",
    padding: 12,
    borderRadius: 6,
    alignItems: "center",
  },
  buttonDisabled: {
    backgroundColor: "#7FB3FF",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
  },
});

export default SendMessageForm;
