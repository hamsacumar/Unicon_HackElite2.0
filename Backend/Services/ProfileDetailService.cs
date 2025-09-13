using MongoDB.Driver;
using Backend.Models;
using Backend.Settings;
using Microsoft.Extensions.Options;
using MongoDB.Bson;
    
namespace Backend.Services
{
    public class ProfileDetailService
    {
        private readonly IMongoCollection<AppUser> _userCollection;
        private readonly IMongoCollection<Event> _eventCollection;
        private readonly IMongoCollection<BookmarkModel> _bookmarkCollection;

        public ProfileDetailService(IOptions<MongoDbSettings> settings, IMongoClient client)
        {
            var database = client.GetDatabase(settings.Value.DatabaseName);
            _userCollection = database.GetCollection<AppUser>("Users"); // Use AppUser
            _eventCollection = database.GetCollection<Event>("events");             // Events collection
            _bookmarkCollection = database.GetCollection<BookmarkModel>("bookmarks"); 
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

        public async Task<List<Event>> GetBookmarkedPostsByUserIdAsync(string userId)
        {
            try
            {
                Console.WriteLine($"Getting bookmarks for user ID: {userId}");
                
                // Get all bookmarks for the user
                var bookmarks = await _bookmarkCollection
                    .Find(b => b.UserId == userId)
                    .ToListAsync();

                if (!bookmarks.Any())
                {
                    Console.WriteLine($"No bookmarks found for user {userId}");
                    return new List<Event>();
                }

                Console.WriteLine($"Found {bookmarks.Count} bookmarks for user {userId}");

                // Get all post IDs from bookmarks
                var postIds = bookmarks.Select(b => b.PostId).ToList();
                Console.WriteLine($"Bookmarked post IDs: {string.Join(", ", postIds)}");

                // Convert string postIds to ObjectIds for the query
                var objectIds = postIds.Select(id => ObjectId.Parse(id)).ToList();

                // Query events using the ObjectIds
                var filter = Builders<Event>.Filter.In("_id", objectIds);
                
                var result = await _eventCollection.Find(filter).ToListAsync();
                Console.WriteLine($"Found {result.Count} matching events");
                
                if (result.Any())
                {
                    Console.WriteLine($"Found events: {string.Join(", ", result.Select(e => e.Id))}");
                }
                
                return result;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in GetBookmarkedPostsByUserIdAsync: {ex.Message}");
                Console.WriteLine(ex.StackTrace);
                throw;
            }
        }

    }
}
