import React, { useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Image,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

// Types
type RootStackParamList = {
  NotificationScreen: undefined;
};

type Notification = {
  id: string;
  type: "like" | "follow" | "message" | "comment" | "post" | "system";
  userName: string;
  userAvatar?: string | null | number; // number is for local require
  action: string;
  timeAgo: string;
  isRead: boolean;
  hasPostImage: boolean;
  avatarColor?: string;
  avatarText?: string;
  avatarTextSmall?: boolean;
};

type NotificationScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, "NotificationScreen">;
};

// Hardcoded notifications
const DEMO_NOTIFICATIONS: Notification[] = [
  {
    id: "1",
    type: "like",
    userName: "IEEE",
    userAvatar: require("../assets/ieee.jpeg"), // local image
    action: "posted an event",
    timeAgo: "3h ago",
    isRead: false,
    hasPostImage: true,
  },
  {
    id: "2",
    type: "follow",
    userName: "Rootcode",
    userAvatar: require("../assets/rootcode.png"), // local image
    action: "sent a deadline reminder",
    timeAgo: "5h ago",
    isRead: false,
    hasPostImage: false,
  },
  {
    id: "3",
    type: "message",
    userName: "Liam",
    userAvatar:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face",
    action: "accepted your request",
    timeAgo: "3h ago",
    isRead: false,
    hasPostImage: false,
  },
  {
    id: "4",
    type: "comment",
    userName: "IFS",
    userAvatar: null,
    action: "Event is due today",
    timeAgo: "1d ago",
    isRead: true,
    hasPostImage: true,
    avatarColor: "#6B46C1",
    avatarText: "IFS",
  },
];

const NotificationScreen: React.FC<NotificationScreenProps> = ({ navigation }) => {
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [notifications, setNotifications] = useState<Notification[]>(DEMO_NOTIFICATIONS);

  const handleNotificationPress = (notification: Notification) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notification.id ? { ...n, isRead: true } : n))
    );

    Alert.alert("Notification Tapped", `${notification.userName} ${notification.action}`, [
      { text: "OK" },
    ]);
  };

  const getNotificationIcon = (
    type: Notification["type"]
  ): { name: keyof typeof Ionicons.glyphMap; color: string } => {
    switch (type) {
      case "like":
        return { name: "heart", color: "#E64A0D" };
      case "comment":
        return { name: "chatbubble-outline", color: "#F9662D" };
      case "follow":
        return { name: "person-add-outline", color: "#E64A0D" };
      case "post":
        return { name: "image-outline", color: "#F9662D" };
      case "message":
        return { name: "mail-outline", color: "#9C27B0" };
      case "system":
        return { name: "settings-outline", color: "#EF4444" };
      default:
        return { name: "notifications-outline", color: "#666" };
    }
  };

  const renderNotificationItem = ({
    item,
    index,
  }: {
    item: Notification;
    index: number;
  }) => {
    const icon = getNotificationIcon(item.type);
    const isNewSection = index === 0 || (index === 3 && item.isRead);

    return (
      <View>
        {isNewSection && (
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionHeaderText}>
              {!item.isRead ? "New" : "Earlier"}
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.notificationItem, !item.isRead && styles.unreadNotification]}
          onPress={() => handleNotificationPress(item)}
          activeOpacity={0.8}
        >
          <View style={styles.avatarContainer}>
            {item.userAvatar ? (
              <Image
                source={
                  typeof item.userAvatar === "string"
                    ? { uri: item.userAvatar }
                    : item.userAvatar
                }
                style={styles.avatar}
              />
            ) : (
              <View
                style={[
                  styles.defaultAvatar,
                  { backgroundColor: item.avatarColor || "#ccc" },
                ]}
              >
                <Text
                  style={[
                    styles.defaultAvatarText,
                    item.avatarTextSmall && styles.smallAvatarText,
                  ]}
                >
                  {item.avatarText || item.userName.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.notificationContent}>
            <View style={styles.textContainer}>
              <Text style={styles.notificationText} numberOfLines={2}>
                <Text style={styles.userName}>{item.userName}</Text>
                <Text style={styles.actionText}> {item.action}</Text>
              </Text>
              <Text style={styles.timeText}>{item.timeAgo}</Text>
            </View>
          </View>

          {item.hasPostImage && (
            <View style={styles.postThumbnail}>
              <View style={styles.placeholderImage}>
                <Ionicons name="image-outline" size={20} color="#ccc" />
              </View>
            </View>
          )}

          {item.type === "like" && (
            <TouchableOpacity style={styles.likeButton}>
              <Ionicons name="heart-outline" size={20} color="#E64A0D" />
            </TouchableOpacity>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  const filteredNotifications =
    filter === "all" ? notifications : notifications.filter((n) => !n.isRead);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#E64A0D" />

      <LinearGradient colors={["#E64A0D", "#F9662D"]} style={styles.header}>
        <SafeAreaView>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Notifications</Text>
            <TouchableOpacity style={styles.settingsButton}>
              <Ionicons name="settings-outline" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          <View style={styles.filterContainer}>
            <TouchableOpacity
              style={[styles.filterButton, filter === "all" && styles.activeFilter]}
              onPress={() => setFilter("all")}
            >
              <Text
                style={[
                  styles.filterText,
                  filter === "all" && styles.activeFilterText,
                ]}
              >
                All
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.filterButton, filter === "unread" && styles.activeFilter]}
              onPress={() => setFilter("unread")}
            >
              <View style={styles.unreadCountContainer}>
                <Text
                  style={[
                    styles.filterText,
                    filter === "unread" && styles.activeFilterText,
                  ]}
                >
                  Unread
                </Text>
                {unreadCount > 0 && (
                  <View style={styles.unreadBadge}>
                    <Text style={styles.unreadBadgeText}>{unreadCount}</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <FlatList
        data={filteredNotifications}
        renderItem={renderNotificationItem}
        keyExtractor={(item) => item.id}
        style={styles.list}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fafafa" },
  header: { paddingBottom: 20 },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 20,
  },
  headerTitle: { fontSize: 28, fontWeight: "bold", color: "#fff" },
  settingsButton: { padding: 8 },
  filterContainer: {
    flexDirection: "row",
    marginHorizontal: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 25,
    padding: 4,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 20,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
  },
  activeFilter: { backgroundColor: "#fff", elevation: 3 },
  filterText: { color: "rgba(255, 255, 255, 0.8)", fontWeight: "600", fontSize: 16 },
  activeFilterText: { color: "#E64A0D" },
  unreadCountContainer: { flexDirection: "row", alignItems: "center" },
  unreadBadge: {
    backgroundColor: "#fff",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  unreadBadgeText: { color: "#E64A0D", fontSize: 12, fontWeight: "bold" },
  list: { flex: 1 },
  sectionHeader: {
    backgroundColor: "#f8f8f8",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e8e8e8",
  },
  sectionHeaderText: { fontSize: 16, fontWeight: "600", color: "#262626" },
  notificationItem: {
    flexDirection: "row",
    padding: 16,
    backgroundColor: "#fff",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  unreadNotification: { backgroundColor: "#fff8f6" },
  avatarContainer: { marginRight: 12 },
  avatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: "#f0f0f0" },
  defaultAvatar: { width: 50, height: 50, borderRadius: 25, justifyContent: "center", alignItems: "center" },
  defaultAvatarText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  smallAvatarText: { fontSize: 10, fontWeight: "800" },
  notificationContent: { flex: 1, justifyContent: "center" },
  textContainer: { flex: 1 },
  notificationText: { fontSize: 15, lineHeight: 20, marginBottom: 4 },
  userName: { fontWeight: "600", color: "#262626" },
  actionText: { fontWeight: "400", color: "#262626" },
  timeText: { fontSize: 13, color: "#8e8e8e", fontWeight: "400" },
  postThumbnail: { marginLeft: 12 },
  placeholderImage: {
    width: 44,
    height: 44,
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e8e8e8",
  },
  likeButton: { marginLeft: 12, padding: 4 },
});

export default NotificationScreen;
