import React, { useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Constants from 'expo-constants';
import { useAuth } from '../utils/AuthContext';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { useFocusEffect } from '@react-navigation/native';

type NotificationScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Notification'>;

// Helper function to get the correct API URL with fallbacks
const API_URL = (Constants.expoConfig?.extra?.apiUrl?.replace('/api', ''))
  || (process.env.EXPO_PUBLIC_API_URL?.replace('/api', ''))
  || '';

// Normalize relative URLs (e.g., /uploads/xyz.jpg) to absolute using API base
const toAbsolute = (base?: string, path?: string) => {
  if (!path) return undefined as unknown as string;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  if (!base) return path; // fallback if base not configured
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
};

interface Notification {
  id: string;
  type: "like" | "follow" | "message" | "comment" | "post" | "system";
  userName: string;
  userAvatar?: string | null | number; // number is for local require
  action: string;
  timeAgo: string;
  isRead: boolean;
  createdAt: string;
  updatedAt?: string;
  eventId?: string;
  postId?: string;
  referenceId?: string;
  fromUserId?: string;
  fromUserName?: string; // mapped from authorName or organizerName
  fromUserAvatar?: string; // mapped from authorAvatarUrl or organizerAvatarUrl
  organizerId?: string;
  organizerName?: string;
  organizerAvatarUrl?: string;
  authorName?: string;
  authorAvatarUrl?: string;
  postImageUrl?: string;
  content?: string;
  actionUrl?: string;
}

const NotificationScreen: React.FC<{ navigation: NotificationScreenNavigationProp }> = ({ navigation }) => {
  const { token, user, isLoading: isAuthLoading } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  // Track avatar and thumbnail failures separately
  const [failedAvatarLoads, setFailedAvatarLoads] = useState<Record<string, boolean>>({});
  const [failedThumbLoads, setFailedThumbLoads] = useState<Record<string, boolean>>({});

  const API_BASE_URL = API_URL;

  const fetchNotifications = useCallback(async () => {
    try {
      if (!token) return;

      setRefreshing(true);
      console.log('Fetching notifications...', { API_BASE_URL });
      const response = await fetch(`${API_BASE_URL}/api/notifications`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const responseData = await response.json();
      const rawArray = Array.isArray(responseData?.data) ? responseData.data : [];
      if (rawArray.length > 0) {
        const sampleRaw = rawArray[0];
        console.log('Sample raw notification', {
          id: sampleRaw.id || sampleRaw._id,
          organizerName: sampleRaw.organizerName,
          organizerAvatarUrl: sampleRaw.organizerAvatarUrl,
          postImageUrl: sampleRaw.postImageUrl,
          type: sampleRaw.type,
          category: sampleRaw.category,
        });
      }
      // Map backend fields to UI-friendly shape and ensure absolute URLs for images
      const mapped: Notification[] = rawArray.map((n: any) => {
        // Choose a single coherent source for both name and avatar to avoid mismatches
        // Priority: organizer -> author -> explicit fromUser -> fallback title
        let nameSource: string | undefined;
        let avatarSource: string | undefined;

        if (n.organizerName || n.organizerAvatarUrl) {
          nameSource = n.organizerName ?? n.authorName ?? n.fromUserName;
          avatarSource = n.organizerAvatarUrl ??  n.fromUserAvatar;
        } else if (n.authorName || n.authorAvatarUrl) {
          nameSource = n.authorName ?? n.fromUserName ?? n.organizerName;
          avatarSource = n.authorAvatarUrl ?? n.fromUserAvatar ?? n.organizerAvatarUrl;
        } else if (n.fromUserName || n.fromUserAvatar) {
          nameSource = n.fromUserName ?? n.authorName ?? n.organizerName;
          avatarSource = n.fromUserAvatar ?? n.authorAvatarUrl ?? n.organizerAvatarUrl;
        }

        // If it's a post/promotion-style notification, force organizer as the primary identity when available
        const isPostLike = (n.type === 'post' || n.type === 'like' || n.type === 'comment' || n.category === 'Promotion');

        if (isPostLike && (n.organizerName || n.organizerAvatarUrl)) {
          nameSource = n.organizerName ?? nameSource;
          avatarSource = n.organizerAvatarUrl ?? avatarSource;
        }

        const primaryName = (nameSource || n.organizerName || n.authorName || n.fromUserName || n.title || 'Someone');
        const postImageUrl = toAbsolute(API_BASE_URL, n.postImageUrl);

        // Also normalize and keep the explicit organizer/author avatar fields absolute for any direct UI usage
        const organizerAvatarUrl = toAbsolute(API_BASE_URL, n.organizerAvatarUrl);
        const authorAvatarUrl = toAbsolute(API_BASE_URL, n.authorAvatarUrl);

        const baseMapped = {
          ...n,
          fromUserName: primaryName,
          organizerAvatarUrl,
          authorAvatarUrl,
          postImageUrl,
        } as Notification;

        // For post/promotion/like/comment, prefer organizer's name for display
        if (isPostLike && n.organizerName) {
          baseMapped.fromUserName = n.organizerName;
        }

        return baseMapped;
      });
      if (mapped.length > 0) {
        const sample = mapped[0];
        console.log('Sample mapped notification', {
          id: sample.id,
          type: sample.type,
          category: sample.category,
          organizerName: sample.organizerName,
          organizerAvatarUrl: sample.organizerAvatarUrl,
          fromUserName: sample.fromUserName,
          postImageUrl: sample.postImageUrl,
        });
      }
      setNotifications(mapped);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      Alert.alert(
        'Connection Error',
        `Could not connect to the server. Please check your internet connection and try again.\n\nError: ${errorMessage}`
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token, API_BASE_URL]);

  // Refresh notifications when the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchNotifications();
    }, [fetchNotifications])
  );

  useEffect(() => {
    if (!isAuthLoading) {
      fetchNotifications();
    }
  }, [isAuthLoading, fetchNotifications]);

  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      if (!token) return;

      await fetch(`${API_BASE_URL}/api/notifications/read/${notificationId}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      // Update local state
      setNotifications(prevNotifications =>
        prevNotifications.map(n =>
          n.id === notificationId ? { ...n, isRead: true } : n
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }, [token, API_BASE_URL]);

  const handleNotificationPress = useCallback((notification: Notification) => {
    console.log('=== NOTIFICATION PRESSED ===');
    console.log('Notification:', JSON.stringify(notification, null, 2));

    // Mark as read
    markAsRead(notification.id);

    // Prefer server-provided actionUrl for navigation
    if (notification.actionUrl) {
      try {
        const [path, qs] = notification.actionUrl.split('?');
        const segments = path.split('/').filter(Boolean);
        const params = qs ? Object.fromEntries(new URLSearchParams(qs)) : {} as any;

        if (segments[0] === 'posts' && segments[1]) {
          navigation.navigate('PostDetail', { postId: segments[1], ...params } as any);
          return;
        }
        if (segments[0] === 'messages') {
          navigation.navigate('Messages' as any);
          return;
        }
        if (segments[0] === 'events' && segments[1]) {
          navigation.navigate('EventDetail', { eventId: segments[1], ...params } as any);
          return;
        }
      } catch (e) {
        console.warn('Failed to parse actionUrl:', notification.actionUrl, e);
      }
    }

    // Fallbacks based on category/type
    if ((notification.category === 'event' || notification.type === 'event') && notification.eventId) {
      navigation.navigate('EventDetail', { eventId: notification.eventId } as any);
      return;
    }
    if ((notification.category === 'post' || ['post','like','comment'].includes(notification.type || '')) && notification.referenceId) {
      navigation.navigate('PostDetail', { postId: notification.referenceId } as any);
      return;
    }
    if ((notification.category === 'message' || notification.type === 'message') && notification.fromUserId && user) {
      navigation.navigate('Chat', {
        currentUserId: user?.id ?? '',
        otherUserId: notification.fromUserId ?? '',
        currentUsername: user?.username ?? 'Current User',
        otherUsername: notification.fromUserName ?? 'User',
      } as any);
      return;
    }
  }, [markAsRead, navigation, user]);

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

  const handleAvatarError = (notificationId: string) => {
    setFailedAvatarLoads(prev => ({ ...prev, [notificationId]: true }));
  };

  const handleThumbError = (notificationId: string) => {
    setFailedThumbLoads(prev => ({ ...prev, [notificationId]: true }));
  };

  const renderNotificationItem = ({ item, index }: { item: Notification; index: number }) => {
    const icon = getNotificationIcon(item.type, item.category);
    const avatarUri = ((item.organizerAvatarUrl || '').startsWith('http')
      ? (item.organizerAvatarUrl as string)
      : (item.organizerAvatarUrl ? `${API_URL}${item.organizerAvatarUrl}` : '')) as string;
    const hasAvatar = !!(avatarUri && !failedAvatarLoads[item.id]);
    const thumbUri = ((item.postImageUrl || '').startsWith('http')
      ? (item.postImageUrl as string)
      : (item.postImageUrl ? `${API_URL}${item.postImageUrl}` : '')) as string;
    const hasThumbnail = !!(thumbUri && !failedThumbLoads[item.id]);

    return (
      <TouchableOpacity
        style={[
          styles.notificationItem,
          !item.isRead && styles.unreadNotification,
        ]}
        onPress={() => handleNotificationPress(item)}
        activeOpacity={0.8}
      >
        {!item.isRead && <View style={styles.unreadDot} />}
        
        <View style={styles.avatarContainer}>
          {hasAvatar ? (
            <Image 
              source={{ uri: avatarUri }} 
              style={styles.avatar}
              onError={() => {
                console.warn('Avatar image failed to load', { id: item.id, avatarUri });
                handleAvatarError(item.id);
              }}
            />
          ) : (
            <View style={[styles.defaultAvatar, { backgroundColor: icon.color }]}> 
              <Text style={styles.defaultAvatarText}>
                {(item.organizerName || item.fromUserName || item.title).charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          
          <View style={[styles.iconBadge, { backgroundColor: icon.color }]}>
            <Ionicons name={icon.name as any} size={12} color="#fff" />
          </View>
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
          
          {item.message && (
            <Text style={styles.notificationMessage} numberOfLines={2}>
              {item.message}
            </Text>
          )}
        </View>

        {(item.type === 'like' || item.type === 'comment' || item.type === 'post') && (
          <View style={styles.postThumbnail}>
            {hasThumbnail ? (
              <Image
                source={{ uri: thumbUri }}
                style={styles.thumbnailImage}
                onError={() => {
                  console.warn('Post image failed to load', { id: item.id, thumbUri });
                  handleThumbError(item.id);
                }}
              />
            ) : (
              <View style={styles.placeholderImage}>
                <Ionicons
                  name={item.category === 'event' ? 'calendar' : 'image-outline'}
                  size={20}
                  color="#ccc"
                />
              </View>
            )}
          </View>
        )}
      </TouchableOpacity>
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
    borderColor: '#e0e0e0',
  },
  thumbnailImage: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingTop: 80,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#262626',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#8e8e8e',
    textAlign: 'center',
    lineHeight: 22,
  },
});

export default NotificationScreen;
