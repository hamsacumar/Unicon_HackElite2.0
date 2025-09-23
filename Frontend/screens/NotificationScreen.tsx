import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
  Alert,
  Image,
  Platform,
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
  userId: string;
  title: string;
  message?: string;
  type?: string;
  category?: 'event' | 'post' | 'message' | 'system';
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

  const getNotificationIcon = (type?: string, category?: string) => {
    const notificationType = type || category;
    if (!notificationType) return { name: 'notifications-outline' as const, color: '#666' };
    
    switch (notificationType.toLowerCase()) {
      case 'like':
        return { name: 'heart' as const, color: '#E64A0D' };
      case 'comment':
        return { name: 'chatbubble-outline' as const, color: '#F9662D' };
      case 'follow':
        return { name: 'person-add-outline' as const, color: '#E64A0D' };
      case 'event':
        return { name: 'calendar' as const, color: '#2196F3' };
      case 'post':
        return { name: 'image-outline' as const, color: '#F9662D' };
      case 'message':
        return { name: 'mail-outline' as const, color: '#9C27B0' };
      case 'system':
        return { name: 'settings-outline' as const, color: '#666' };
      default:
        return { name: 'notifications-outline' as const, color: '#F9662D' };
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
          <View style={styles.contentRow}>
            <Text style={styles.notificationTitle} numberOfLines={2}>
              <Text style={styles.userName}>
                {item.fromUserName || item.organizerName || 'Someone'}
              </Text>
              <Text style={styles.actionText}>
                {' '}
                {item.type === 'like' ? 'liked your post' :
                 item.type === 'comment' ? 'commented on your post' :
                 item.type === 'follow' ? 'started following you' :
                 item.category === 'event' ? 'created a new event' :
                 item.type === 'post' ? 'shared a new post' :
                 item.type === 'message' ? 'sent you a message' :
                 item.title}
              </Text>
            </Text>
            <Text style={styles.timeText}>
              {formatTimeAgo(item.createdAt)}
            </Text>
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

  const filteredNotifications = React.useMemo(() => {
    if (filter === 'all') {
      return notifications;
    }
    return notifications.filter((n: Notification) => !n.isRead);
  }, [filter, notifications]);

  if (isAuthLoading || loading) {
    return (
      <View style={styles.loadingContainer}>
        <LinearGradient
          colors={['#E64A0D', '#F9662D']}
          style={styles.loadingGradient}
        >
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.loadingText}>Loading notifications...</Text>
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#E64A0D" />
        
        <LinearGradient colors={['#E64A0D', '#F9662D']} style={styles.header}>
         
          <View style={styles.filterContainer}>
            <TouchableOpacity
              style={[
                styles.filterButton,
                filter === 'all' && styles.activeFilter
              ]}
              onPress={() => setFilter('all')}
            >
              <Text style={[
                styles.filterText,
                filter === 'all' && styles.activeFilterText
              ]}>
                All
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.filterButton,
                filter === 'unread' && styles.activeFilter
              ]}
              onPress={() => setFilter('unread')}
            >
              <View style={styles.unreadCountContainer}>
                <Text style={[
                  styles.filterText,
                  filter === 'unread' && styles.activeFilterText
                ]}>
                  Unread
                </Text>
                {notifications.filter(n => !n.isRead).length > 0 && (
                  <View style={styles.unreadBadge}>
                    <Text style={styles.unreadBadgeText}>
                      {notifications.filter(n => !n.isRead).length}
                    </Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          </View>
        </LinearGradient>

        <FlatList
          data={filteredNotifications}
          renderItem={renderNotificationItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={fetchNotifications}
              colors={['#E64A0D']}
              tintColor="#E64A0D"
              progressBackgroundColor="#fff"
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <LinearGradient
                colors={['#E64A0D', '#F9662D']}
                style={styles.emptyIconContainer}
              >
                <Ionicons 
                  name={filter === 'unread' ? 'checkmark-circle-outline' : 'notifications-off-outline'} 
                  size={40} 
                  color="#fff" 
                />
              </LinearGradient>
              <Text style={styles.emptyTitle}>
                {filter === 'unread' ? 'All caught up!' : 'No notifications yet'}
              </Text>
              <Text style={styles.emptySubtitle}>
                {filter === 'unread' 
                  ? 'You have no unread notifications'
                  : 'When you get notifications, they\'ll show up here'}
              </Text>
            </View>
          }
        />
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fafafa',
  },
  loadingContainer: {
    flex: 1,
  },
  loadingGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 15,
    fontWeight: '500',
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 0 : StatusBar.currentHeight,
    paddingBottom: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  settingsButton: {
    padding: 8,
  },
  filterContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 25,
    padding: 4,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 20,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  activeFilter: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  filterText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '600',
    fontSize: 16,
  },
  activeFilterText: {
    color: '#E64A0D',
  },
  unreadCountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  unreadBadge: {
    backgroundColor: '#fff',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  unreadBadgeText: {
    color: '#E64A0D',
    fontSize: 12,
    fontWeight: 'bold',
  },
  listContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  notificationItem: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    alignItems: 'flex-start',
    position: 'relative',
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  unreadNotification: {
    backgroundColor: '#fff5f3',
    borderLeftWidth: 4,
    borderLeftColor: '#E64A0D',
  },
  unreadDot: {
    position: 'absolute',
    left: 8,
    top: '50%',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E64A0D',
    marginTop: -4,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
    marginLeft: 8,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f0f0f0',
  },
  defaultAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  defaultAvatarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  iconBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  notificationContent: {
    flex: 1,
    justifyContent: 'center',
  },
  contentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  notificationTitle: {
    flex: 1,
    fontSize: 15,
    lineHeight: 20,
    marginRight: 8,
  },
  userName: {
    fontWeight: '600',
    color: '#262626',
  },
  actionText: {
    fontWeight: '400',
    color: '#262626',
  },
  timeText: {
    fontSize: 12,
    color: '#8e8e8e',
    fontWeight: '400',
  },
  notificationMessage: {
    fontSize: 14,
    color: '#8e8e8e',
    marginTop: 2,
  },
  postThumbnail: {
    marginLeft: 8,
  },
  placeholderImage: {
    width: 44,
    height: 44,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
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