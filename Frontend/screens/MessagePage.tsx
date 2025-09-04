// screens/MessagesPage.tsx
import React from "react";
import { View, Text, ScrollView } from "react-native";
import SendMessageForm from "../component/SendMessageForm";
import Inbox from "../component/Inbox";

const MessagesPage: React.FC = () => {
  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      <Text style={{ fontSize: 24, fontWeight: "bold", marginBottom: 16 }}>
        Messaging System
      </Text>
      <SendMessageForm />
      <Inbox />
    </ScrollView>
  );
};

export default MessagesPage;
