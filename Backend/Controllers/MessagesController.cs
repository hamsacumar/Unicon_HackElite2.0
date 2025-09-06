using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Backend.Models;
using Backend.Services;
using MongoDB.Bson;

namespace Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class MessagesController : ControllerBase
    {
        private readonly IMessageService _messageService;
        private readonly IUserService _userService; // ✅ add this
        private readonly ILogger<MessagesController> _logger;

        public MessagesController(
            IMessageService messageService, 
            IUserService userService,    // ✅ inject here
            ILogger<MessagesController> logger)
        {
            _messageService = messageService;
            _userService = userService;
            _logger = logger;
        }

        // POST: api/messages/send
        [HttpPost("send")]
        public async Task<IActionResult> SendMessage([FromBody] Message msg)
        {
            try
            {
                await _messageService.CreateAsync(msg);
                return Ok(new { success = true, message = "Message sent successfully", data = msg });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send message");
                return StatusCode(500, new { success = false, error = ex.Message });
            }
        }

        // POST: api/messages/sendByUsername
        [HttpPost("sendByUsername")]
        public async Task<IActionResult> SendByUsername([FromBody] SendByUsernameDto dto)
        {
            try
            {
                // 1. Find receiver by username
                var receiver = await _userService.GetByUsername(dto.ReceiverUsername);
                if (receiver == null)
                    return NotFound(new { success = false, message = "Receiver not found" });

                var senderId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
                var senderUsername = User.Identity?.Name;
                if (senderId == null || senderUsername == null)
                    return Unauthorized(new { success = false, message = "Invalid sender" });
                // 2. Build message object
                var message = new Message
                {
                    Id = ObjectId.GenerateNewId().ToString(),
                    SenderId = senderId,
                    SenderUsername = senderUsername,
                    ReceiverId = receiver.Id,
                    ReceiverUsername = receiver.Username,
                    Text = dto.Text,
                    Timestamp = DateTime.UtcNow,
                    Status = "sent"
                };

                // 3. Save
                await _messageService.CreateAsync(message);

                return Ok(new { success = true, message = "Message sent successfully", data = message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send message by username");
                return StatusCode(500, new { success = false, error = ex.Message });
            }
        }

        // GET: api/messages/conversation/{user1}/{user2}
        [HttpGet("conversation/{user1}/{user2}")]
        public async Task<IActionResult> GetConversation(string user1, string user2)
        {
            try
            {
                var messages = await _messageService.GetConversationAsync(user1, user2);
                return Ok(new { success = true, data = messages });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to get conversation");
                return StatusCode(500, new { success = false, error = ex.Message });
            }
        }

        // POST: api/messages/seen/{messageId}
        [HttpPost("seen/{messageId}")]
        public async Task<IActionResult> MarkSeen(string messageId)
        {
            try
            {
                var updated = await _messageService.MarkSeenAsync(messageId);
                if (!updated)
                    return NotFound(new { success = false, message = "Message not found" });

                return Ok(new { success = true, message = "Message marked as seen" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to mark message as seen");
                return StatusCode(500, new { success = false, error = ex.Message });
            }
        }

        // GET: api/messages/inbox/{userId}
        [HttpGet("inbox/{userId}")]
        public async Task<IActionResult> GetInbox(string userId)
        {
            try
            {
                // ✅ FIX: use proper inbox service
                var messages = await _messageService.GetInboxAsync(userId);
                return Ok(new { success = true, data = messages });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to get inbox messages");
                return StatusCode(500, new { success = false, error = ex.Message });
            }
        }
    }

    public class SendByUsernameDto
    {
        public string SenderId { get; set; } = null!;
        public string SenderUsername { get; set; } = null!;
        public string ReceiverUsername { get; set; } = null!;
        public string Text { get; set; } = null!;
    }
}
