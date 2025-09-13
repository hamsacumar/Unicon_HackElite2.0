import React, { useState } from "react";
import { TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import SubscriptionConfigModal from "./SubscriptionConfigModal";

interface NotificationConfigButtonProps {
  postId?: string;
  postTitle?: string;
  organizerId: string;
  organizerName: string;
  category?: string;
  size?: number;
  color?: string;
}

const NotificationConfigButton: React.FC<NotificationConfigButtonProps> = ({
  postId,
  postTitle,
  organizerId,
  organizerName,
  category,
  size = 24,
  color = "#666",
}) => {
  const [modalVisible, setModalVisible] = useState(false);

  const handlePress = () => {
    setModalVisible(true);
  };

  const handleModalClose = () => {
    setModalVisible(false);
  };

  return (
    <>
      <TouchableOpacity
        style={styles.button}
        onPress={handlePress}
        activeOpacity={0.7}
      >
        <Ionicons name="notifications-outline" size={size} color={color} />
      </TouchableOpacity>

      <SubscriptionConfigModal
        visible={modalVisible}
        onClose={handleModalClose}
        postId={postId}
        postTitle={postTitle}
        organizerId={organizerId}
        organizerName={organizerName}
        category={category}
      />
    </>
  );
};

const styles = StyleSheet.create({
  button: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.05)",
  },
});

export default NotificationConfigButton;
