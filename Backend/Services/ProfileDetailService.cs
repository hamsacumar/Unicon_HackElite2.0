using MongoDB.Driver;
using Backend.Models;
using Backend.Settings;
using Microsoft.Extensions.Options;

namespace Backend.Services
{
    public class ProfileDetailService
    {
        private readonly IMongoCollection<profileDetails> _userCollection;
        private readonly IMongoCollection<Event> _eventCollection;

        public ProfileDetailService(IOptions<MongoDbSettings> settings, IMongoClient client)
        {
            var database = client.GetDatabase(settings.Value.DatabaseName);
            _userCollection = database.GetCollection<profileDetails>("Users");
            _eventCollection = database.GetCollection<Event>("events"); // Events collection
        }

        public async Task<profileDetails> GetUserByIdAsync(string userId)
        {
            return await _userCollection.Find(u => u.Id == userId).FirstOrDefaultAsync();
        }

        public async Task<List<Event>> GetEventsByUserIdAsync(string userId)
        {
            return await _eventCollection.Find(e => e.UserId == userId).ToListAsync();
        }
    }

}