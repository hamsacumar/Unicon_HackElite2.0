using Backend.Models;
using Backend.Settings;
using Microsoft.Extensions.Options;
using MongoDB.Driver;

namespace Backend.Services
{
    public class MessageService : IMessageService
    {
        private readonly IMongoCollection<Message> _messages;

        public MessageService(IOptions<MongoDbSettings> settings, IMongoClient client)
        {
            var database = client.GetDatabase(settings.Value.DatabaseName);
            _messages = database.GetCollection<Message>("Messages");
        }

        public async Task<List<Message>> GetAllAsync() =>
            await _messages.Find(_ => true).ToListAsync();

        public async Task<Message> GetByIdAsync(string id) =>
            await _messages.Find(m => m.Id == id).FirstOrDefaultAsync();

        public async Task CreateAsync(Message message) =>
            await _messages.InsertOneAsync(message);

        public async Task UpdateAsync(string id, Message updatedMessage) =>
            await _messages.ReplaceOneAsync(m => m.Id == id, updatedMessage);

        public async Task DeleteAsync(string id) =>
            await _messages.DeleteOneAsync(m => m.Id == id);

        public async Task<List<Message>> GetConversationAsync(string user1, string user2)
        {
            var filter = Builders<Message>.Filter.Or(
                Builders<Message>.Filter.And(
                    Builders<Message>.Filter.Eq(m => m.SenderId, user1),
                    Builders<Message>.Filter.Eq(m => m.ReceiverId, user2)
                ),
                Builders<Message>.Filter.And(
                    Builders<Message>.Filter.Eq(m => m.SenderId, user2),
                    Builders<Message>.Filter.Eq(m => m.ReceiverId, user1)
                )
            );

            return await _messages.Find(filter)
                                  .SortBy(m => m.Timestamp)
                                  .ToListAsync();
        }

        public async Task<bool> MarkSeenAsync(string messageId)
        {
            var update = Builders<Message>.Update.Set(m => m.Status, "seen");
            var result = await _messages.UpdateOneAsync(m => m.Id == messageId, update);
            return result.ModifiedCount > 0;
        }

        public async Task<List<Message>> GetInboxAsync(string userId)
    {
        var filter = Builders<Message>.Filter.Eq(m => m.ReceiverId, userId);
        return await _messages.Find(filter)
                          .SortByDescending(m => m.Timestamp)
                          .ToListAsync();
    }
    
    }
}
