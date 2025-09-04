using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Backend.Models;
using Backend.Services;
using Microsoft.Extensions.Logging;
using System;
using System.Threading.Tasks;
using System.Collections.Generic;

namespace Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize] // You can restrict by role if needed: [Authorize(Roles = "Student,Organizer,Admin")]
    public class MessagesController : ControllerBase
    {
        private readonly IMessageService _messageService;
        private readonly ILogger<MessagesController> _logger;

        public MessagesController(IMessageService messageService, ILogger<MessagesController> logger)
        {
            _messageService = messageService;
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
                // Use the service to get messages where the user is the receiver
                var messages = await _messageService.GetConversationAsync(userId, userId); 
                // Optionally, filter in the service to only receiverId == userId
                return Ok(new { success = true, data = messages });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to get inbox messages");
                return StatusCode(500, new { success = false, error = ex.Message });
            }
        }
    }
}
