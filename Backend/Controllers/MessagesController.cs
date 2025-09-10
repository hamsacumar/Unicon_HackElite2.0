using Microsoft.AspNetCore.Mvc;
using Backend.Models;
using Backend.Services;
using MongoDB.Bson;

namespace Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class MessagesController : ControllerBase
    {
        private readonly IMessageService _messageService;
        private readonly IUserService _userService;
        private readonly ILogger<MessagesController> _logger;

        public MessagesController(
            IMessageService messageService,
            IUserService userService,
            ILogger<MessagesController> logger)
        {
            _messageService = messageService;
            _userService = userService;
            _logger = logger;
        }

        // ✅ Send message (only need receiver + text + senderId from frontend)
        [HttpPost("send")]
        public async Task<IActionResult> SendMessage([FromBody] SendMessageDto dto)
        {
            try
            {
                // 1. Find sender
                var sender = await _userService.GetById(dto.SenderId);
                if (sender == null)
                    return NotFound(new { success = false, message = "Sender not found" });

                // 2. Find receiver
                var receiver = await _userService.GetByUsername(dto.ReceiverUsername);
                if (receiver == null)
                    return NotFound(new { success = false, message = "Receiver not found" });

                // 3. Build message
                var message = new Message
                {
                    Id = ObjectId.GenerateNewId().ToString(),
                    SenderId = sender.Id,
                    SenderUsername = sender.Username,
                    ReceiverId = receiver.Id,
                    ReceiverUsername = receiver.Username,
                    Text = dto.Text,
                    Timestamp = DateTime.UtcNow,
                    Status = "unseen"
                };

                await _messageService.CreateAsync(message);

                return Ok(new { success = true, message = "Message sent successfully", data = message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send message");
                return StatusCode(500, new { success = false, error = ex.Message });
            }
        }

        // ✅ Conversation between two users
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

        // ✅ Inbox
        [HttpGet("inbox/{userId}")]
        public async Task<IActionResult> GetInbox(string userId)
        {
            try
            {
                var messages = await _messageService.GetInboxAsync(userId);
                return Ok(new { success = true, data = messages });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to get inbox");
                return StatusCode(500, new { success = false, error = ex.Message });
            }
        }

        // ✅ Bulk delete messages
        [HttpPost("delete")]
            public async Task<IActionResult> DeleteMessages([FromBody] List<string> ids)
        {
            try
            {
                if (ids == null || ids.Count == 0)
                return BadRequest(new { success = false, message = "No message IDs provided" });

                foreach (var id in ids)
                {
                    await _messageService.DeleteAsync(id);
                }

                return Ok(new { success = true, message = "Messages deleted successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to delete messages");
                return StatusCode(500, new { success = false, error = ex.Message });
            }
        }

    }

    public class SendMessageDto
    {
        public string SenderId { get; set; } = null!;
        public string ReceiverUsername { get; set; } = null!;
        public string Text { get; set; } = null!;
    }

    


}
