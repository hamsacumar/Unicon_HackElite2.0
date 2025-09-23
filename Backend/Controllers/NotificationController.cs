using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Security.Claims;
using System.Threading.Tasks;
using MongoDB.Driver;
using Backend.Models;
using Backend.Models.Dtos;
using Backend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;
using Hackelite2._0.Hubs;

namespace Backend.Controllers
{
    /// <summary>
    /// API endpoints for managing user notifications
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    [Produces("application/json")]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public class NotificationsController : ControllerBase
    {
        /// <summary>
        /// [DEBUG] Test MongoDB connection
        /// </summary>
        [HttpGet("debug/test-connection")]
        [ApiExplorerSettings(IgnoreApi = true)]
        public async Task<IActionResult> TestMongoConnection()
        {
            try
            {
                var databaseName = _configuration["MongoDbSettings:DatabaseName"] ?? "Hackelite";
                var client = new MongoClient(_configuration["MongoDbSettings:ConnectionString"]);
                
                // Test connection by listing databases
                var databases = await client.ListDatabaseNames().ToListAsync();
                
                // Get notifications collection
                var database = client.GetDatabase(databaseName);
                var collection = database.GetCollection<Notification>("Notifications");
                var count = await collection.CountDocumentsAsync(FilterDefinition<Notification>.Empty);
                
                // Get sample notifications
                var sample = await collection.Find(_ => true)
                    .Limit(5)
                    .Project(n => new { n.Id, n.Title, n.UserId, n.CreatedAt })
                    .ToListAsync();
                
                return Ok(new 
                { 
                    success = true,
                    database = databaseName,
                    availableDatabases = databases,
                    notificationCount = count,
                    sampleNotifications = sample,
                    connectionString = _configuration["MongoDbSettings:ConnectionString"]
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error testing Mongo connection");
                return StatusCode(500, new 
                { 
                    success = false, 
                    error = ex.Message, 
                    details = ex.ToString(),
                    connectionString = _configuration["MongoDbSettings:ConnectionString"]
                });
            }
        }

        /// <summary>
        /// Check if the authenticated user has an active title-based configuration for an organizer/title
        /// </summary>
        [HttpGet("is-title-configured")]
        [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
        public async Task<IActionResult> IsTitleConfigured([FromQuery] string organizerId, [FromQuery] string title)
        {
            try
            {
                var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized(new ApiResponse<object>(false, "User not authenticated", null));
                }

                if (string.IsNullOrEmpty(organizerId) || string.IsNullOrEmpty(title))
                {
                    return BadRequest(new ApiResponse<object>(false, "OrganizerId and Title are required", null));
                }

                var isConfigured = await _notificationService.IsTitleSubscribedAsync(userId, organizerId, title);
                return Ok(new ApiResponse<object>(true, "OK", new { isConfigured }));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking title configuration");
                return StatusCode(StatusCodes.Status500InternalServerError,
                    new ApiResponse<object>(false, "An error occurred while checking title configuration", null));
            }
        }
        
        /// <summary>
        /// [DEBUG] List all notifications in the database
        /// </summary>
        [HttpGet("debug/all-notifications")]
        [ApiExplorerSettings(IgnoreApi = true)]
        public async Task<IActionResult> GetAllNotifications()
        {
            try
            {
                var collection = _mongoDatabase.GetCollection<Notification>("Notifications");
                var notifications = await collection.Find(_ => true)
                    .Project(n => new 
                    { 
                        n.Id, 
                        n.Title, 
                        n.UserId, 
                        n.IsRead, 
                        n.CreatedAt,
                        n.ReferenceId,
                        n.Type,
                        n.Category
                    })
                    .ToListAsync();
                    
                return Ok(new 
                { 
                    success = true,
                    count = notifications.Count,
                    notifications = notifications
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving all notifications");
                return StatusCode(500, new 
                { 
                    success = false, 
                    error = ex.Message, 
                    details = ex.ToString()
                });
            }
        }
        
        private readonly INotificationService _notificationService;
        private readonly IHubContext<NotificationHub> _hubContext;
        private readonly ILogger<NotificationsController> _logger;
        private readonly IConfiguration _configuration;
        private readonly IMongoDatabase _mongoDatabase;

        public NotificationsController(
            INotificationService notificationService, 
            IHubContext<NotificationHub> hubContext,
            ILogger<NotificationsController> logger,
            IConfiguration configuration,
            IMongoClient mongoClient)
        {
            _notificationService = notificationService ?? throw new ArgumentNullException(nameof(notificationService));
            _hubContext = hubContext ?? throw new ArgumentNullException(nameof(hubContext));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
            _configuration = configuration ?? throw new ArgumentNullException(nameof(configuration));
            
            // Get database name from configuration
            var databaseName = _configuration["MongoDbSettings:DatabaseName"] ?? "Hackelite";
            _mongoDatabase = mongoClient.GetDatabase(databaseName);
        }

        /// <summary>
        /// Get all notifications for the authenticated user
        /// </summary>
        /// <param name="unreadOnly">If true, returns only unread notifications</param>
        /// <param name="limit">Maximum number of notifications to return (0 for no limit)</param>
        /// <returns>List of notifications</returns>
        [HttpGet]
        [ProducesResponseType(typeof(ApiResponse<IEnumerable<Notification>>), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetMyNotifications(
            [FromQuery] bool unreadOnly = false,
            [FromQuery][Range(0, 1000)] int limit = 50)
        {
            try
            {
                var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized(new ApiResponse<object>(false, "User not authenticated", null));
                }

                var notifications = await _notificationService.GetByUserAsync(userId, limit, unreadOnly);

                // Read-time enrichment for older notifications missing organizer/author/post image
                var db = _mongoDatabase;
                var users = db.GetCollection<AppUser>("Users");
                var events = db.GetCollection<EventModel>("events");

                foreach (var n in notifications)
                {
                    try
                    {
                        // Enrich organizer via explicit OrganizerId or fallback to post owner
                        if (string.IsNullOrEmpty(n.OrganizerName))
                        {
                            AppUser? organizerUser = null;
                            if (!string.IsNullOrEmpty(n.OrganizerId))
                            {
                                organizerUser = await users.Find(u => u.Id == n.OrganizerId).FirstOrDefaultAsync();
                            }
                            if (organizerUser == null && !string.IsNullOrEmpty(n.ReferenceId))
                            {
                                var ev = await events.Find(e => e.Id == n.ReferenceId).FirstOrDefaultAsync();
                                if (ev != null && !string.IsNullOrEmpty(ev.UserId))
                                {
                                    organizerUser = await users.Find(u => u.Id == ev.UserId).FirstOrDefaultAsync();
                                    n.OrganizerId ??= ev.UserId;
                                }
                            }
                            if (organizerUser != null)
                            {
                                n.OrganizerName = string.IsNullOrWhiteSpace(organizerUser.Username)
                                    ? (string.Join(" ", new[] { organizerUser.FirstName, organizerUser.LastName }.Where(s => !string.IsNullOrWhiteSpace(s)))?.Trim())
                                    : organizerUser.Username;
                                n.OrganizerAvatarUrl = organizerUser.ProfileImageUrl;
                            }
                        }

                        // Ensure author fields are present when FromUserId exists
                        if (string.IsNullOrEmpty(n.AuthorName) && !string.IsNullOrEmpty(n.FromUserId))
                        {
                            var author = await users.Find(u => u.Id == n.FromUserId).FirstOrDefaultAsync();
                            if (author != null)
                            {
                                n.AuthorName = string.IsNullOrWhiteSpace(author.Username)
                                    ? (string.Join(" ", new[] { author.FirstName, author.LastName }.Where(s => !string.IsNullOrWhiteSpace(s)))?.Trim())
                                    : author.Username;
                                n.AuthorAvatarUrl = author.ProfileImageUrl;
                            }
                        }

                        // Ensure post image is present using referenceId (post/event id)
                        if (string.IsNullOrEmpty(n.PostImageUrl) && !string.IsNullOrEmpty(n.ReferenceId))
                        {
                            var ev = await events.Find(e => e.Id == n.ReferenceId).FirstOrDefaultAsync();
                            if (ev != null)
                            {
                                n.PostImageUrl = ev.ImageUrl;
                            }
                        }

                        // Make media URLs absolute
                        string BaseUrl()
                        {
                            var request = HttpContext?.Request;
                            if (request == null) return string.Empty;
                            return $"{request.Scheme}://{request.Host.Value}";
                        }
                        string MakeAbsolute(string? url)
                        {
                            if (string.IsNullOrWhiteSpace(url)) return url ?? string.Empty;
                            if (url.StartsWith("http://", StringComparison.OrdinalIgnoreCase) ||
                                url.StartsWith("https://", StringComparison.OrdinalIgnoreCase))
                            {
                                return url;
                            }
                            var baseUrl = BaseUrl();
                            if (string.IsNullOrEmpty(baseUrl)) return url;
                            return url.StartsWith("/") ? baseUrl + url : baseUrl + "/" + url;
                        }

                        n.OrganizerAvatarUrl = MakeAbsolute(n.OrganizerAvatarUrl);
                        n.PostImageUrl = MakeAbsolute(n.PostImageUrl);
                        n.AuthorAvatarUrl = MakeAbsolute(n.AuthorAvatarUrl);
                    }
                    catch (Exception enrichEx)
                    {
                        _logger.LogDebug(enrichEx, "Read-time notification enrichment failed for {NotificationId}", n.Id);
                    }
                }

                return Ok(new ApiResponse<IEnumerable<Notification>>(true, "Notifications retrieved successfully", notifications));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving notifications for user");
                return StatusCode(StatusCodes.Status500InternalServerError, 
                    new ApiResponse<object>(false, "An error occurred while retrieving notifications", null));
            }
        }

        /// <summary>
        /// Get a specific notification by ID
        /// </summary>
        /// <param name="id">Notification ID</param>
        [HttpGet("{id}")]
        [ProducesResponseType(typeof(ApiResponse<Notification>), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetNotification(string id)
        {
            _logger.LogInformation("GetNotification called with ID: {NotificationId}", id);
            
            try
            {
                // Log MongoDB connection info for debugging
                var connectionString = _configuration["MongoDbSettings:ConnectionString"];
                var databaseName = _configuration["MongoDbSettings:DatabaseName"] ?? "Hackelite";
                _logger.LogDebug("MongoDB Connection - Database: {DatabaseName}, Connection String: {ConnectionString}", 
                    databaseName, connectionString);
                
                var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (string.IsNullOrEmpty(userId))
                {
                    _logger.LogWarning("Unauthorized attempt to access notification {NotificationId}", id);
                    return Unauthorized(new ApiResponse<object>(false, "User not authenticated", null));
                }

                _logger.LogDebug("Fetching notification {NotificationId} for user {UserId}", id, userId);
                
                // Try to get the notification directly from MongoDB for debugging
                var collection = _mongoDatabase.GetCollection<Notification>("Notifications");
                var directNotification = await collection.Find(n => n.Id == id).FirstOrDefaultAsync();
                _logger.LogDebug("Direct MongoDB query found notification: {Found}", directNotification != null);
                
                // Also try with the service
                var notification = await _notificationService.GetByIdAsync(id);
                
                if (notification == null && directNotification != null)
                {
                    _logger.LogWarning("Notification found in direct query but not through service. Possible ID mapping issue.");
                    notification = directNotification;
                }
                
                if (notification == null)
                {
                    _logger.LogWarning("Notification {NotificationId} not found in database. Checking for case sensitivity issues...", id);
                    
                    // Try case-insensitive search as a last resort
                    var allNotifications = await collection.Find(_ => true).ToListAsync();
                    var matchedNotification = allNotifications.FirstOrDefault(n => 
                        string.Equals(n.Id, id, StringComparison.OrdinalIgnoreCase));
                        
                    if (matchedNotification != null)
                    {
                        _logger.LogWarning("Found notification with case-insensitive ID match. Original ID: {OriginalId}, Matched ID: {MatchedId}", 
                            id, matchedNotification.Id);
                        notification = matchedNotification;
                    }
                    else
                    {
                        _logger.LogWarning("Notification {NotificationId} not found after case-insensitive search. Total notifications in DB: {Count}", 
                            id, allNotifications.Count);
                        return NotFound(new ApiResponse<object>(false, "Notification not found", new { 
                            notificationId = id,
                            totalNotifications = allNotifications.Count,
                            sampleIds = allNotifications.Take(5).Select(n => n.Id).ToList()
                        }));
                    }
                }
                
                if (notification.UserId != userId)
                {
                    _logger.LogWarning("User {UserId} attempted to access notification {NotificationId} owned by user {NotificationUserId}", 
                        userId, id, notification.UserId);
                    return NotFound(new ApiResponse<object>(false, "Notification not found", null));
                }

                _logger.LogInformation("Successfully retrieved notification {NotificationId} for user {UserId}", id, userId);
                return Ok(new ApiResponse<Notification>(true, "Notification retrieved successfully", notification));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving notification with ID {NotificationId}", id);
                return StatusCode(StatusCodes.Status500InternalServerError, 
                    new ApiResponse<object>(false, "An error occurred while retrieving the notification", new {
                        error = ex.Message,
                        details = ex.ToString(),
                        notificationId = id
                    }));
            }
        }

        /// <summary>
        /// Mark a notification as read
        /// </summary>
        /// <param name="id">Notification ID to mark as read</param>
        [HttpPost("read/{id}")]
        [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> MarkAsRead(string id)
        {
            try
            {
                var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized(new ApiResponse<object>(false, "User not authenticated", null));
                }

                // Verify the notification belongs to the user
                var notification = await _notificationService.GetByIdAsync(id);
                if (notification == null || notification.UserId != userId)
                {
                    return NotFound(new ApiResponse<object>(false, "Notification not found", null));
                }

                await _notificationService.MarkAsReadAsync(id);
                
                // Notify the client via SignalR
                await _hubContext.Clients.User(userId).SendAsync("NotificationRead", id);
                
                return Ok(new ApiResponse<object>(true, "Notification marked as read", null));
            }
            catch (KeyNotFoundException)
            {
                return NotFound(new ApiResponse<object>(false, "Notification not found", null));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error marking notification {id} as read");
                return StatusCode(StatusCodes.Status500InternalServerError, 
                    new ApiResponse<object>(false, "An error occurred while marking the notification as read", null));
            }
        }

        /// <summary>
        /// Mark all notifications as read for the authenticated user
        /// </summary>
        [HttpPost("mark-all-read")]
        [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> MarkAllAsRead()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
            {
                _logger.LogWarning("Unauthorized attempt to mark notifications as read");
                return Unauthorized(new ApiResponse<object>(false, "User not authenticated", null));
            }

            try
            {
                _logger.LogInformation("Marking all notifications as read for user {UserId}", userId);
                await _notificationService.MarkAllAsReadAsync(userId);
                
                // Notify the client via SignalR
                try 
                {
                    await _hubContext.Clients.User(userId).SendAsync("AllNotificationsRead");
                    _logger.LogDebug("Sent SignalR notification for user {UserId}", userId);
                }
                catch (Exception signalREx)
                {
                    // Don't fail the request if SignalR fails, but log it
                    _logger.LogWarning(signalREx, "Failed to send SignalR notification for user {UserId}", userId);
                }
                
                _logger.LogInformation("Successfully marked all notifications as read for user {UserId}", userId);
                return Ok(new ApiResponse<object>(true, "All notifications marked as read", null));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error marking all notifications as read for user {UserId}", userId);
                return StatusCode(StatusCodes.Status500InternalServerError, 
                    new ApiResponse<object>(false, "An error occurred while marking notifications as read", null));
            }
        }

        /// <summary>
        /// Subscribe to notifications from an organizer/category
        /// </summary>
        /// <param name="request">Subscription details</param>
        [HttpPost("subscribe")]
        [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        public async Task<IActionResult> Subscribe([FromBody] SubscribeRequest request)
        {
            try
            {
                var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized(new ApiResponse<object>(false, "User not authenticated", null));
                }

                if (request == null)
                {
                    return BadRequest(new ApiResponse<object>(false, "Request cannot be null", null));
                }

                if (string.IsNullOrEmpty(request.OrganizerId))
                {
                    return BadRequest(new ApiResponse<object>(false, "Organizer ID is required", null));
                }

                if (!string.IsNullOrEmpty(request.PostId))
                {
                    // Subscribe to a specific post
                    await _notificationService.SubscribeToPostAsync(
                        userId, 
                        request.PostId, 
                        request.Title ?? "New post updates", 
                        request.OrganizerId, 
                        request.Category);
                }
                else if (!string.IsNullOrEmpty(request.Title))
                {
                    // Configure title-based notifications for this organizer (no general organizer subscription)
                    await _notificationService.SubscribeToTitleAsync(
                        userId,
                        request.Title,
                        request.OrganizerId,
                        request.Category
                    );
                }
                else
                {
                    // General subscription to organizer
                    await _notificationService.SubscribeToOrganizerAsync(userId, request.OrganizerId);
                }

                return Ok(new ApiResponse<object>(true, "Successfully subscribed to notifications", null));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error subscribing to notifications");
                return StatusCode(StatusCodes.Status500InternalServerError, 
                    new ApiResponse<object>(false, "An error occurred while subscribing to notifications", null));
            }
        }

        /// <summary>
        /// Disable title-based notifications configured for an organizer/title pair for the authenticated user
        /// </summary>
        [HttpPost("unsubscribe-title")]
        [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> UnsubscribeTitle([FromBody] SubscribeRequest request)
        {
            try
            {
                var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized(new ApiResponse<object>(false, "User not authenticated", null));
                }

                if (request == null || string.IsNullOrEmpty(request.OrganizerId) || string.IsNullOrEmpty(request.Title))
                {
                    return BadRequest(new ApiResponse<object>(false, "OrganizerId and Title are required", null));
                }

                var ok = await _notificationService.UnsubscribeTitleAsync(userId, request.Title!, request.OrganizerId);
                return Ok(new ApiResponse<object>(ok, ok ? "Unsubscribed from title notifications" : "No matching subscription found", null));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error unsubscribing title notifications");
                return StatusCode(StatusCodes.Status500InternalServerError,
                    new ApiResponse<object>(false, "An error occurred while unsubscribing title notifications", null));
            }
        }

        /// <summary>
        /// Send a notification to a specific user
        /// </summary>
        /// <param name="request">Notification details</param>
        [HttpPost("send")]
        [ProducesResponseType(typeof(ApiResponse<Notification>), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> SendNotification([FromBody] SendNotificationRequest request)
        {
            try
            {
                if (request == null)
                {
                    return BadRequest(new ApiResponse<object>(false, "Request cannot be null", null));
                }

                if (string.IsNullOrEmpty(request.UserId))
                {
                    return BadRequest(new ApiResponse<object>(false, "User ID is required", null));
                }

                if (string.IsNullOrEmpty(request.Title))
                {
                    return BadRequest(new ApiResponse<object>(false, "Title is required", null));
                }

                var notification = await _notificationService.CreateNotificationAsync(
                    userId: request.UserId,
                    organizerId: request.OrganizerId,
                    category: request.Category,
                    title: request.Title,
                    message: request.Message,
                    type: request.Type,
                    referenceId: request.ReferenceId,
                    fromUserId: User.FindFirstValue(ClaimTypes.NameIdentifier));

                // Send real-time notification via SignalR
                await _hubContext.Clients.User(request.UserId)
                    .SendAsync("ReceiveNotification", new 
                    {
                        notification.Id,
                        notification.Title,
                        notification.Message,
                        notification.Type,
                        notification.ReferenceId,
                        notification.CreatedAt,
                        notification.ActionUrl
                    });

                return Ok(new ApiResponse<Notification>(true, "Notification sent successfully", notification));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error sending notification to user {UserId}", request?.UserId);
                
                // Check for specific exception types to provide more detailed error messages
                string errorMessage = ex switch
                {
                    ArgumentException argEx => $"Invalid request: {argEx.Message}",
                    MongoWriteException mongoEx => "Database error while saving notification. " + 
                                                 (mongoEx.WriteError?.Code == 11000 ? "Duplicate key error." : "Database write failed."),
                    TimeoutException => "Database operation timed out. Please try again.",
                    _ => "An unexpected error occurred while sending the notification"
                };
                
                _logger.LogError("Detailed error: {ErrorMessage}", ex.ToString());
                
                return StatusCode(StatusCodes.Status500InternalServerError,
                    new ApiResponse<object>(false, errorMessage, new { 
                        error = ex.Message,
                        details = ex.StackTrace,
                        innerException = ex.InnerException?.Message
                    }));
            }
        }
    }
}
