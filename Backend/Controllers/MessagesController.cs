using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Backend.Models;
using Backend.Services;
using Microsoft.Extensions.Logging;
using System;
using System.Threading.Tasks;
using System.Collections.Generic;
using System.Security.Claims;
using Microsoft.AspNetCore.SignalR;
using Hackelite2._0.Hubs;

namespace Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class MessagesController : ControllerBase
    {
        private readonly IMessageService _messageService;
        private readonly INotificationService _notificationService;
        private readonly IHubContext<NotificationHub> _hubContext;
        private readonly ILogger<MessagesController> _logger;

        public MessagesController(
            IMessageService messageService, 
            INotificationService notificationService,
            IHubContext<NotificationHub> hubContext,
            ILogger<MessagesController> logger)
        {
            _messageService = messageService;
            _notificationService = notificationService;
            _hubContext = hubContext;
            _logger = logger;
        }

        // POST: api/messages/send
        [HttpPost("send")]
        public async Task<IActionResult> SendMessage([FromBody] Message msg)
        {
            try
            {
                var senderId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (string.IsNullOrEmpty(senderId))
                    return Unauthorized(new { success = false, message = "User not authenticated" });

                // Set the sender ID from the authenticated user
                msg.SenderId = senderId;
                msg.Timestamp = DateTime.UtcNow;
                msg.Status = "sent";

                await _messageService.CreateAsync(msg);

                // Send notification to the receiver
                try
                {
                    await _notificationService.SendMessageNotificationAsync(
                        receiverId: msg.ReceiverId,
                        senderId: senderId,
                        messageContent: msg.Content
                    );

                    // Send real-time notification via SignalR
                    await _hubContext.Clients.User(msg.ReceiverId).SendAsync("ReceiveNotification", new
                    {
                        Title = "New Message",
                        Message = "You have received a new message",
                        Type = "message",
                        FromUserId = senderId,
                        Timestamp = DateTime.UtcNow
                    });

                    _logger.LogInformation("Message notification sent to user {ReceiverId}", msg.ReceiverId);
                }
                catch (Exception notifEx)
                {
                    _logger.LogError(notifEx, "Failed to send message notification");
                    // Don't fail the entire request if notification fails
                }

                return Ok(new { success = true, message = "Message sent successfully", data = msg });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send message");
                return StatusCode(500, new { success = false, error = ex.Message });
            }
        }

        // GET: api/messages/conversation/{user1}/{user2}
        [HttpGet("conversation/{user1}/{user2}")]
        public async Task<IActionResult> GetConversation(string user1, string user2)
        {
            try
            {
                var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (string.IsNullOrEmpty(currentUserId))
                    return Unauthorized(new { success = false, message = "User not authenticated" });

                // Ensure the current user is part of the conversation
                if (currentUserId != user1 && currentUserId != user2)
                    return Forbid(new { success = false, message = "Access denied to this conversation" });

                var messages = await _messageService.GetConversationAsync(user1, user2);
                return Ok(new { success = true, data = messages });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to get conversation");
                return StatusCode(500, new { success = false, error = ex.Message });
            }
        }

        private IActionResult Forbid(object value)
        {
            throw new NotImplementedException();
        }

        // POST: api/messages/seen/{messageId}
        [HttpPost("seen/{messageId}")]
        public async Task<IActionResult> MarkSeen(string messageId)
        {
            try
            {
                var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (string.IsNullOrEmpty(currentUserId))
                    return Unauthorized(new { success = false, message = "User not authenticated" });

                // Get the message to verify the current user is the receiver
                var message = await _messageService.GetByIdAsync(messageId);
                if (message == null)
                    return NotFound(new { success = false, message = "Message not found" });

                if (message.ReceiverId != currentUserId)
                    return Forbid(new { success = false, message = "Access denied" });

                var updated = await _messageService.MarkSeenAsync(messageId);
                if (!updated)
                    return NotFound(new { success = false, message = "Message not found" });

                // Notify the sender via SignalR that their message was seen
                await _hubContext.Clients.User(message.SenderId).SendAsync("MessageSeen", messageId);

                return Ok(new { success = true, message = "Message marked as seen" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to mark message as seen");
                return StatusCode(500, new { success = false, error = ex.Message });
            }
        }

        // GET: api/messages/inbox
        [HttpGet("inbox")]
        public async Task<IActionResult> GetInbox()
        {
            try
            {
                var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (string.IsNullOrEmpty(currentUserId))
                    return Unauthorized(new { success = false, message = "User not authenticated" });

                var messages = await _messageService.GetInboxAsync(currentUserId);
                return Ok(new { success = true, data = messages });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to get inbox messages");
                return StatusCode(500, new { success = false, error = ex.Message });
            }
        }

        // GET: api/messages/conversations
        [HttpGet("conversations")]
        public IActionResult GetUserConversations()
        {
            try
            {
                var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (string.IsNullOrEmpty(currentUserId))
                    return Unauthorized(new { success = false, message = "User not authenticated" });

                // This would require implementing a method to get all conversations for a user
                // For now, return empty list
                var conversations = new List<object>();

                return Ok(new { success = true, data = conversations });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to get user conversations");
                return StatusCode(500, new { success = false, error = ex.Message });
            }
        }
    }
}