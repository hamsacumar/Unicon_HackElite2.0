import React, { useState, useCallback } from "react";
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, StatusBar } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import SendMessageForm from "../component/SendMessageForm";
import Inbox from "../component/Inbox";
import Conversation from "../component/Conversation";

const MessagesPage: React.FC = () => {
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedUsername, setSelectedUsername] = useState<string>("");

  const handleBackToInbox = useCallback(() => {
    setSelectedUserId(null);
    setSelectedUsername("");
  }, []);

  const handleMessageSent = useCallback(() => {
    // Refresh inbox when a new message is sent
    // This will be passed down to SendMessageForm
  }, []);

  const handleSelectConversation = useCallback((userId: string, username: string) => {
    setSelectedUserId(userId);
    setSelectedUsername(username);
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <View style={styles.container}>
        {selectedUserId ? (
          <View style={styles.conversationContainer}>
            <View style={styles.header}>
              <TouchableOpacity onPress={handleBackToInbox} style={styles.backButton}>
                <Ionicons name="arrow-back" size={24} color="#007AFF" />
              </TouchableOpacity>
              <Text style={styles.headerTitle} numberOfLines={1}>
                {selectedUsername}
              </Text>
              <View style={styles.headerRight} />
            </View>
            <Conversation 
              otherUserId={selectedUserId} 
              otherUsername={selectedUsername} 
            />
          </View>
        ) : (
          <View style={styles.inboxContainer}>
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Messages</Text>
            </View>
            <SendMessageForm onSent={handleMessageSent} />
            <Inbox onSelectConversation={handleSelectConversation} />
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  conversationContainer: {
    flex: 1,
  },
  inboxContainer: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginHorizontal: 16,
  },
  headerRight: {
    width: 40, // Same as back button for balance
  },
});

export default MessagesPage;