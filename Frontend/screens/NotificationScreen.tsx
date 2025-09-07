import React, { useState, useEffect, useCallback, useRef } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  Platform,
  Alert,
  Image,
  ImageSourcePropType,
  NativeSyntheticEvent,
  ImageLoadEventData,
  ImageErrorEventData,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Constants from "expo-constants";
import { useAuth } from "../utils/AuthContext";
import RoleBasedBottomNav from "../component/rolebasedNav";
import { LinearGradient } from "expo-linear-gradient";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../App";

type NotificationScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'NotificationScreen'>;

// Helper function to get the correct API URL
const API_URL = Constants.expoConfig?.extra?.apiUrl?.replace("/api", "");

interface Notification {
  id: string;
  userId: string;
  title: string;
  message?: string;
  type?: string;
  isRead: boolean;
  createdAt: string;
  referenceId?: string;
  fromUserId?: string;
  fromUserName?: string;
  fromUserAvatar?: string;
}

const NotificationScreen: React.FC<{ navigation: NotificationScreenNavigationProp }> = ({ navigation }) => {
  const { token, isLoading: isAuthLoading, user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [failedImageLoads, setFailedImageLoads] = useState<Record<string, boolean>>({});
  const imageRefs = useRef<Record<string, any>>({});

  const API_BASE_URL = API_URL;

  const fetchNotifications = useCallback(async () => {
    try {
      if (!token) return;

      setRefreshing(true);
      console.log("Fetching notifications...");
      const response = await fetch(
        `${API_BASE_URL}/api/notifications`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const responseData = await response.json();
     

          // Process notifications
      const notificationsArray = Array.isArray(responseData?.data) ? responseData.data : [];

      
      setNotifications(notificationsArray);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      const errorMessage =
        error instanceof Error ? error.message : "An unknown error occurred";
      Alert.alert(
        "Connection Error",
        `Could not connect to the server. Please check your internet connection and try again.\n\nError: ${errorMessage}`
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token, API_BASE_URL]);

  useEffect(() => {
    if (!isAuthLoading) {
      fetchNotifications();
    }
  }, [isAuthLoading, fetchNotifications]);

  const markAsRead = async (notificationId: string) => {
    try {
      if (!token) return;

      const response = await fetch(
        `${API_BASE_URL}/api/notifications/${notificationId}/read`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notificationId ? { ...n, isRead: true } : n
          )
        );
      }
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  // Function to update notification as read in the backend
  const updateNotificationAsRead = async (notificationId: string) => {
    try {
      console.log('Updating notification as read in backend:', notificationId);
      
      // Get the auth token
      const authToken = token || await AsyncStorage.getItem('userToken');
      
      if (!authToken) {
        console.error('No authentication token available');
        return false;
      }

      // Using the correct endpoint based on the backend route
      const response = await axios.post(
        `${API_BASE_URL}/api/notifications/read/${notificationId}`,
        {},
        {
          headers: { 
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          timeout: 10000 // 10 second timeout
        }
      );

      if (response.status === 200) {
        console.log('Successfully marked notification as read in backend');
        return true;
      } else {
        console.error('Failed to mark notification as read. Status:', response.status);
        return false;
      }
    } catch (error: any) {
      console.error('Error updating notification status:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        notificationId
      });
      return false;
    }
  };

  const handleNotificationPress = async (notification: Notification) => {
    try {
      console.log('=== NOTIFICATION PRESSED ===');
      console.log('Notification:', JSON.stringify(notification, null, 2));
      
      // Mark as read if not already read
      if (!notification.isRead) {
        console.log('Marking notification as read:', notification.id);
        
        // Optimistically update UI
        setNotifications(prev => 
          prev.map(n => 
            n.id === notification.id ? { ...n, isRead: true } : n
          )
        );
        
        // Update in the backend
        const updateSuccess = await updateNotificationAsRead(notification.id);
        
        if (!updateSuccess) {
          // Revert the UI change if the backend update fails
          console.log('Reverting UI update due to backend failure');
          setNotifications(prev => 
            prev.map(n => 
              n.id === notification.id ? { ...n, isRead: false } : n
            )
          );
          Alert.alert('Error', 'Failed to mark notification as read. Please try again.');
          return;
        }
        
        console.log('Successfully updated notification status in backend');
      }

      const type = String(notification.type || 'info').toLowerCase().trim();
      console.log('Processing notification type:', type);
      console.log('Reference ID:', notification.referenceId);
      console.log('From User ID:', notification.fromUserId);
      console.log('Current User ID:', user?.id);
      
      // Helper function for consistent navigation
      const navigateToScreen = async (screen: keyof RootStackParamList, params: any): Promise<boolean> => {
        try {
          console.log(`Attempting to navigate to ${screen} with params:`, params);
          
          // Ensure navigation is available
          if (!navigation || typeof navigation.navigate !== 'function') {
            console.error('Navigation is not available');
            return false;
          }
          
          // Try to navigate
          navigation.navigate(screen, params as any);
          return true;
        } catch (error) {
          console.error(`Error navigating to ${screen}:`, error);
          return false;
        }
      };

      // Handle different notification types
      switch (type) {
        case 'comment':
          if (notification.referenceId) {
            // Navigate to post with comments section focused
            const navSuccess = await navigateToScreen('PostDetail', { 
              postId: notification.referenceId,
              focusComments: true
            } as any);
            if (!navSuccess) {
              throw new Error('Failed to navigate to post detail');
            }
            return;
          }
          break;
          
        case 'like':
          if (notification.referenceId) {
            // Navigate to post with likes list
            const navSuccess = await navigateToScreen('PostDetail', { 
              postId: notification.referenceId,
              showLikes: true
            } as any);
            if (!navSuccess) {
              throw new Error('Failed to navigate to post likes');
            }
            return;
          } else if (notification.fromUserId) {
            // If no post reference, go to liker's profile
            const navSuccess = await navigateToScreen('ViewProfile', {
              userId: notification.fromUserId,
              username: notification.fromUserName || 'User'
            });
            return;
          }
          break;
          
        case 'follow':
        case 'follower':
          if (notification.fromUserId) {
            const navSuccess = await navigateToScreen('ViewProfile', {
              userId: notification.fromUserId,
              username: notification.fromUserName || 'User'
            } as any);
            if (!navSuccess) {
              throw new Error('Failed to navigate to profile');
            }
            return;
          }
          break;
          
        case 'message':
        case 'chat':
          if (notification.fromUserId) {
            if (!user?.id) {
              Alert.alert('Error', 'User information not available');
              return;
            }
            const navSuccess = await navigateToScreen('Chat', {
              currentUserId: user.id,
              otherUserId: notification.fromUserId,
              currentUsername: user.username || '',
              otherUsername: notification.fromUserName || 'User'
            } as any);
            if (!navSuccess) {
              throw new Error('Failed to navigate to chat');
            }
            return;
          }
          break;
          
        case 'post':
          if (notification.referenceId) {
            const navSuccess = await navigateToScreen('PostDetail', {
              postId: notification.referenceId,
              focusComments: false
            } as any);
            if (!navSuccess) {
              throw new Error('Failed to navigate to post');
            }
            return;
          }
          break;
      }
      
      // Log unhandled notification types for debugging
      console.log('No navigation handler for notification type:', type);
      console.log('Notification data:', JSON.stringify(notification, null, 2));
      
      // No alert will be shown for unhandled notification types
    } catch (error) {
      console.error("Error navigating from notification:", error);
      Alert.alert(
        "Navigation Error", 
        "Unable to open the related content. Please try again."
      );
    }
  };

  const getNotificationIcon = (type: string) => {
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
        return { name: "mail-outline", color: "#E64A0D" };
      default:
        return { name: "notifications-outline", color: "#F9662D" };
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const notificationTime = new Date(dateString);
    const diffInSeconds = Math.floor(
      (now.getTime() - notificationTime.getTime()) / 1000
    );

    if (diffInSeconds < 60) {
      return "now";
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes}m ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours}h ago`;
    } else if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days}d ago`;
    } else {
      return notificationTime.toLocaleDateString();
    }
  };

  const renderItem = ({
    item,
    index,
  }: {
    item: Notification;
    index: number;
  }) => {
    const icon = getNotificationIcon(item.type || "default");
    const isRecent = index < 3 && !item.isRead;

    return (
      <TouchableOpacity
        style={[
          styles.notificationItem,
          !item.isRead && styles.unreadNotification,
          { flexDirection: 'row', alignItems: 'center', padding: 12 }
        ]}
        onPress={() => handleNotificationPress(item)}
        activeOpacity={0.8}
      >
        {!item.isRead && <View style={styles.unreadDot} />}

        <View style={styles.avatarContainer}>
          {item.fromUserAvatar && !failedImageLoads[item.id] ? (
            <View style={styles.avatarWrapper}>
              <Image
                source={{
                  uri: item.fromUserAvatar
                    ? item.fromUserAvatar.startsWith('http')
                      ? item.fromUserAvatar
                      : `${API_BASE_URL}${item.fromUserAvatar.startsWith('/') ? '' : '/'}${item.fromUserAvatar}`
                    : 'https://via.placeholder.com/300x200',
                  cache: 'force-cache',
                }}
                style={[styles.avatar, { opacity: 0 }]}
                onError={(error: NativeSyntheticEvent<ImageErrorEventData>) => {
                  console.log('Error loading image:', error.nativeEvent.error);
                  setFailedImageLoads(prev => ({
                    ...prev,
                    [item.id]: true
                  }));
                }}
                onLoadStart={() => {
                  // Loading indicator could be shown here
                }}
                onLoadEnd={() => {
                  // Handle load end if needed
                }}
                onLoad={(event: NativeSyntheticEvent<ImageLoadEventData>) => {
                  const target = event.nativeEvent.source.uri;
                  if (target) {
                    Image.prefetch(target).catch(console.warn);
                  }
                  const ref = imageRefs.current[item.id];
                  if (ref) {
                    ref.setNativeProps({
                      style: { opacity: 1 }
                    });
                  }
                }}
                ref={ref => {
                  if (ref) {
                    imageRefs.current[item.id] = ref;
                  } else {
                    delete imageRefs.current[item.id];
                  }
                }}
                resizeMode="cover"
              />
              <View style={styles.avatarFallback}>
                <Text style={styles.avatarFallbackText}>
                  {item.fromUserName?.charAt(0) || 'U'}
                </Text>
              </View>
            </View>
          ) : (
            <View style={[styles.defaultAvatar, { backgroundColor: icon.color }]}>
              <Text style={styles.defaultAvatarText}>
                {(item.fromUserName || item.title).charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          <View style={[styles.iconBadge, { backgroundColor: icon.color }]}>
            <Ionicons name={icon.name as any} size={12} color="#fff" />
          </View>
        </View>

        <View style={styles.notificationContent}>
          <View style={styles.contentRow}>
            <Text style={styles.notificationTitle} numberOfLines={2}>
              <Text style={styles.userName}>
                {item.fromUserName || "Someone"}
              </Text>
              <Text style={styles.actionText}>
                {" "}
                {item.type === "like"
                  ? "liked your post"
                  : item.type === "comment"
                    ? "commented on your post"
                    : item.type === "follow"
                      ? "started following you"
                      : item.type === "post"
                        ? "shared a new post"
                        : item.type === "message"
                          ? "sent you a message"
                          : item.title}
              </Text>
            </Text>
            <Text style={styles.timeText}>{formatTimeAgo(item.createdAt)}</Text>
          </View>

          {item.message && (
            <Text style={styles.notificationMessage} numberOfLines={1}>
              {item.message}
            </Text>
          )}
        </View>

        {(item.type === "like" || item.type === "comment") && (
          <View style={styles.postThumbnail}>
            <View style={styles.placeholderImage}>
              <Ionicons name="image-outline" size={20} color="#ccc" />
            </View>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const groupNotificationsByTime = (notifications: Notification[]) => {
    const now = new Date();
    const groups: { title: string; data: Notification[] }[] = [];

    const today: Notification[] = [];
    const yesterday: Notification[] = [];
    const thisWeek: Notification[] = [];
    const earlier: Notification[] = [];

    notifications.forEach((notification) => {
      const notifDate = new Date(notification.createdAt);
      const diffInDays = Math.floor(
        (now.getTime() - notifDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (diffInDays === 0) {
        today.push(notification);
      } else if (diffInDays === 1) {
        yesterday.push(notification);
      } else if (diffInDays <= 7) {
        thisWeek.push(notification);
      } else {
        earlier.push(notification);
      }
    });

    if (today.length > 0) groups.push({ title: "Today", data: today });
    if (yesterday.length > 0)
      groups.push({ title: "Yesterday", data: yesterday });
    if (thisWeek.length > 0)
      groups.push({ title: "This Week", data: thisWeek });
    if (earlier.length > 0) groups.push({ title: "Earlier", data: earlier });

    return groups;
  };

  const filteredNotifications =
    filter === "all" ? notifications : notifications.filter((n) => !n.isRead);

  const groupedNotifications = groupNotificationsByTime(filteredNotifications);

  if (isAuthLoading || loading) {
    return (
      <View style={styles.loadingContainer}>
        <LinearGradient
          colors={["#E64A0D", "#F9662D"]}
          style={styles.loadingGradient}
        >
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.loadingText}>Loading notifications...</Text>
        </LinearGradient>
      </View>
    );
  }

  const renderSectionHeader = ({ section }: { section: { title: string } }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionHeaderText}>{section.title}</Text>
    </View>
  );

  return (
    <View style={{ flex: 1 }}>
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#E64A0D" />

        <LinearGradient colors={["#E64A0D", "#F9662D"]} style={styles.header}>

          <View style={styles.filterContainer}>
            <TouchableOpacity
              style={[
                styles.filterButton,
                filter === "all" && styles.activeFilter,
              ]}
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
              style={[
                styles.filterButton,
                filter === "unread" && styles.activeFilter,
              ]}
              onPress={() => setFilter("unread")}
            >
              <Text
                style={[
                  styles.filterText,
                  filter === "unread" && styles.activeFilterText,
                ]}
              >
                Unread
              </Text>
              {notifications.filter((n) => !n.isRead).length > 0 && (
                <View style={styles.unreadBadge}>
                  <Text style={styles.unreadBadgeText}>
                    {notifications.filter((n) => !n.isRead).length}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </LinearGradient>

        <FlatList
          data={filteredNotifications}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={fetchNotifications}
              colors={["#E64A0D"]}
              tintColor="#E64A0D"
              progressBackgroundColor="#fff"
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <LinearGradient
                colors={["#E64A0D", "#F9662D"]}
                style={styles.emptyIconContainer}
              >
                <Ionicons
                  name="notifications-off-outline"
                  size={40}
                  color="#fff"
                />
              </LinearGradient>
              <Text style={styles.emptyTitle}>No notifications yet</Text>
              <Text style={styles.emptySubtitle}>
                When you get notifications, they'll show up here
              </Text>
            </View>
          }
        />
      </SafeAreaView>
      <RoleBasedBottomNav navigation={navigation} />
    </View>
  );
};

const styles = StyleSheet.create({
  avatarWrapper: {
    position: 'relative',
    width: 50,
    height: 50,
    borderRadius: 25,
    overflow: 'hidden',
    backgroundColor: '#f0f0f0',
  },
  avatar: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 1,
  },
  avatarFallback: {
    width: '100%',
    height: '100%',
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarFallbackText: {
    color: '#666',
    fontSize: 20,
    fontWeight: 'bold',
  },
  container: {
    flex: 1,
    backgroundColor: "#fafafa",
  },
  loadingContainer: {
    flex: 1,
  },
  loadingGradient: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "#fff",
    fontSize: 16,
    marginTop: 15,
    fontWeight: "500",
  },
  header: {
    paddingTop: Platform.OS === "ios" ? 0 : StatusBar.currentHeight,
    paddingBottom: 20,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
  },
  settingsButton: {
    padding: 8,
  },
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
  activeFilter: {
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  filterText: {
    color: "rgba(255, 255, 255, 0.8)",
    fontWeight: "600",
    fontSize: 16,
  },
  activeFilterText: {
    color: "#E64A0D",
  },
  unreadBadge: {
    backgroundColor: "#fff",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  unreadBadgeText: {
    color: "#E64A0D",
    fontSize: 12,
    fontWeight: "bold",
  },
  listContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  sectionHeader: {
    backgroundColor: "#f5f5f5",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  sectionHeaderText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  notificationItem: {
    flex: 1,
    flexDirection: "row",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    backgroundColor: "#fff",
    alignItems: "center",
  },
  unreadNotification: {
    backgroundColor: "#fff5f3",
  },
  unreadDot: {
    position: "absolute",
    left: 8,
    top: "50%",
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#E64A0D",
    marginTop: -4,
  },
  avatarContainer: {
    position: "relative",
    marginRight: 12,
    width: 48,
    height: 48,
  },
  notificationAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#f0f0f0",
  },
  defaultAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  defaultAvatarText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  iconBadge: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  notificationContent: {
    flex: 1,
    justifyContent: "center",
    marginLeft: 12,
  },
  contentRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 4,
  },
  notificationTitle: {
    flex: 1,
    fontSize: 15,
    lineHeight: 20,
    marginRight: 8,
  },
  userName: {
    fontWeight: "600",
    color: "#262626",
  },
  actionText: {
    fontWeight: "400",
    color: "#262626",
  },
  timeText: {
    fontSize: 12,
    color: "#8e8e8e",
    fontWeight: "400",
  },
  notificationMessage: {
    fontSize: 14,
    color: "#8e8e8e",
    marginTop: 2,
  },
  postThumbnail: {
    marginLeft: 8,
  },
  placeholderImage: {
    width: 44,
    height: 44,
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
    paddingTop: 80,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: "600",
    color: "#262626",
    marginBottom: 8,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 16,
    color: "#8e8e8e",
    textAlign: "center",
    lineHeight: 22,
  },
});

export default NotificationScreen;