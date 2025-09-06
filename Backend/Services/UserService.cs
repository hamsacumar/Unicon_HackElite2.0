// Backend/Services/UserService.cs
using Backend.Models;
using Backend.Settings;
using MongoDB.Driver;
using System.Threading.Tasks;
using Microsoft.Extensions.Options;

namespace Backend.Services
{
    public class UserService : IUserService
    {
        private readonly IMongoCollection<AppUser> _users;
        private readonly IMongoCollection<EmailVerification> _verifications;

        public UserService(IOptions<MongoDbSettings> settings)
        {
            var client = new MongoClient(settings.Value.ConnectionString);
            var database = client.GetDatabase(settings.Value.DatabaseName);
            _users = database.GetCollection<AppUser>("Users");
            _verifications = database.GetCollection<EmailVerification>("EmailVerifications");
        }

        public async Task Create(AppUser user)
        {
            await _users.InsertOneAsync(user);
        }

        public async Task Update(AppUser user)
        {
            await _users.ReplaceOneAsync(u => u.Id == user.Id, user);
        }

        public async Task<AppUser> GetById(string id)
        {
            return await _users.Find(u => u.Id == id).FirstOrDefaultAsync();
        }

        public async Task<AppUser> GetByUsername(string username)
        {
            return await _users.Find(u => u.Username == username).FirstOrDefaultAsync();
        }

        public async Task<AppUser> GetByEmail(string email)
        {
            return await _users.Find(u => u.Email == email).FirstOrDefaultAsync();
        }

        public async Task<AppUser> GetByGoogleId(string googleId)
        {
            return await _users.Find(u => u.GoogleId == googleId).FirstOrDefaultAsync();
        }

        public async Task<AppUser> GetByUsernameOrEmail(string username, string email)
        {
            return await _users.Find(u => u.Username == username || u.Email == email).FirstOrDefaultAsync();
        }

        public async Task SaveVerification(EmailVerification verification)
        {
            // Delete old verifications for this user and type
            await _verifications.DeleteManyAsync(v => v.UserId == verification.UserId && v.Type == verification.Type);
            await _verifications.InsertOneAsync(verification);
        }

        public async Task<EmailVerification> GetVerification(string userId, string type)
        {
            return await _verifications.Find(v => v.UserId == userId && v.Type == type).FirstOrDefaultAsync();
        }

        public async Task UpdateVerification(EmailVerification verification)
        {
            await _verifications.ReplaceOneAsync(v => v.Id == verification.Id, verification);
        }

        public async Task<bool> UpdateProfileImage(string userId, string? imageUrl)
        {
            try
            {
                if (string.IsNullOrEmpty(userId))
                {
                    Console.WriteLine("Error: User ID cannot be null or empty");
                    return false;
                }

                var filter = Builders<AppUser>.Filter.Eq(u => u.Id, userId);
                var update = Builders<AppUser>.Update
                    .Set(u => u.ProfileImageUrl, imageUrl)
                    .Set(u => u.UpdatedAt, DateTime.UtcNow);
                    
                var options = new UpdateOptions { IsUpsert = false };
                var result = await _users.UpdateOneAsync(filter, update, options);
                
                if (!result.IsAcknowledged)
                {
                    Console.WriteLine("Error: Database operation was not acknowledged");
                    return false;
                }
                
                if (result.MatchedCount == 0)
                {
                    Console.WriteLine($"Error: No user found with ID {userId}");
                    return false;
                }
                
                Console.WriteLine($"Successfully updated profile image for user {userId}");
                return true;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error updating profile image for user {userId}: {ex.Message}");
                Console.WriteLine($"Stack Trace: {ex.StackTrace}");
                if (ex.InnerException != null)
                {
                    Console.WriteLine($"Inner Exception: {ex.InnerException.Message}");
                }
                return false;
            }
        }
    }
}