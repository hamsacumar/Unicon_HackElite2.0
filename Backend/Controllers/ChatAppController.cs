using Backend.Models;
using Backend.Services;
using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;

namespace Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class MessagesController : ControllerBase
    {
        private readonly ChatMongoService _chatMongo;

        public MessagesController(ChatMongoService chatMongo)
        {
            _chatMongo = chatMongo;
        }

        // Get all messages between two users
        [HttpGet("{userId}/{otherUserId}")]
        public async Task<IActionResult> GetMessages(string userId, string otherUserId)
        {
            var messages = await _chatMongo.GetMessages(userId, otherUserId);
            return Ok(messages);
        }

        // Send a new message
        [HttpPost("send")]
        public async Task<IActionResult> SendMessage([FromBody] Message message)
        {
            var savedMsg = await _chatMongo.SaveMessage(message);
            return Ok(savedMsg);
        }

        // Mark a message as seen
        [HttpPost("seen/{messageId}")]
        public async Task<IActionResult> MarkAsSeen(string messageId)
        {
            await _chatMongo.UpdateMessageStatus(messageId, "seen");
            return Ok();
        }
    }
}
