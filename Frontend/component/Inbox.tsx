import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getInbox, getSentMessages, Message } from "../services/messageService";

type TabType = 'received' | 'sent';

interface Props {
  onSelectConversation: (otherUserId: string, otherUsername: string) => void;
}

const Inbox: React.FC<Props> = ({ onSelectConversation }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('received');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userData = await AsyncStorage.getItem('userData');
        if (userData) {
          const { _id } = JSON.parse(userData);
          setUserId(_id);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };
    fetchUserData();
  }, []);

  useEffect(() => {
    if (!userId) return;

    const fetchMessages = async () => {
      setLoading(true);
      try {
        const data = activeTab === 'received' 
          ? await getInbox(userId) 
          : await getSentMessages(userId);
        setMessages(data);
      } catch (err) {
        console.error('Error fetching messages:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, [userId, activeTab]);

  const getOtherUserInfo = (message: Message) => {
    if (!userId) return { id: '', username: '' };
    return activeTab === 'received'
      ? { id: message.senderId, username: message.senderUsername }
      : { id: message.receiverId, username: message.receiverUsername };
  };

  return (
    <View style={styles.container}>
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'received' && styles.activeTab]}
          onPress={() => setActiveTab('received')}
        >
          <Text style={[styles.tabText, activeTab === 'received' && styles.activeTabText]}>
            Received
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'sent' && styles.activeTab]}
          onPress={() => setActiveTab('sent')}
        >
          <Text style={[styles.tabText, activeTab === 'sent' && styles.activeTabText]}>
            Sent
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1E90FF" />
        </View>
      ) : messages.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            {activeTab === 'received' ? 'No received messages' : 'No sent messages'}
          </Text>
        </View>
      ) : (
        <ScrollView style={styles.messagesContainer}>
          {messages.map((msg) => {
            const otherUser = getOtherUserInfo(msg);
            return (
              <TouchableOpacity
                key={msg._id}
                style={[
                  styles.messageContainer,
                  activeTab === 'received' && msg.status === 'unseen' && styles.unseenMessage
                ]}
                onPress={() => onSelectConversation(otherUser.id, otherUser.username)}
              >
                <Text style={styles.senderText}>
                  {activeTab === 'sent' ? `To: ${msg.receiverUsername}` : `From: ${msg.senderUsername}`}
                </Text>
                <Text 
                  style={[
                    styles.messageText,
                    activeTab === 'received' && msg.status === 'unseen' && styles.unseenText
                  ]}
                  numberOfLines={1}
                >
                  {msg.text}
                </Text>
                <Text style={styles.timestamp}>
                  {new Date(msg.timestamp).toLocaleString()}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    marginBottom: 10,
  },
  tab: {
    flex: 1,
    paddingVertical: 15,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#1E90FF',
  },
  tabText: {
    fontSize: 16,
    color: '#666',
  },
  activeTabText: {
    color: '#1E90FF',
    fontWeight: '600',
  },
  messagesContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  messageContainer: {
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  unseenMessage: {
    backgroundColor: '#f8f9ff',
  },
  senderText: {
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  messageText: {
    color: '#666',
    marginBottom: 4,
  },
  unseenText: {
    fontWeight: '600',
    color: '#000',
  },
  timestamp: {
    fontSize: 12,
    color: '#999',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: '#999',
    fontSize: 16,
  },
});

export default Inbox;
