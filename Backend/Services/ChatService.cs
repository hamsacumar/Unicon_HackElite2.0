using Backend.Models;
using Backend.Settings;
using Microsoft.Extensions.Options;
using MongoDB.Driver;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Backend.Services
{
    public class ChatMongoService
    {
        private readonly IMongoCollection<AppUser> _users;
        private readonly IMongoCollection<Message> _messages;

        public ChatMongoService(IOptions<MongoDbSettings> settings)
        {
            var client = new MongoClient(settings.Value.ConnectionString);
            var database = client.GetDatabase(settings.Value.DatabaseName);

            _users = database.GetCollection<AppUser>("Users");
            _messages = database.GetCollection<Message>("Messages");
        }

        // Save a message
        public async Task<Message> SaveMessage(Message msg)
        {
            await _messages.InsertOneAsync(msg);
            return msg;
        }

        // Get all messages between two users
        public async Task<List<Message>> GetMessages(string userId, string otherUserId)
        {
            var filter = Builders<Message>.Filter.Or(
                Builders<Message>.Filter.And(
                    Builders<Message>.Filter.Eq(m => m.SenderId, userId),
                    Builders<Message>.Filter.Eq(m => m.RecipientId, otherUserId)
                ),
                Builders<Message>.Filter.And(
                    Builders<Message>.Filter.Eq(m => m.SenderId, otherUserId),
                    Builders<Message>.Filter.Eq(m => m.RecipientId, userId)
                )
            );

            return await _messages.Find(filter)
                                  .SortBy(m => m.Timestamp)
                                  .ToListAsync();
        }

        // Update message status (seen, delivered, etc.)
        public async Task UpdateMessageStatus(string messageId, string status)
        {
            var update = Builders<Message>.Update.Set(m => m.Status, status);
            await _messages.UpdateOneAsync(m => m.Id == messageId, update);
        }
    }
}
