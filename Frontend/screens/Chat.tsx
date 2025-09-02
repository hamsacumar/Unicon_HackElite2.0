// ChatScreen.tsx
import React, { useEffect, useState } from "react";
import { View, TextInput, Button, FlatList, Text } from "react-native";
import { sendMessage, getConversation } from "../services/api/api";

interface Message {
  id: string;
  senderId: string;
  senderUsername: string;
  receiverId: string;
  text: string;
  status: string;
}

 interface ChatScreenProps{
  route:{
  params: {
    currentUserId: string;
    otherUserId: string;
    currentUsername: string;
    otherUsername: string;
  };
};
 
}

  const ChatScreen: React.FC<ChatScreenProps> = ({ route}) => {
  const { currentUserId, otherUserId, currentUsername, otherUsername } = route.params;
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 3000); // Poll every 3s
    return () => clearInterval(interval);
  }, []);

  const fetchMessages = async () => {
    const res = await getConversation(currentUserId, otherUserId);
    setMessages((res as { success: boolean; data: Message[] }).data);
  };

  const handleSend = async () => {
    if (!text) return;
    await sendMessage({
      senderId: currentUserId,
      senderUsername: currentUsername,
      receiverId: otherUserId,
      text,
    });
    setText("");
    fetchMessages();
  };

  return (
    <View style={{ flex: 1, padding: 10 }}>
      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Text style={{ textAlign: item.senderId === currentUserId ? "right" : "left" }}>
            {item.senderUsername}: {item.text}
          </Text>
        )}
      />
      <TextInput
        value={text}
        onChangeText={setText}
        placeholder="Type message"
        style={{ borderWidth: 1, padding: 5 }}
      />
      <Button title="Send" onPress={handleSend} />
    </View>
  );
};

export default ChatScreen;
