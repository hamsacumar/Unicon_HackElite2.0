using MongoDB.Driver;
using Backend.Models;
using Backend.Settings;
using Microsoft.Extensions.Options;

namespace Backend.Services
{
    
    public class ProfileDetailService 
    {
        private readonly IMongoCollection<profileDetails> _userCollection;

        public ProfileDetailService(IOptions<MongoDbSettings> settings, IMongoClient client)
        {
            var database = client.GetDatabase(settings.Value.DatabaseName);
            _userCollection = database.GetCollection<profileDetails>("Users");
        }

        public async Task<profileDetails> GetUserByIdAsync(string userId)
        {
            return await _userCollection.Find(u => u.Id == userId).FirstOrDefaultAsync();
        }
    }
}
