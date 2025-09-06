import React, { useState, useRef } from "react";
import { 
  View, 
  TextInput, 
  TouchableOpacity, 
  Text, 
  StyleSheet, 
  ActivityIndicator, 
  Alert,
  Keyboard,
  Platform
} from "react-native";
import { sendMessage } from "../services/messageService";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface SendMessageFormProps {
  onSent?: () => void;
  initialRecipient?: string;
  autoFocus?: boolean;
}

const SendMessageForm: React.FC<SendMessageFormProps> = ({ 
  onSent, 
  initialRecipient = '',
  autoFocus = false
}) => {
  const [receiverUsername, setReceiverUsername] = useState(initialRecipient);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const textInputRef = useRef<TextInput>(null);

  const handleSend = async () => {
    const receiver = receiverUsername.trim();
    const message = text.trim();
    
    if (!receiver) {
      Alert.alert("Error", "Please enter a recipient username.");
      textInputRef.current?.focus();
      return;
    }
    
    if (!message) {
      Alert.alert("Error", "Please enter a message.");
      return;
    }

    setLoading(true);
    Keyboard.dismiss();
    
    try {
      await sendMessage(receiver, message);
      setText("");
      
      // Only clear recipient if it's not the initial recipient
      if (!initialRecipient) {
        setReceiverUsername("");
      }
      
      // Show success feedback
      if (Platform.OS === 'ios') {
        // On iOS, we'll use an alert for now
        Alert.alert("Success", `Message sent to ${receiver}!`);
      }
      
      // Call the onSent callback if provided
      onSent?.();
      
    } catch (error: any) {
      console.error('Error sending message:', error);
      const errorMessage = error.response?.data?.message || 'Failed to send message. Please try again.';
      Alert.alert("Error", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {!initialRecipient && (
        <TextInput
          ref={textInputRef}
          placeholder="Recipient username"
          placeholderTextColor="#999"
          value={receiverUsername}
          onChangeText={setReceiverUsername}
          style={[styles.input, styles.recipientInput]}
          autoCapitalize="none"
          autoCorrect={false}
          editable={!loading}
          autoFocus={autoFocus}
        />
      )}
      <View style={styles.messageContainer}>
        <TextInput
          placeholder={initialRecipient ? `Message ${initialRecipient}...` : 'Type a message...'}
          placeholderTextColor="#999"
          value={text}
          onChangeText={setText}
          style={[styles.input, styles.messageInput]}
          multiline
          textAlignVertical="top"
          editable={!loading}
          autoFocus={!!initialRecipient && autoFocus}
          onSubmitEditing={handleSend}
          returnKeyType="send"
          blurOnSubmit={false}
        />
        <TouchableOpacity 
          onPress={handleSend} 
          style={[
            styles.sendButton, 
            (!text.trim() || !receiverUsername.trim()) && styles.sendButtonDisabled
          ]} 
          disabled={loading || !text.trim() || !receiverUsername.trim()}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.sendButtonText}>Send</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  messageContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#333',
  },
  recipientInput: {
    height: 48,
    marginBottom: 8,
  },
  messageInput: {
    flex: 1,
    maxHeight: 120,
    paddingTop: 12,
    paddingBottom: 12,
    marginRight: 8,
    textAlignVertical: 'top',
  },
  sendButton: {
    backgroundColor: '#1E90FF',
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sendButtonDisabled: {
    backgroundColor: '#b3d9ff',
  },
  sendButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});

export default SendMessageForm;
