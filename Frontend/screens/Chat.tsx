import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, Button, FlatList, StyleSheet } from 'react-native';
import ChatService from '../services/chat';
import { getMessages } from '../services/ApiChat';
import { Message } from '../types/chat';


interface Props {
  route: {
    params: {
      userId: string;
      username: string;
      otherUserId: string;
    };
  };
}

const ChatScreen: React.FC<Props> = ({ route }) => {
  const { userId, username, otherUserId } = route.params;
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');

  useEffect(() => {
    // Load old messages
    getMessages(userId, otherUserId).then(setMessages);

    // Listen for real-time messages
    const receiveHandler = (msg: Message) => {
      if ((msg.SenderId === otherUserId && msg.RecipientId === userId) ||
          (msg.SenderId === userId && msg.RecipientId === otherUserId)) {
        setMessages(prev => [...prev, msg]);
      }
    };

    ChatService.onReceiveMessage(receiveHandler);

    // Cleanup on unmount
    return () => ChatService.offReceiveMessage( receiveHandler);
  }, []);

  const sendMessage = () => {
    ChatService.sendMessage(userId, username, otherUserId, text);
    setText('');
  };

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <FlatList
        data={messages}
        keyExtractor={item => item.Id || Math.random().toString()}
        renderItem={({ item }) => (
          <Text style={{
            padding: 8,
            marginVertical: 2,
            borderRadius: 5,
            backgroundColor: item.SenderId === userId ? '#DCF8C5' : '#FFF'
          }}>
            {item.SenderUsername}: {item.Text}
          </Text>
        )}
      />

      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10 }}>
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="Type a message..."
          style={{ flex: 1, borderWidth: 1, borderColor: '#ccc', padding: 8, borderRadius: 5 }}
        />
        <Button title="Send" onPress={sendMessage} />
      </View>
    </View>
  );
};

export default ChatScreen;
