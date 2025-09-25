import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";

export interface NotificationData {
  id: string;
  userId: string;
  organizerId?: string;
  category?: string;
  title: string;
  message?: string;
  type?: string;
  referenceId?: string;
  fromUserId?: string;
  isRead: boolean;
  createdAt: string;
  content?: string;
  actionUrl?: string;
}

export interface SubscriptionData {
  id?: string;
  userId: string;
  organizerId: string;
  category?: string;
  postId?: string;
  title?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

class NotificationService {
  private baseUrl: string;
  private static instance: NotificationService;

  private constructor() {
    // Prefer Expo-configured API URL (should include '/api')
    const cfgUrl = Constants.expoConfig?.extra?.apiUrl;
    const envUrl = process.env.EXPO_PUBLIC_API_URL;
    const fallback = "http://localhost:5000/api"; // fallback for dev simulators only
    this.baseUrl = (cfgUrl || envUrl || fallback).replace(/\/+$/, "");
    console.log("[NotificationService] Base URL:", this.baseUrl);
    this.initializeNotifications();
  }

  // Disable all subscriptions for current user (use on logout)
  async unsubscribeAll(): Promise<boolean> {
    try {
      const headers = await this.getAuthHeaders();
      const base = this.baseUrl.replace(/\/+$/, "");
      const hasApi = /\/api$/i.test(base);
      const url = `${base}${hasApi ? "" : "/api"}/notifications/unsubscribe-all`;
      const maskedAuth = headers.Authorization
        ? headers.Authorization.slice(0, 16) + "..."
        : "";
      console.log("[NotificationService] unsubscribeAll ->", {
        url,
        hasAuth: !!headers.Authorization,
        authPrefix: maskedAuth,
      });
      const response = await fetch(url, {
        method: "POST",
        headers,
      });
      if (response.ok) {
        const result = await response.json();
        return result.success;
      }
      throw new Error(`Failed to unsubscribe all: ${response.status}`);
    } catch (error) {
      console.error("Error unsubscribing all:", error);
      return false;
    }
  }

  // Configure title-based notifications for an organizer (no postId, not a general organizer subscribe)
  async configureTitle(
    organizerId: string,
    title: string,
    category?: string
  ): Promise<boolean> {
    try {
      const headers = await this.getAuthHeaders();
      const base = this.baseUrl.replace(/\/+$/, "");
      const hasApi = /\/api$/i.test(base);
      const url = `${base}${hasApi ? "" : "/api"}/notifications/subscribe`;
      const maskedAuth = headers.Authorization
        ? headers.Authorization.slice(0, 16) + "..."
        : "";
      console.log("[NotificationService] configureTitle ->", {
        url,
        organizerId,
        title,
        category,
        hasAuth: !!headers.Authorization,
        authPrefix: maskedAuth,
      });
      const response = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify({
          organizerId,
          title,
          category,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        return result.success;
      } else {
        throw new Error(
          `Failed to configure title notifications: ${response.status}`
        );
      }
    } catch (error) {
      console.error("Error configuring title notifications:", error);
      throw error;
    }
  }

  // Remove title-based notifications configuration
  async unsubscribeTitle(organizerId: string, title: string): Promise<boolean> {
    try {
      const headers = await this.getAuthHeaders();
      const base = this.baseUrl.replace(/\/+$/, "");
      const hasApi = /\/api$/i.test(base);
      const url = `${base}${hasApi ? "" : "/api"}/notifications/unsubscribe-title`;
      const maskedAuth = headers.Authorization
        ? headers.Authorization.slice(0, 16) + "..."
        : "";
      console.log("[NotificationService] unsubscribeTitle ->", {
        url,
        organizerId,
        title,
        hasAuth: !!headers.Authorization,
        authPrefix: maskedAuth,
      });
      const response = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify({ organizerId, title }),
      });
      if (response.ok) {
        const result = await response.json();
        return result.success;
      } else {
        throw new Error(
          `Failed to unsubscribe title notifications: ${response.status}`
        );
      }
    } catch (error) {
      console.error("Error unsubscribing title notifications:", error);
      throw error;
    }
  }

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  private async initializeNotifications() {
    // Configure notification behavior
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true, // replaces shouldShowAlert
        shouldShowList: true, // new required property
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });

    // Request permissions
    await this.requestPermissions();
  }

  private async requestPermissions(): Promise<boolean> {
    try {
      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      return finalStatus === "granted";
    } catch (error) {
      console.error("Error requesting notification permissions:", error);
      return false;
    }
  }

  private async getAuthHeaders(): Promise<{ [key: string]: string }> {
    // Prefer SecureStore (used elsewhere in the app), then fall back to AsyncStorage
    const secureToken = await SecureStore.getItemAsync("accessToken");
    const token =
      secureToken ||
      (await AsyncStorage.getItem("accessToken")) ||
      (await AsyncStorage.getItem("token")) ||
      (await AsyncStorage.getItem("userToken"));
    return {
      "Content-Type": "application/json",
      Authorization: token ? `Bearer ${token}` : "",
    };
  }

  // Notification CRUD operations
  async getNotifications(
    unreadOnly = false,
    limit = 50
  ): Promise<NotificationData[]> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(
        `${this.baseUrl}/api/notifications?unreadOnly=${unreadOnly}&limit=${limit}`,
        {
          method: "GET",
          headers,
        }
      );

      if (response.ok) {
        const result = await response.json();
        return result.success ? result.data || [] : [];
      } else {
        throw new Error(`Failed to fetch notifications: ${response.status}`);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
      throw error;
    }
  }

  async getNotificationById(id: string): Promise<NotificationData | null> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${this.baseUrl}/api/notifications/${id}`, {
        method: "GET",
        headers,
      });

      if (response.ok) {
        const result = await response.json();
        return result.success ? result.data : null;
      } else {
        throw new Error(`Failed to fetch notification: ${response.status}`);
      }
    } catch (error) {
      console.error("Error fetching notification by ID:", error);
      throw error;
    }
  }

  async markAsRead(notificationId: string): Promise<boolean> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(
        `${this.baseUrl}/api/notifications/read/${notificationId}`,
        {
          method: "POST",
          headers,
        }
      );

      if (response.ok) {
        const result = await response.json();
        return result.success;
      } else {
        throw new Error(`Failed to mark as read: ${response.status}`);
      }
    } catch (error) {
      console.error("Error marking notification as read:", error);
      throw error;
    }
  }

  async markAllAsRead(): Promise<boolean> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(
        `${this.baseUrl}/api/notifications/mark-all-read`,
        {
          method: "POST",
          headers,
        }
      );

      if (response.ok) {
        const result = await response.json();
        return result.success;
      } else {
        throw new Error(`Failed to mark all as read: ${response.status}`);
      }
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      throw error;
    }
  }

  // Subscription operations
  async subscribeToOrganizer(organizerId: string): Promise<boolean> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(
        `${this.baseUrl}/api/notifications/subscribe`,
        {
          method: "POST",
          headers,
          body: JSON.stringify({
            organizerId,
          }),
        }
      );

      if (response.ok) {
        const result = await response.json();
        return result.success;
      } else {
        throw new Error(`Failed to subscribe to organizer: ${response.status}`);
      }
    } catch (error) {
      console.error("Error subscribing to organizer:", error);
      throw error;
    }
  }

  async subscribeToPost(
    postId: string,
    title: string,
    organizerId: string,
    category?: string
  ): Promise<boolean> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(
        `${this.baseUrl}/api/notifications/subscribe`,
        {
          method: "POST",
          headers,
          body: JSON.stringify({
            organizerId,
            postId,
            title,
            category,
          }),
        }
      );

      if (response.ok) {
        const result = await response.json();
        return result.success;
      } else {
        throw new Error(`Failed to subscribe to post: ${response.status}`);
      }
    } catch (error) {
      console.error("Error subscribing to post:", error);
      throw error;
    }
  }

  async sendNotification(
    userId: string,
    title: string,
    message?: string,
    type?: string,
    referenceId?: string,
    organizerId?: string,
    category?: string
  ): Promise<NotificationData | null> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${this.baseUrl}/api/notifications/send`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          userId,
          title,
          message,
          type,
          referenceId,
          organizerId,
          category,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        return result.success ? result.data : null;
      } else {
        throw new Error(`Failed to send notification: ${response.status}`);
      }
    } catch (error) {
      console.error("Error sending notification:", error);
      throw error;
    }
  }

  // Local notification methods
  async showLocalNotification(
    title: string,
    body: string,
    data?: any
  ): Promise<string> {
    try {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: true,
        },
        trigger: null, // Show immediately
      });

      return notificationId;
    } catch (error) {
      console.error("Error showing local notification:", error);
      throw error;
    }
  }

  // Push notification token management
  async registerForPushNotifications(): Promise<string | null> {
    try {
      if (Constants.isDevice) {
        const hasPermission = await this.requestPermissions();
        if (!hasPermission) {
          console.warn("Notification permissions not granted");
          return null;
        }

        const token = (await Notifications.getExpoPushTokenAsync()).data;
        console.log("Push notification token:", token);

        // You can send this token to your backend to store for the user
        // await this.savePushToken(token);

        return token;
      } else {
        console.warn("Must use physical device for Push Notifications");
        return null;
      }
    } catch (error) {
      console.error("Error getting push notification token:", error);
      return null;
    }
  }

  // Helper methods for different notification types
  async sendLikeNotification(
    postOwnerId: string,
    postId: string,
    postTitle: string
  ): Promise<void> {
    try {
      await this.sendNotification(
        postOwnerId,
        "New Like",
        `Someone liked your post: ${postTitle}`,
        "like",
        postId
      );
    } catch (error) {
      console.error("Error sending like notification:", error);
    }
  }

  async sendCommentNotification(
    postOwnerId: string,
    postId: string,
    postTitle: string,
    comment: string
  ): Promise<void> {
    try {
      await this.sendNotification(
        postOwnerId,
        "New Comment",
        `Someone commented on your post: ${postTitle}`,
        "comment",
        postId
      );
    } catch (error) {
      console.error("Error sending comment notification:", error);
    }
  }

  async sendMessageNotification(
    receiverId: string,
    senderName: string
  ): Promise<void> {
    try {
      await this.sendNotification(
        receiverId,
        "New Message",
        `You received a message from ${senderName}`,
        "message"
      );
    } catch (error) {
      console.error("Error sending message notification:", error);
    }
  }

  async sendPostNotification(
    organizerId: string,
    postTitle: string,
    postId: string
  ): Promise<void> {
    try {
      // This would be called from the backend when a new post is created
      // The backend handles finding subscribers and sending notifications
      console.log("Post notification would be sent from backend for:", postId);
    } catch (error) {
      console.error("Error sending post notification:", error);
    }
  }

  // Notification listener setup
  setupNotificationListeners(
    onNotificationReceived?: (notification: Notifications.Notification) => void,
    onNotificationResponse?: (
      response: Notifications.NotificationResponse
    ) => void
  ) {
    // Listen for notifications while app is running
    const receivedListener = Notifications.addNotificationReceivedListener(
      (notification: any) => {
        console.log("Notification received:", notification);
        if (onNotificationReceived) {
          onNotificationReceived(notification);
        }
      }
    );

    // Listen for user interactions with notifications
    const responseListener =
      Notifications.addNotificationResponseReceivedListener((response: any) => {
        console.log("Notification response:", response);
        if (onNotificationResponse) {
          onNotificationResponse(response);
        }
      });

    // Return cleanup function
    return () => {
      receivedListener.remove();
      responseListener.remove();
    };
  }

  // Badge management
  async setBadgeCount(count: number): Promise<void> {
    try {
      await Notifications.setBadgeCountAsync(count);
    } catch (error) {
      console.error("Error setting badge count:", error);
    }
  }

  async getBadgeCount(): Promise<number> {
    try {
      return await Notifications.getBadgeCountAsync();
    } catch (error) {
      console.error("Error getting badge count:", error);
      return 0;
    }
  }

  async clearBadge(): Promise<void> {
    try {
      await Notifications.setBadgeCountAsync(0);
    } catch (error) {
      console.error("Error clearing badge:", error);
    }
  }
}

export default NotificationService.getInstance();
