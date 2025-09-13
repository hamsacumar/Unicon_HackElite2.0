import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  Switch,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import NotificationService from "../services/NotificationService";
interface SubscriptionConfigModalProps {
  visible: boolean;
  onClose: () => void;
  postId?: string;
  postTitle?: string;
  organizerId: string;
  organizerName: string;
  category?: string;
}

const SubscriptionConfigModal: React.FC<SubscriptionConfigModalProps> = ({
  visible,
  onClose,
  postId,
  postTitle,
  organizerId,
  organizerName,
  category,
}) => {
  const [loading, setLoading] = useState(false);
  const [organizerSubscribed, setOrganizerSubscribed] = useState(false);
  const [postSubscribed, setPostSubscribed] = useState(false);
  const [categorySubscribed, setCategorySubscribed] = useState(false);

  useEffect(() => {
    if (visible) {
      checkSubscriptionStatus();
    }
  }, [visible]);

  const checkSubscriptionStatus = async () => {
    setLoading(true);
    try {
      // Check if user is subscribed to this organizer
      // This would require an API endpoint to check subscription status
      // For now, we'll assume false until we get the response
      setOrganizerSubscribed(false);
      setPostSubscribed(false);
      setCategorySubscribed(false);
    } catch (error) {
      console.error("Error checking subscription status:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleOrganizerSubscription = async (subscribe: boolean) => {
    try {
      setLoading(true);
      if (subscribe) {
        const success =
          await NotificationService.subscribeToOrganizer(organizerId);
        if (success) {
          setOrganizerSubscribed(true);
          Alert.alert(
            "Subscribed!",
            `You'll now receive notifications for all posts from ${organizerName}`
          );
        }
      } else {
        // Implement unsubscribe logic here
        setOrganizerSubscribed(false);
        Alert.alert(
          "Unsubscribed",
          `You won't receive notifications from ${organizerName} anymore`
        );
      }
    } catch (error) {
      Alert.alert("Error", "Failed to update subscription. Please try again.");
      console.error("Error updating organizer subscription:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePostSubscription = async (subscribe: boolean) => {
    if (!postId || !postTitle) return;

    try {
      setLoading(true);
      if (subscribe) {
        const success = await NotificationService.subscribeToPost(
          postId,
          postTitle,
          organizerId,
          category
        );
        if (success) {
          setPostSubscribed(true);
          Alert.alert(
            "Subscribed!",
            `You'll receive notifications when ${organizerName} posts about "${postTitle}"`
          );
        }
      } else {
        // Implement unsubscribe from specific post
        setPostSubscribed(false);
        Alert.alert(
          "Unsubscribed",
          `You won't receive notifications for "${postTitle}" posts anymore`
        );
      }
    } catch (error) {
      Alert.alert("Error", "Failed to update subscription. Please try again.");
      console.error("Error updating post subscription:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCategorySubscription = async (subscribe: boolean) => {
    if (!category) return;

    try {
      setLoading(true);
      if (subscribe) {
        // Subscribe to category-specific posts from this organizer
        const success = await NotificationService.subscribeToPost(
          "", // Empty postId means category subscription
          category,
          organizerId,
          category
        );
        if (success) {
          setCategorySubscribed(true);
          Alert.alert(
            "Subscribed!",
            `You'll receive notifications for ${category} posts from ${organizerName}`
          );
        }
      } else {
        setCategorySubscribed(false);
        Alert.alert(
          "Unsubscribed",
          `You won't receive ${category} notifications anymore`
        );
      }
    } catch (error) {
      Alert.alert("Error", "Failed to update subscription. Please try again.");
      console.error("Error updating category subscription:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Notification Settings</Text>
          <View style={{ width: 24 }} />
        </View>

        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#e53e3e" />
          </View>
        )}

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Organizer Info */}
          <View style={styles.organizerInfo}>
            <View style={styles.organizerAvatar}>
              <Ionicons name="business" size={32} color="#e53e3e" />
            </View>
            <View style={styles.organizerDetails}>
              <Text style={styles.organizerName}>{organizerName}</Text>
              <Text style={styles.organizerSubtext}>
                Configure notification preferences
              </Text>
            </View>
          </View>

          {/* Subscription Options */}
          <View style={styles.optionsContainer}>
            {/* All Posts from Organizer */}
            <View style={styles.optionItem}>
              <View style={styles.optionContent}>
                <View style={styles.optionIcon}>
                  <Ionicons name="notifications" size={24} color="#4CAF50" />
                </View>
                <View style={styles.optionText}>
                  <Text style={styles.optionTitle}>All Posts</Text>
                  <Text style={styles.optionDescription}>
                    Get notified for every post from {organizerName}
                  </Text>
                </View>
              </View>
              <Switch
                value={organizerSubscribed}
                onValueChange={handleOrganizerSubscription}
                trackColor={{ false: "#f0f0f0", true: "#4CAF50" }}
                thumbColor={organizerSubscribed ? "#fff" : "#f4f3f4"}
                disabled={loading}
              />
            </View>

            {/* Category-Specific Posts */}
            {category && (
              <View style={styles.optionItem}>
                <View style={styles.optionContent}>
                  <View style={styles.optionIcon}>
                    <Ionicons name="folder" size={24} color="#FF9800" />
                  </View>
                  <View style={styles.optionText}>
                    <Text style={styles.optionTitle}>{category} Posts</Text>
                    <Text style={styles.optionDescription}>
                      Get notified only for {category} posts from{" "}
                      {organizerName}
                    </Text>
                  </View>
                </View>
                <Switch
                  value={categorySubscribed}
                  onValueChange={handleCategorySubscription}
                  trackColor={{ false: "#f0f0f0", true: "#FF9800" }}
                  thumbColor={categorySubscribed ? "#fff" : "#f4f3f4"}
                  disabled={loading}
                />
              </View>
            )}

            {/* Specific Post Title */}
            {postId && postTitle && (
              <View style={styles.optionItem}>
                <View style={styles.optionContent}>
                  <View style={styles.optionIcon}>
                    <Ionicons name="document-text" size={24} color="#2196F3" />
                  </View>
                  <View style={styles.optionText}>
                    <Text style={styles.optionTitle}>"{postTitle}" Posts</Text>
                    <Text style={styles.optionDescription}>
                      Get notified when {organizerName} posts about "{postTitle}
                      "
                    </Text>
                  </View>
                </View>
                <Switch
                  value={postSubscribed}
                  onValueChange={handlePostSubscription}
                  trackColor={{ false: "#f0f0f0", true: "#2196F3" }}
                  thumbColor={postSubscribed ? "#fff" : "#f4f3f4"}
                  disabled={loading}
                />
              </View>
            )}
          </View>

          {/* Info Section */}
          <View style={styles.infoSection}>
            <View style={styles.infoItem}>
              <Ionicons name="information-circle" size={20} color="#666" />
              <Text style={styles.infoText}>
                You can enable multiple notification types. More specific
                subscriptions take priority.
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="time" size={20} color="#666" />
              <Text style={styles.infoText}>
                Changes are applied immediately and you can modify them anytime.
              </Text>
            </View>
          </View>
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <TouchableOpacity style={styles.doneButton} onPress={onClose}>
            <Text style={styles.doneButtonText}>Done</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  loadingContainer: {
    padding: 20,
    alignItems: "center",
  },
  content: {
    flex: 1,
  },
  organizerInfo: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#f8f9fa",
    marginBottom: 16,
  },
  organizerAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  organizerDetails: {
    flex: 1,
  },
  organizerName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  organizerSubtext: {
    fontSize: 14,
    color: "#666",
  },
  optionsContainer: {
    paddingHorizontal: 16,
  },
  optionItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  optionContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 12,
  },
  optionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f8f9fa",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  optionText: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 14,
    color: "#666",
    lineHeight: 18,
  },
  infoSection: {
    padding: 16,
    marginTop: 24,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: "#666",
    marginLeft: 8,
    flex: 1,
    lineHeight: 20,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  doneButton: {
    backgroundColor: "#e53e3e",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: "center",
  },
  doneButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default SubscriptionConfigModal;
