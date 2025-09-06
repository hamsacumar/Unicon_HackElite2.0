using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using System;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using System.Collections.Concurrent;

namespace Hackelite2._0.Hubs
{
    [Authorize]
    public class NotificationHub : Hub
    {
        private static readonly ConcurrentDictionary<string, string> _userConnections = new();
        private readonly ILogger<NotificationHub> _logger;

        public NotificationHub(ILogger<NotificationHub> logger)
        {
            _logger = logger;
        }

        public override async Task OnConnectedAsync()
        {
            var userId = Context.UserIdentifier;
            if (!string.IsNullOrEmpty(userId))
            {
                _userConnections[Context.ConnectionId] = userId;
                await Groups.AddToGroupAsync(Context.ConnectionId, userId);
                _logger.LogInformation($"User {userId} connected with connection ID: {Context.ConnectionId}");
            }
            await base.OnConnectedAsync();
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            if (_userConnections.TryRemove(Context.ConnectionId, out var userId))
            {
                await Groups.RemoveFromGroupAsync(Context.ConnectionId, userId);
                _logger.LogInformation($"User {userId} disconnected. Connection ID: {Context.ConnectionId}");
            }
            await base.OnDisconnectedAsync(exception);
        }

        public async Task SendNotification(string userId, string title, string message, string? notificationType = null, string? referenceId = null)
        {
            try
            {
                if (string.IsNullOrEmpty(userId))
                    throw new ArgumentNullException(nameof(userId));

                var notification = new 
                { 
                    Title = title,
                    Message = message,
                    Type = notificationType,
                    ReferenceId = referenceId,
                    Timestamp = DateTime.UtcNow
                };

                await Clients.User(userId).SendAsync("ReceiveNotification", notification);
                _logger.LogInformation($"Notification sent to user {userId}: {title}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error sending notification to user {userId}");
                throw;
            }
        }

        public async Task MarkNotificationAsRead(string notificationId)
        {
            var userId = Context.UserIdentifier;
            if (string.IsNullOrEmpty(userId))
                throw new UnauthorizedAccessException("User not authenticated");

            // This is just a signal to the client to mark as read
            // The actual marking as read should be done via the API
            await Clients.Caller.SendAsync("NotificationMarkedAsRead", notificationId);
        }
    }
}
