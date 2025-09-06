import React, { useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import SendMessageForm from "../component/SendMessageForm";
import Inbox from "../component/Inbox";
import Conversation from "../component/Conversation";

const MessagesPage: React.FC = () => {
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedUsername, setSelectedUsername] = useState<string>("");

  return (
    <View style={{ flex: 1 }}>
      {selectedUserId ? (
        <Conversation otherUserId={selectedUserId} otherUsername={selectedUsername} />
      ) : (
        <>
          <Text style={styles.title}>Messaging System</Text>
          <SendMessageForm />
          <Inbox
            onSelectConversation={(userId, username) => {
              setSelectedUserId(userId);
              setSelectedUsername(username);
            }}
          />
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  title: { fontSize: 24, fontWeight: "bold", margin: 16 },
});

export default MessagesPage;
