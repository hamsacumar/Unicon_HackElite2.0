import React, { useEffect, useState } from "react";
import { TouchableOpacity, StyleSheet, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import SubscriptionConfigModal from "./SubscriptionConfigModal";
import NotificationService from "../services/NotificationService";
import AsyncStorage from "@react-native-async-storage/async-storage";

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
  const [isConfiguring, setIsConfiguring] = useState(false);
  const [isConfigured, setIsConfigured] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Create a stable storage key for this user + organizer + normalized title
  const keyFor = (uid: string | null) => {
    const normTitle = (postTitle || "").trim();
    return `notifcfg:${uid || "anon"}:${organizerId}:${normTitle}`;
  };

  // Load current userId and persisted configuration state on mount
  useEffect(() => {
    (async () => {
      try {
        const uid = await AsyncStorage.getItem("userId");
        setCurrentUserId(uid);
        if (postTitle) {
          const stored = await AsyncStorage.getItem(keyFor(uid));
          if (stored === "1") {
            setIsConfigured(true);
          }
        }
      } catch {
        // ignore
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePress = () => {
    // If we have a postTitle, perform a one-tap toggle for this organizer+title
    if (postTitle && organizerId) {
      if (isConfigured) {
        unsubscribeTitleForOrganizer();
      } else {
        configureTitleForOrganizer();
      }
      return;
    }
    // Fallback: open modal when we don't have a concrete title to configure
    setModalVisible(true);
  };

  const unsubscribeTitleForOrganizer = async () => {
    try {
      if (!postTitle) {
        Alert.alert(
          "Missing Title",
          "Cannot disable configuration without a post title."
        );
        return;
      }
      setIsConfiguring(true);
      const success = await NotificationService.unsubscribeTitle(
        organizerId,
        postTitle
      );
      if (success) {
        setIsConfigured(false);
        // remove persisted state
        try {
          await AsyncStorage.removeItem(keyFor(currentUserId));
        } catch {}
        Alert.alert(
          "Notifications disabled",
          `You will no longer receive future posts from ${organizerName} related to "${postTitle}"`
        );
      } else {
        Alert.alert(
          "Action failed",
          "No existing configuration found to disable."
        );
      }
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "Unknown error");
    } finally {
      setIsConfiguring(false);
    }
  };

  const handleModalClose = () => {
    setModalVisible(false);
  };

  const configureTitleForOrganizer = async () => {
    try {
      if (!postTitle) {
        Alert.alert(
          "Missing Title",
          "Cannot enable configuration without a post title."
        );
        return;
      }
      setIsConfiguring(true);
      const success = await NotificationService.configureTitle(
        organizerId,
        postTitle,
        category
      );
      if (success) {
        setIsConfigured(true);
        // persist locally so logout/login retains icon state
        try {
          await AsyncStorage.setItem(keyFor(currentUserId), "1");
        } catch {}
        Alert.alert(
          "Notifications enabled",
          `You'll receive future posts from ${organizerName} related to "${postTitle}"`
        );
      } else {
        Alert.alert(
          "Action failed",
          "Could not enable notifications. Please try again."
        );
      }
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "Unknown error");
    } finally {
      setIsConfiguring(false);
    }
  };

  return (
    <>
      <TouchableOpacity
        style={styles.button}
        onPress={handlePress}
        activeOpacity={0.7}
        disabled={isConfiguring}
      >
        <Ionicons
          name={isConfigured ? "notifications" : "notifications-outline"}
          size={size}
          color={isConfigured ? "#FF5722" : color}
        />
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
    // backgroundColor: "rgba(0,0,0,0.05)",
  },
});

export default NotificationConfigButton;
