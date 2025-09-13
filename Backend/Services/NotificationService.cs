using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Backend.Models;
using Backend.Settings;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using MongoDB.Driver;
using MongoDB.Driver.Linq;

namespace Backend.Services
{
    /// <summary>
    /// Service for managing notifications and subscriptions
    /// </summary>
    public class NotificationService : INotificationService
    {
        private readonly IMongoCollection<Notification> _notifications;
        private readonly IMongoCollection<Subscription> _subscriptions;
        private readonly ILogger<NotificationService> _logger;

        public NotificationService(
            IOptions<MongoDbSettings> settings, 
            IMongoClient client,
            ILogger<NotificationService> logger)
        {
            _logger = logger;
            var db = client.GetDatabase(settings.Value.DatabaseName);
            _notifications = db.GetCollection<Notification>("Notifications");
            _subscriptions = db.GetCollection<Subscription>("Subscriptions");

            try
            {
                // Create indexes if they don't exist
                var idxBuilder = Builders<Subscription>.IndexKeys;
                _subscriptions.Indexes.CreateOne(
                    new CreateIndexModel<Subscription>(
                        idxBuilder
                            .Ascending(s => s.UserId)
                            .Ascending(s => s.OrganizerId)
                            .Ascending(s => s.PostId),
                        new CreateIndexOptions { Unique = true, Sparse = true }
                    )
                );

                _notifications.Indexes.CreateOne(
                    new CreateIndexModel<Notification>(
                        Builders<Notification>
                            .IndexKeys
                            .Ascending(n => n.UserId)
                            .Descending(n => n.CreatedAt)
                    )
                );

                _logger.LogInformation("Notification service initialized with database indexes");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error initializing notification service");
                throw;
            }
        }

        // --------------------
        // Notification Operations
        // --------------------
        
        /// <summary>
        /// Get all notifications for a user
        /// </summary>
        public async Task<List<Notification>> GetByUserAsync(string userId, int limit = 0, bool unreadOnly = false)
        {
            if (string.IsNullOrEmpty(userId))
                throw new ArgumentException("User ID cannot be null or empty", nameof(userId));

            try
            {
                var filter = Builders<Notification>.Filter.Eq(n => n.UserId, userId);
                
                if (unreadOnly)
                {
                    filter &= Builders<Notification>.Filter.Eq(n => n.IsRead, false);
                }

                var sort = Builders<Notification>.Sort.Descending(n => n.CreatedAt);
                
                var query = _notifications.Find(filter).Sort(sort);
                
                if (limit > 0)
                {
                    query = query.Limit(limit);
                }
                
                return await query.ToListAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error getting notifications for user {userId}", userId);
                throw;
            }
        }

        /// <summary>
        /// Get a notification by its ID
        /// </summary>
        public async Task<Notification?> GetByIdAsync(string id)
        {
            if (string.IsNullOrEmpty(id))
                throw new ArgumentException("Notification ID cannot be null or empty", nameof(id));

            _logger.LogDebug("Looking up notification with ID: {NotificationId}", id);

            try
            {
                // First try exact match with the string ID
                var stringFilter = Builders<Notification>.Filter.Eq(n => n.Id, id);
                var notification = await _notifications.Find(stringFilter).FirstOrDefaultAsync();
                
                if (notification != null)
                {
                    _logger.LogDebug("Found notification using direct string ID match");
                    return notification;
                }

                _logger.LogDebug("Notification not found with direct string ID match, trying ObjectId conversion");

                // If not found and the ID is a valid ObjectId, try with ObjectId comparison
                if (MongoDB.Bson.ObjectId.TryParse(id, out var objectId))
                {
                    var objectIdFilter = Builders<Notification>.Filter.Eq("_id", objectId);
                    notification = await _notifications.Find(objectIdFilter).FirstOrDefaultAsync();

                    if (notification != null)
                    {
                        _logger.LogDebug("Found notification using ObjectId conversion");
                        return notification;
                    }
                }
                
                // If still not found, try a case-insensitive search as a last resort
                var allNotifications = await _notifications.Find(_ => true).ToListAsync();
                notification = allNotifications.FirstOrDefault(n => 
                    string.Equals(n.Id, id, StringComparison.OrdinalIgnoreCase));

                if (notification != null)
                {
                    _logger.LogDebug("Found notification using case-insensitive search");
                    return notification;
                }

                _logger.LogWarning("Notification with ID {NotificationId} not found after multiple search attempts", id);
                _logger.LogDebug("Available notification IDs: {NotificationIds}", 
                    string.Join(", ", allNotifications.Select(n => n.Id)));
                
                return null;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting notification by ID {NotificationId}", id);
                throw;
            }
        }

        /// <summary>
        /// Create a new notification
        /// </summary>
        public async Task<Notification> CreateNotificationAsync(
            string userId, 
            string? organizerId, 
            string? category, 
            string title, 
            string? message = null,
            string? type = null,
            string? referenceId = null,
            string? fromUserId = null)
        {
            if (string.IsNullOrEmpty(userId))
                throw new ArgumentException("User ID cannot be null or empty", nameof(userId));
            
            if (string.IsNullOrEmpty(title))
                throw new ArgumentException("Title cannot be null or empty", nameof(title));

            try
            {
                _logger.LogInformation("Creating notification for user {UserId} with title: {Title}", userId, title);
                _logger.LogDebug("Notification details - OrganizerId: {OrganizerId}, Category: {Category}, Type: {Type}", 
                    organizerId, category, type);

                var notification = new Notification
                {
                    UserId = userId,
                    OrganizerId = organizerId,
                    Category = category,
                    Title = title,
                    Message = message,
                    Type = type ?? "info",
                    ReferenceId = referenceId,
                    FromUserId = fromUserId,
                    IsRead = false,
                    CreatedAt = DateTime.UtcNow
                };

                _logger.LogDebug("Attempting to insert notification into database");
                await _notifications.InsertOneAsync(notification);
                _logger.LogInformation("Successfully created notification with ID {NotificationId} for user {UserId}", 
                    notification.Id, userId);
                
                return notification;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating notification for user {UserId}", userId);
                throw;
            }
        }

        /// <summary>
        /// Create a notification from a notification object
        /// </summary>
        public async Task<Notification> CreateAsync(Notification notification)
        {
            if (notification == null)
                throw new ArgumentNullException(nameof(notification));

            try
            {
                // Set timestamps
                notification.CreatedAt = DateTime.UtcNow;
                notification.UpdatedAt = DateTime.UtcNow;

                // Set default type if not specified
                notification.Type ??= "info";

                await _notifications.InsertOneAsync(notification);
                _logger.LogInformation($"Created notification {notification.Id} for user {notification.UserId}");
                return notification;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error creating notification: {ex.Message}");
                throw;
            }
        }

        public async Task<Notification> CreateEventNotificationAsync(
            string userId,
            string eventId,
            string title,
            string message,
            string? fromUserId = null,
            string? organizerId = null)
        {
            return await CreateNotificationAsync(
                userId: userId,
                organizerId: organizerId,
                category: "event",
                title: title,
                message: message,
                type: "info",
                referenceId: eventId,
                fromUserId: fromUserId
            );
        }

        /// <summary>
        /// Mark a notification as read
        /// </summary>
        public async Task MarkAsReadAsync(string notificationId)
        {
            if (string.IsNullOrEmpty(notificationId))
                throw new ArgumentException("Notification ID cannot be null or empty", nameof(notificationId));

            try
            {
                var update = Builders<Notification>
                    .Update
                    .Set(n => n.IsRead, true)
                    .Set(n => n.UpdatedAt, DateTime.UtcNow);

                var result = await _notifications.UpdateOneAsync(
                    n => n.Id == notificationId,
                    update);

                if (result.MatchedCount == 0)
                {
                    _logger.LogWarning("Notification with ID {NotificationId} not found", notificationId);
                    throw new KeyNotFoundException($"Notification with ID {notificationId} not found");
                }

                _logger.LogDebug("Marked notification {NotificationId} as read", notificationId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error marking notification {NotificationId} as read", notificationId);
                throw;
            }
        }

        /// <summary>
        /// Mark all notifications as read for a user
        /// </summary>
        public async Task MarkAllAsReadAsync(string userId)
        {
            if (string.IsNullOrEmpty(userId))
                throw new ArgumentException("User ID cannot be null or empty", nameof(userId));

            try
            {
                var update = Builders<Notification>
                    .Update
                    .Set(n => n.IsRead, true)
                    .Set(n => n.UpdatedAt, DateTime.UtcNow);

                var result = await _notifications.UpdateManyAsync(
                    n => n.UserId == userId && !n.IsRead,
                    update);

                _logger.LogInformation("Marked {Count} notifications as read for user {UserId}", 
                    result.ModifiedCount, userId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error marking all notifications as read for user {UserId}", userId);
                throw;
            }
        }

        // --------------------
        // Subscription Operations
        // --------------------

        /// <summary>
        /// Subscribe to an organizer's notifications
        /// </summary>
        public async Task SubscribeToOrganizerAsync(string userId, string organizerId)
        {
            if (string.IsNullOrEmpty(userId))
                throw new ArgumentException("User ID cannot be null or empty", nameof(userId));
            if (string.IsNullOrEmpty(organizerId))
                throw new ArgumentException("Organizer ID cannot be null or empty", nameof(organizerId));

            try
            {
                var existing = await _subscriptions.Find(s =>
                    s.UserId == userId &&
                    s.OrganizerId == organizerId &&
                    s.PostId == null)
                    .FirstOrDefaultAsync();

                if (existing != null)
                {
                    // Update existing subscription if it was inactive
                    if (!existing.IsActive)
                    {
                        var update = Builders<Subscription>.Update
                            .Set(s => s.IsActive, true)
                            .Set(s => s.UpdatedAt, DateTime.UtcNow);
                        
                        await _subscriptions.UpdateOneAsync(
                            s => s.Id == existing.Id,
                            update);
                        
                        _logger.LogInformation("Reactivated subscription for user {UserId} to organizer {OrganizerId}", 
                            userId, organizerId);
                    }
                    return;
                }

                var subscription = new Subscription
                {
                    UserId = userId,
                    OrganizerId = organizerId,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                };

                await _subscriptions.InsertOneAsync(subscription);
                _logger.LogInformation("User {UserId} subscribed to organizer {OrganizerId}", userId, organizerId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error subscribing user {UserId} to organizer {OrganizerId}", userId, organizerId);
                throw;
            }
        }

        /// <summary>
        /// Subscribe to a specific post's notifications
        /// </summary>
        public async Task SubscribeToPostAsync(string userId, string postId, string title, string organizerId, string? category = null)
        {
            if (string.IsNullOrEmpty(userId))
                throw new ArgumentException("User ID cannot be null or empty", nameof(userId));
            if (string.IsNullOrEmpty(postId))
                throw new ArgumentException("Post ID cannot be null or empty", nameof(postId));
            if (string.IsNullOrEmpty(title))
                throw new ArgumentException("Title cannot be null or empty", nameof(title));
            if (string.IsNullOrEmpty(organizerId))
                throw new ArgumentException("Organizer ID cannot be null or empty", nameof(organizerId));

            try
            {
                var existing = await _subscriptions.Find(s =>
                    s.UserId == userId &&
                    s.PostId == postId).FirstOrDefaultAsync();

                if (existing != null)
                {
                    _logger.LogDebug("User {UserId} is already subscribed to post {PostId}", userId, postId);
                    return;
                }

                var subscription = new Subscription
                {
                    UserId = userId,
                    PostId = postId,
                    Title = title,
                    OrganizerId = organizerId,
                    Category = category,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                };

                await _subscriptions.InsertOneAsync(subscription);
                _logger.LogInformation("User {UserId} subscribed to post {PostId}", userId, postId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error subscribing user {UserId} to post {PostId}", userId, postId);
                throw;
            }
        }

        /// <summary>
        /// Get all subscriptions for an organizer
        /// </summary>
        public async Task<IEnumerable<Subscription>> GetSubscriptionsAsync(string organizerId, string? category = null)
        {
            if (string.IsNullOrEmpty(organizerId))
                throw new ArgumentException("Organizer ID cannot be null or empty", nameof(organizerId));

            try
            {
                var filter = Builders<Subscription>.Filter.Eq(s => s.OrganizerId, organizerId);
                
                if (!string.IsNullOrEmpty(category))
                {
                    var catFilter = Builders<Subscription>.Filter.Eq(s => s.Category, category);
                    filter = Builders<Subscription>.Filter.And(filter, catFilter);
                }

                var subscriptions = await _subscriptions.Find(filter).ToListAsync();
                _logger.LogDebug("Found {Count} subscriptions for organizer {OrganizerId}", subscriptions.Count, organizerId);
                
                return subscriptions;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting subscriptions for organizer {OrganizerId}", organizerId);
                throw;
            }
        }

        /// <summary>
        /// Get a user's subscriptions
        /// </summary>
        public async Task<List<Subscription>> GetUserSubscriptionsAsync(string userId, bool includeInactive = false)
        {
            if (string.IsNullOrEmpty(userId))
                throw new ArgumentException("User ID cannot be null or empty", nameof(userId));

            try
            {
                var filter = Builders<Subscription>.Filter.Eq(s => s.UserId, userId);
                
                if (!includeInactive)
                {
                    filter &= Builders<Subscription>.Filter.Eq(s => s.IsActive, true);
                }

                return await _subscriptions.Find(filter)
                    .SortByDescending(s => s.CreatedAt)
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting subscriptions for user {UserId}", userId);
                throw;
            }
        }

        /// <summary>
        /// Unsubscribe from a specific subscription
        /// </summary>
        public async Task<bool> UnsubscribeAsync(string subscriptionId)
        {
            if (string.IsNullOrEmpty(subscriptionId))
                throw new ArgumentException("Subscription ID cannot be null or empty", nameof(subscriptionId));

            try
            {
                var update = Builders<Subscription>.Update
                    .Set(s => s.IsActive, false)
                    .Set(s => s.UpdatedAt, DateTime.UtcNow);

                var result = await _subscriptions.UpdateOneAsync(
                    s => s.Id == subscriptionId,
                    update);

                if (result.MatchedCount == 0)
                {
                    _logger.LogWarning("Subscription with ID {SubscriptionId} not found", subscriptionId);
                    return false;
                }

                _logger.LogInformation("Unsubscribed from subscription {SubscriptionId}", subscriptionId);
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error unsubscribing from subscription {SubscriptionId}", subscriptionId);
                throw;
            }
        }

        /// <summary>
        /// Send notifications to all subscribers of a new post
        /// </summary>
        public async Task SendNotificationsForNewPostAsync(string postId, string organizerId, string title, string? message = null, string? fromUserId = null)
        {
            try
            {
                // Find subscriptions that match:
                // - exact post subscription (PostId)
                // - title subscription (Title)
                // - organizer subscription (OrganizerId)
                var filters = new List<FilterDefinition<Subscription>>();

                filters.Add(Builders<Subscription>.Filter.Eq(s => s.PostId, postId));
                filters.Add(Builders<Subscription>.Filter.Eq(s => s.Title, title));
                filters.Add(Builders<Subscription>.Filter.And(
                    Builders<Subscription>.Filter.Eq(s => s.OrganizerId, organizerId),
                    Builders<Subscription>.Filter.Eq(s => s.PostId, null)
                ));

                var combined = Builders<Subscription>.Filter.And(
                    Builders<Subscription>.Filter.Or(filters),
                    Builders<Subscription>.Filter.Eq(s => s.IsActive, true)
                );

                var subs = await _subscriptions.Find(combined).ToListAsync();

                // De-duplicate subscribers
                var uniqueUserIds = subs.Select(s => s.UserId).Distinct();
                foreach (var userId in uniqueUserIds)
                {
                    var notif = new Notification
                    {
                        UserId = userId,
                        OrganizerId = organizerId,
                        Category = subs.FirstOrDefault(s => s.UserId == userId)?.Category,
                        Title = title,
                        Message = message,
                        ReferenceId = postId,
                        FromUserId = fromUserId,
                        Type = "post",
                        IsRead = false,
                        CreatedAt = DateTime.UtcNow
                    };

                    await _notifications.InsertOneAsync(notif);
                }

                _logger.LogInformation("Sent notifications for new post {PostId} to {Count} users", postId, uniqueUserIds.Count());
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error sending notifications for new post {PostId}", postId);
                throw;
            }
        }

        /// <summary>
        /// Send notification for likes
        /// </summary>
        public async Task SendLikeNotificationAsync(string postOwnerId, string likerUserId, string postId, string postTitle)
        {
            try
            {
                var notification = new Notification
                {
                    UserId = postOwnerId,
                    Title = "New Like",
                    Message = $"Someone liked your post: {postTitle}",
                    Type = "like",
                    ReferenceId = postId,
                    FromUserId = likerUserId,
                    IsRead = false,
                    CreatedAt = DateTime.UtcNow
                };

                await _notifications.InsertOneAsync(notification);
                _logger.LogInformation("Sent like notification for post {PostId}", postId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error sending like notification for post {PostId}", postId);
                throw;
            }
        }

        /// <summary>
        /// Send notification for comments
        /// </summary>
        public async Task SendCommentNotificationAsync(string postOwnerId, string commenterUserId, string postId, string postTitle, string comment)
        {
            try
            {
                var notification = new Notification
                {
                    UserId = postOwnerId,
                    Title = "New Comment",
                    Message = $"Someone commented on your post: {postTitle}",
                    Type = "comment",
                    ReferenceId = postId,
                    FromUserId = commenterUserId,
                    Content = comment,
                    IsRead = false,
                    CreatedAt = DateTime.UtcNow
                };

                await _notifications.InsertOneAsync(notification);
                _logger.LogInformation("Sent comment notification for post {PostId}", postId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error sending comment notification for post {PostId}", postId);
                throw;
            }
        }

        /// <summary>
        /// Send notification for new messages
        /// </summary>
        public async Task SendMessageNotificationAsync(string receiverId, string senderId, string messageContent)
        {
            try
            {
                var notification = new Notification
                {
                    UserId = receiverId,
                    Title = "New Message",
                    Message = "You have received a new message",
                    Type = "message",
                    FromUserId = senderId,
                    Content = messageContent,
                    IsRead = false,
                    CreatedAt = DateTime.UtcNow
                };

                await _notifications.InsertOneAsync(notification);
                _logger.LogInformation("Sent message notification to user {UserId}", receiverId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error sending message notification to user {UserId}", receiverId);
                throw;
            }
        }

        // Legacy methods for backward compatibility
        [Obsolete("Use MarkAsReadAsync instead")]
        public Task MarkReadAsync(string notificationId) => MarkAsReadAsync(notificationId);

        [Obsolete("Use SubscribeToOrganizerAsync or SubscribeToPostAsync instead")]
        public Task SubscribeAsync(string userId, string organizerId, string category) => SubscribeToOrganizerAsync(userId, organizerId);

        [Obsolete("Use GetByUserAsync instead")]
        public Task<List<Notification>> GetUserNotificationsAsync(string userId) => GetByUserAsync(userId);

        public Task SendMessageNotificationAsync(string receiverId, string senderId, object? messageContent)
        {
            throw new NotImplementedException();
        }

    }
}