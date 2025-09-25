using Backend.Models;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Backend.Services
{
    /// <summary>
    /// Service for managing notifications and subscriptions
    /// </summary>
    public interface INotificationService
    {
        #region Notification Operations

        /// <summary>
        /// Get notifications for a specific user
        /// </summary>
        /// <param name="userId">ID of the user</param>
        /// <param name="limit">Maximum number of notifications to return (0 for no limit)</param>
        /// <param name="unreadOnly">Whether to return only unread notifications</param>
        /// <returns>List of notifications</returns>
        Task<List<Notification>> GetByUserAsync(string userId, int limit = 0, bool unreadOnly = false);

        /// <summary>
        /// Get a notification by its ID
        /// </summary>
        /// <param name="id">Notification ID</param>
        /// <returns>The notification or null if not found</returns>
        Task<Notification?> GetByIdAsync(string id);

        /// <summary>
        /// Create a new notification
        /// </summary>
        Task<Notification> CreateNotificationAsync(
            string userId,
            string? organizerId,
            string? category,
            string title,
            string? message = null,
            string? type = null,
            string? referenceId = null,
            string? fromUserId = null);

        /// <summary>
        /// Create a notification from a notification object
        /// </summary>
        Task<Notification> CreateAsync(Notification notification);

        /// <summary>
        /// Mark a notification as read
        /// </summary>
        /// <param name="notificationId">ID of the notification to mark as read</param>
        Task MarkAsReadAsync(string notificationId);

        /// <summary>
        /// Mark all notifications as read for a user
        /// </summary>
        /// <param name="userId">ID of the user</param>
        Task MarkAllAsReadAsync(string userId);

        #endregion

        #region Subscription Operations

        /// <summary>
        /// Subscribe a user to an organizer's notifications
        /// </summary>
        Task SubscribeToOrganizerAsync(string userId, string organizerId);

        /// <summary>
        /// Subscribe a user to a specific post's notifications
        /// </summary>
        Task SubscribeToPostAsync(string userId, string postId, string title, string organizerId, string? category = null);

        /// <summary>
        /// Configure notifications for future posts from an organizer that match a specific title (no postId required)
        /// </summary>
        Task SubscribeToTitleAsync(string userId, string title, string organizerId, string? category = null);

        /// <summary>
        /// Disable title-based notifications configured for an organizer/title pair
        /// </summary>
        Task<bool> UnsubscribeTitleAsync(string userId, string title, string organizerId);

        /// <summary>
        /// Check if the user is subscribed (active) to a title-based configuration for an organizer/title
        /// </summary>
        Task<bool> IsTitleSubscribedAsync(string userId, string organizerId, string title);

        /// <summary>
        /// Get all subscriptions for an organizer (and optionally filtered by category)
        /// </summary>
        Task<IEnumerable<Subscription>> GetSubscriptionsAsync(string organizerId, string? category = null);

        /// <summary>
        /// Get a user's subscriptions
        /// </summary>
        /// <param name="userId">ID of the user</param>
        /// <param name="includeInactive">Whether to include inactive subscriptions</param>
        /// <returns>List of subscriptions</returns>
        Task<List<Subscription>> GetUserSubscriptionsAsync(string userId, bool includeInactive = false);

        /// <summary>
        /// Unsubscribe from a specific subscription
        /// </summary>
        /// <param name="subscriptionId">ID of the subscription to remove</param>
        /// <returns>True if the subscription was found and removed</returns>
        Task<bool> UnsubscribeAsync(string subscriptionId);

        /// <summary>
        /// Disable all active subscriptions for the given user
        /// </summary>
        Task UnsubscribeAllForUserAsync(string userId);

        #endregion

        #region Notification Sending

        /// <summary>
        /// Send notifications to all subscribers of a new post
        /// </summary>
        Task SendNotificationsForNewPostAsync(
            string postId,
            string organizerId,
            string title,
            string? message = null,
            string? fromUserId = null);

        #endregion

        #region Legacy Methods (Kept for backward compatibility)

        /// <summary>
        /// Legacy method - use MarkAsReadAsync instead
        /// </summary>
        [Obsolete("Use MarkAsReadAsync instead")]
        Task MarkReadAsync(string notificationId);

        /// <summary>
        /// Legacy method - use SubscribeToOrganizerAsync or SubscribeToPostAsync instead
        /// </summary>
        [Obsolete("Use SubscribeToOrganizerAsync or SubscribeToPostAsync instead")]
        Task SubscribeAsync(string userId, string organizerId, string category);

        /// <summary>
        /// Legacy method - use GetByUserAsync instead
        /// </summary>
        [Obsolete("Use GetByUserAsync instead")]
        Task<List<Notification>> GetUserNotificationsAsync(string userId);
        Task SendMessageNotificationAsync(string receiverId, string senderId, object? messageContent);
        Task SendCommentNotificationAsync(string postOwnerId, string commenterUserId, string postId, string postTitle, string comment);
        Task SendLikeNotificationAsync(string postOwnerId, string likerUserId, string postId, string postTitle);

        #endregion
    }
}
