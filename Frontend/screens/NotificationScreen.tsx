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

// Helper function to get the correct API URL
const API_URL = Constants.expoConfig?.extra?.apiUrl?.replace('/api', '');

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
  fromUserName?: string;
  fromUserAvatar?: string;
  organizerId?: string;
  organizerName?: string;
  content?: string;
  actionUrl?: string;
}

const NotificationScreen: React.FC<{ navigation: NotificationScreenNavigationProp }> = ({ navigation }) => {
  const { token, user, isLoading: isAuthLoading } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [failedImageLoads, setFailedImageLoads] = useState<Record<string, boolean>>({});

  const API_BASE_URL = API_URL;

  const fetchNotifications = useCallback(async () => {
    try {
      if (!token) return;

      setRefreshing(true);
      console.log('Fetching notifications...');
      const response = await fetch(`${API_BASE_URL}/api/notifications`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const responseData = await response.json();
      const notificationsArray = Array.isArray(responseData?.data) ? responseData.data : [];
      
      setNotifications(notificationsArray);
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

    // Handle navigation based on notification type
    if (notification.category === 'event' && notification.eventId) {
      console.log('Processing event notification');
      console.log('Event ID:', notification.eventId);
      
      navigation.navigate('EventDetail', {
        eventId: notification.eventId,
      } as any);
    } else if (notification.type === 'post' && notification.referenceId) {
      console.log('Processing post notification');
      console.log('Reference ID:', notification.referenceId);
      
      navigation.navigate('PostDetail', {
        focusComments: false,
        postId: notification.referenceId,
      } as any);
    } else if (notification.type === 'message' && notification.fromUserId && user) {
      console.log('Processing message notification');
      
      navigation.navigate('Chat', {
        currentUserId: user?.id ?? '',
        otherUserId: notification.fromUserId ?? '',
        currentUsername: user?.username ?? 'Current User',
        otherUsername: notification.fromUserName ?? 'User',
      });
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

  const handleImageError = (notificationId: string) => {
    setFailedImageLoads(prev => ({ ...prev, [notificationId]: true }));
  };

  const renderNotificationItem = ({ item, index }: { item: Notification; index: number }) => {
    const icon = getNotificationIcon(item.type, item.category);
    const hasAvatar = item.fromUserAvatar && !failedImageLoads[item.id];
    
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
              source={{ uri: item.fromUserAvatar }} 
              style={styles.avatar}
              onError={() => handleImageError(item.id)}
            />
          ) : (
            <View style={[styles.defaultAvatar, { backgroundColor: icon.color }]}>
              <Text style={styles.defaultAvatarText}>
                {(item.fromUserName || item.organizerName || item.title).charAt(0).toUpperCase()}
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
            <View style={styles.placeholderImage}>
              <Ionicons 
                name={item.category === 'event' ? 'calendar' : 'image-outline'} 
                size={20} 
                color="#ccc" 
              />
            </View>
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