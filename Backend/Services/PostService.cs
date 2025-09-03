using Backend.Models;
using Backend.Settings;
using Microsoft.Extensions.Options;
using MongoDB.Driver;
using MongoDB.Bson;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Backend.Services
{
    public class PostService : IPostService
    {
        private readonly IMongoCollection<EventModel> _events; // MongoDB collection for events
        private readonly IMongoCollection<AppUser> _users;     // MongoDB collection for users

        public PostService(IMongoClient mongoClient, IOptions<MongoDbSettings> settings)
        {
            var database = mongoClient.GetDatabase(settings.Value.DatabaseName); // Get database from settings
            _events = database.GetCollection<EventModel>("events");               // Initialize events collection
            _users = database.GetCollection<AppUser>("Users");                    // Initialize users collection
        }

        // Get all events from the database
        public async Task<List<EventModel>> GetAsync() =>
            await _events.Find(_ => true).ToListAsync();

        // Get a single event by its ID
        public async Task<EventModel?> GetByIdAsync(string id) =>
            await _events.Find(ev => ev.Id == id).FirstOrDefaultAsync();

        // Insert a new event into the database
        public async Task CreateAsync(EventModel ev) =>
            await _events.InsertOneAsync(ev);

        // Return events along with their associated user info (mandatory)
        public async Task<List<EventDto>> GetEventsWithUsersAsync()
        {
            var pipeline = new[]
            {
                new BsonDocument("$lookup", new BsonDocument
                {
                    { "from", "Users" }, // Join with Users collection
                    { "let", new BsonDocument("userId", new BsonDocument("$toObjectId", "$userId")) }, // Convert string userId to ObjectId
                    { "pipeline", new BsonArray
                    {
                        new BsonDocument("$match", new BsonDocument(
                            "$expr", new BsonDocument(
                                "$eq", new BsonArray { "$_id", "$$userId" }))) // Match user by _id
                    }},
                    { "as", "user" } // Resulting user info will be in 'user' field
                }),
                new BsonDocument("$unwind", "$user"), // Flatten the user array to a single object
                new BsonDocument("$project", new BsonDocument
                {
                    { "id", "$_id" },               
                    { "title", "$title" },         
                    { "description", "$description" }, 
                    { "category", "$category" },    
                    { "imageUrl", "$imageUrl" },    
                    { "userId", "$user._id" },      
                    { "username", "$user.Username" }, 
                }  )  
            };

            // Execute the aggregation pipeline and return as a list of EventDto
            return await _events.Aggregate<EventDto>(pipeline).ToListAsync();
        }
    }
}
