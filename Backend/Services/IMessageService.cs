using Backend.Models;

namespace Backend.Services
{
    public interface IMessageService
    {
        Task<List<Message>> GetAllAsync();
        Task<Message?> GetByIdAsync(string id);
        Task CreateAsync(Message message);
        Task UpdateAsync(string id, Message updatedMessage);
        Task<List<Message>> GetConversationAsync(string user1, string user2);
        Task<bool> MarkSeenAsync(string messageId);
        Task DeleteAsync(string id);
        Task<List<Message>> GetInboxAsync(string userId);
        Task<List<Message>> GetSentMessagesAsync(string userId);
    }
}
