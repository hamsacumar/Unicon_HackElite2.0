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
        private readonly IMongoCollection<EventModel> _events;
        private readonly IMongoCollection<AppUser> _users;
        private readonly IMongoCollection<LikeModel> _likes;
        private readonly IMongoCollection<CommentModel> _comments;

        public PostService(IMongoClient mongoClient, IOptions<MongoDbSettings> settings)
        {
            var database = mongoClient.GetDatabase(settings.Value.DatabaseName);

            // Collections used in this service
            _events = database.GetCollection<EventModel>("events");
            _users = database.GetCollection<AppUser>("Users");
            _likes = database.GetCollection<LikeModel>("likes");
            _comments = database.GetCollection<CommentModel>("comments");
        }
public async Task<AppUser> GetUserByIdAsync(string userId)
{
    return await _users.Find(u => u.Id == userId).FirstOrDefaultAsync();
}

        /* ================================
           Likes
        ================================== */

        // Add a like to a post, but only if this user hasn't liked it before
        public async Task AddLikeAsync(string postId, string userId)
        {
            var existing = await _likes.Find(l => l.PostId == postId && l.UserId == userId).FirstOrDefaultAsync();
            if (existing == null)
            {
                await _likes.InsertOneAsync(new LikeModel { PostId = postId, UserId = userId });
            }
        }

        // Get total like count for a post
        public async Task<int> GetLikeCountAsync(string postId)
        {
            return (int)await _likes.CountDocumentsAsync(l => l.PostId == postId);
        }

        // Check whether a specific user has already liked a post
        public async Task<bool> CheckIfLikedAsync(string postId, string userId)
        {
            var existing = await _likes.Find(l => l.PostId == postId && l.UserId == userId).FirstOrDefaultAsync();
            return existing != null;
        }

        /* ================================
           Comments
        ================================== */

        // Add a comment to a post
      public async Task<CommentModel> AddCommentAsync(CommentModel comment)
{
    var user = await _users.Find(u => u.Id == comment.UserId).FirstOrDefaultAsync();
    comment.Username = user?.Username ?? "Anonymous";
    comment.UserImage = user?.ProfileImageUrl;

    await _comments.InsertOneAsync(comment);
    return comment;
}


        // Get all comments for a given post
    public async Task<List<CommentModel>> GetCommentsByPostIdAsync(string postId)
{
    try
    {
        var pipeline = new[]
        {
            new BsonDocument("$match", new BsonDocument("postId", postId)),
            new BsonDocument("$lookup", new BsonDocument
            {
                { "from", "Users" },
                { "localField", "userId" },
                { "foreignField", "_id" },
                { "as", "user" }
            }),
            new BsonDocument("$unwind", new BsonDocument
            {
                { "path", "$user" },
                { "preserveNullAndEmptyArrays", true } // keep comments even if user not found
            }),
            new BsonDocument("$project", new BsonDocument
            {
                { "_id", 1 },
                { "postId", 1 },
                { "userId", 1 },
                { "text", 1 },
                { "createdAt", 1 },
                { "username", new BsonDocument("$ifNull", new BsonArray { "$user.Username", "Anonymous" }) },
                { "userImage", "$user.ProfileImageUrl" }
            })
        };

        return await _comments.Aggregate<CommentModel>(pipeline).ToListAsync();
    }
    catch (Exception ex)
    {
        Console.WriteLine($"Error in GetCommentsByPostIdAsync: {ex.Message}");
        throw;
    }
}


    public async Task<long> GetCommentCountAsync(string postId)
{
    return await _comments.CountDocumentsAsync(c => c.PostId == postId);
}


        /* ================================
           Events
        ================================== */

        // Get all events
        public async Task<List<EventModel>> GetAsync() =>
            await _events.Find(_ => true).ToListAsync();

        // Get a single event by its ID
        public async Task<EventModel?> GetByIdAsync(string id) =>
            await _events.Find(ev => ev.Id == id).FirstOrDefaultAsync();

        // Create a new event
        public async Task CreateAsync(EventModel ev) =>
            await _events.InsertOneAsync(ev);

        // Get all events along with user information
        public async Task<List<EventDto>> GetEventsWithUsersAsync()
        {
            var pipeline = new[]
            {
        new BsonDocument("$lookup", new BsonDocument
        {
            { "from", "Users" },
            { "let", new BsonDocument("userId", new BsonDocument("$toObjectId", "$userId")) },
            { "pipeline", new BsonArray
                {
                    new BsonDocument("$match", new BsonDocument(
                        "$expr", new BsonDocument(
                            "$eq", new BsonArray { "$_id", "$$userId" }
                        )
                    ))
                }
            },
            { "as", "user" }
        }),
        new BsonDocument("$unwind", "$user"),
        new BsonDocument("$project", new BsonDocument
        {
            { "_id", 1 },                 // Keep _id to match [BsonId] in EventDto
            { "title", "$title" },
            { "description", "$description" },
            { "category", "$category" },
            { "imageUrl", "$imageUrl" },
            { "userId", "$user._id" },
            { "username", "$user.Username" },
             { "userImage", "$user.ProfileImageUrl" }
        })
    };

            return await _events.Aggregate<EventDto>(pipeline).ToListAsync();
        }
    }
}