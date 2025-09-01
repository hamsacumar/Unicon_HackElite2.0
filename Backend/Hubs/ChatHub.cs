using Backend.Models;
using Backend.Services;
using Microsoft.AspNetCore.SignalR;
using System.Threading.Tasks;

namespace Backend.Hubs
{
    public class ChatHub : Hub
    {
        private readonly ChatMongoService _chatMongo;

        public ChatHub(ChatMongoService chatMongo)
        {
            _chatMongo = chatMongo;
        }

        // Send message from sender to recipient
        public async Task SendMessage(string senderId, string senderUsername, string recipientId, string text)
        {
            var msg = new Message
            {
                SenderId = senderId,
                SenderUsername = senderUsername,
                RecipientId = recipientId,
                Text = text,
                Status = "sent"
            };

            // Save message in DB
            await _chatMongo.SaveMessage(msg);

            // Notify recipient
            await Clients.User(recipientId).SendAsync("ReceiveMessage", msg);

            // Notify sender that message is delivered
            await Clients.User(senderId).SendAsync("MessageDelivered", msg.Id);
        }

        // Mark message as seen
        public async Task MarkAsSeen(string messageId, string originalSenderId)
        {
            await _chatMongo.UpdateMessageStatus(messageId, "seen");

            // Notify original sender
            await Clients.User(originalSenderId).SendAsync("MessageSeen", messageId);
        }
    }
}
