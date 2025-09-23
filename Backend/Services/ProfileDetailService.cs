using MongoDB.Driver;
using Backend.Models;
using Backend.Settings;
using Microsoft.Extensions.Options;

namespace Backend.Services
{
    public class ProfileDetailService
    {
        private readonly IMongoCollection<AppUser> _userCollection;
        private readonly IMongoCollection<Event> _eventCollection;

        public ProfileDetailService(IOptions<MongoDbSettings> settings, IMongoClient client)
        {
            var database = client.GetDatabase(settings.Value.DatabaseName);
            _userCollection = database.GetCollection<AppUser>("Users"); // Use AppUser
            _eventCollection = database.GetCollection<Event>("events"); // Events collection
        }

        public async Task<AppUser?> GetUserByIdAsync(string userId)
        {
            return await _userCollection.Find(u => u.Id == userId).FirstOrDefaultAsync();
        }

        public async Task<List<Event>> GetEventsByUserIdAsync(string userId)
        {
            return await _eventCollection.Find(e => e.UserId == userId).ToListAsync();
        }

        public async Task<List<Event>> GetEventsByUsernameAsync(string username)
        {
            var user = await _userCollection.Find(u => u.Username == username).FirstOrDefaultAsync();
            if (user == null)
                return new List<Event>();
            return await _eventCollection.Find(e => e.UserId == user.Id).ToListAsync();
        }

        public async Task<(string? Description, string? ProfileImageUrl)> GetDescriptionByUsernameAsync(string username)
        {
            var user = await _userCollection.Find(u => u.Username == username).FirstOrDefaultAsync();
            if (user == null) return (null, null);
            return (user.Description, user.ProfileImageUrl);
        }

        public async Task<int> GetPostCountByUsernameAsync(string username)
        {
            var user = await _userCollection.Find(u => u.Username == username).FirstOrDefaultAsync();
            if (user == null) return 0;
            return (int)await _eventCollection.CountDocumentsAsync(e => e.UserId == user.Id);
        }

        public async Task<int> GetPostCountByUserIdAsync(string userId)
        {
            return (int)await _eventCollection.CountDocumentsAsync(e => e.UserId == userId);
        }

        public async Task<string?> GetProfileImageByUserIdAsync(string userId)
        {
            var user = await _userCollection.Find(u => u.Id == userId).FirstOrDefaultAsync();
            return user?.ProfileImageUrl;
        }

        public async Task<string?> GetProfileImageByUsernameAsync(string username)
        {
            var user = await _userCollection.Find(u => u.Username == username).FirstOrDefaultAsync();
            return user?.ProfileImageUrl;
        }
        
       public async Task UpdateUserAsync(string userId, AppUser updatedUser)
{
    var update = Builders<AppUser>.Update
        .Set(u => u.FirstName, updatedUser.FirstName)
        .Set(u => u.LastName, updatedUser.LastName)
        .Set(u => u.Username, updatedUser.Username)
        .Set(u => u.Description, updatedUser.Description)
        .Set(u => u.ProfileImageUrl, updatedUser.ProfileImageUrl)
        .Set(u => u.UpdatedAt, DateTime.UtcNow);

    await _userCollection.UpdateOneAsync(u => u.Id == userId, update);
}


    }
}
