import React, { useEffect, useState } from "react";
import { View, FlatList, Text, TouchableOpacity } from "react-native";
import { getInbox, Message } from "../services/api/api";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../App";

// ✅ Use typed navigation props
type Props = NativeStackScreenProps<RootStackParamList, "InboxScreen">;

const InboxScreen: React.FC<Props> = ({ navigation, route }) => {
  const { currentUserId } = route.params; // ✅ Now typed correctly

  const [inbox, setInbox] = useState<Message[]>([]);

  useEffect(() => {
    fetchInbox();
    const interval = setInterval(fetchInbox, 3000); // Poll every 3s
    return () => clearInterval(interval);
  }, [currentUserId]);

  const fetchInbox = async () => {
    try {
      const inboxData: Message[] = await getInbox(currentUserId);
      setInbox(inboxData);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <View style={{ flex: 1, padding: 10 }}>
      <FlatList
        data={inbox}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() =>
              navigation.navigate("Chat", {
                currentUserId,
                otherUserId: item.senderId,
                currentUsername: "You",
                otherUsername: item.senderUsername,
              })
            }
          >
            <Text style={{ fontWeight: item.status === "unseen" ? "bold" : "normal" }}>
              {item.senderUsername}: {item.text}
            </Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
};

export default InboxScreen;
