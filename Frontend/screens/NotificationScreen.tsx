import React, { useState, useEffect, useCallback } from "react";
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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Constants from "expo-constants";
import { useAuth } from "../utils/AuthContext";
import RoleBasedBottomNav from "../component/rolebasedNav";

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
}

const NotificationScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { token, isLoading: isAuthLoading } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const API_BASE_URL = API_URL;

  const fetchNotifications = useCallback(async () => {
    try {
      if (!token) {
        console.log('No token available, redirecting to login');
        navigation.navigate("Login");
        return;
      }

      console.log('Fetching notifications from:', `${API_BASE_URL}/api/notifications`);
      
      const response = await fetch(
        `${API_BASE_URL}/api/notifications?unreadOnly=${filter === "unread"}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Server response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const data = await response.json();
      console.log('Received notifications:', data);
      // Ensure data is an array before setting it to state
      const notificationsArray = Array.isArray(data) ? data : [];
      setNotifications(notificationsArray);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      Alert.alert("Connection Error", `Could not connect to the server. Please check your internet connection and try again.\n\nError: ${errorMessage}`);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token, filter, navigation, API_BASE_URL]);

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
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        setNotifications(prev => 
          prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
        );
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleNotificationPress = (notification: Notification) => {
    markAsRead(notification.id);
    
    // Handle navigation based on notification type
    if (notification.type === 'post' && notification.referenceId) {
      navigation.navigate("PostDetail", { postId: notification.referenceId });
    } else if (notification.type === 'message' && notification.fromUserId) {
      navigation.navigate("Chat", { userId: notification.fromUserId });
    }
  };

  const renderItem = ({ item }: { item: Notification }) => (
    <TouchableOpacity 
      style={[
        styles.notificationItem,
        !item.isRead && styles.unreadNotification
      ]}
      onPress={() => handleNotificationPress(item)}
    >
      <View style={styles.notificationContent}>
        <Text style={styles.notificationTitle}>{item.title}</Text>
        {item.message && (
          <Text style={styles.notificationMessage} numberOfLines={2}>
            {item.message}
          </Text>
        )}
        <Text style={styles.notificationTime}>
          {new Date(item.createdAt).toLocaleString()}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const filteredNotifications = filter === 'all' 
    ? notifications 
    : notifications.filter(n => !n.isRead);

  if (isAuthLoading || loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.header}>
        <Text style={styles.headerTitle}>Notifications</Text>
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
            <Text style={[
              styles.filterText,
              filter === 'unread' && styles.activeFilterText
            ]}>
              Unread
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={filteredNotifications}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={fetchNotifications}
            colors={['#0000ff']}
            tintColor="#0000ff"
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="notifications-off-outline" size={50} color="#ccc" />
            <Text style={styles.emptyText}>No notifications found</Text>
          </View>
        }
      />
      </SafeAreaView>
      <RoleBasedBottomNav navigation={navigation} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  filterContainer: {
    flexDirection: 'row',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 2,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  activeFilter: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  filterText: {
    color: '#666',
    fontWeight: '500',
  },
  activeFilterText: {
    color: '#000',
    fontWeight: '600',
  },
  listContent: {
    flexGrow: 1,
  },
  notificationItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#fff',
  },
  unreadNotification: {
    backgroundColor: '#f8f9ff',
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  notificationMessage: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  notificationTime: {
    fontSize: 12,
    color: '#999',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    marginTop: 10,
    color: '#999',
    fontSize: 16,
  },
});

export default NotificationScreen;
