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

        public async Task<List<EventDto>> FilterEventsAsync(string? category, DateTime? startDate, DateTime? endDate)
        {
            try
            {
                Console.WriteLine($"[FilterEventsAsync] Starting filter - Category: {category}, StartDate: {startDate}, EndDate: {endDate}");
                
                // Verify database connection
                try 
                {
                    await _events.Database.ListCollectionsAsync();
                    Console.WriteLine("[FilterEventsAsync] Successfully connected to MongoDB");
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"[FilterEventsAsync] MongoDB connection error: {ex.Message}");
                    throw new Exception("Failed to connect to the database. Please check your connection settings.", ex);
                }
                
                var filterBuilder = Builders<EventModel>.Filter;
                var filter = filterBuilder.Empty;

                // Apply category filter if provided
                if (!string.IsNullOrEmpty(category))
                {
                    Console.WriteLine($"[FilterEventsAsync] Applying category filter: {category}");
                    filter = filter & filterBuilder.Eq("category", category);
                }

                // Apply date range filter if provided
                if (startDate.HasValue)
                {
                    Console.WriteLine($"[FilterEventsAsync] Applying start date filter: {startDate}");
                    filter = filter & filterBuilder.Gte("startDate", startDate.Value);
                }

                if (endDate.HasValue)
                {
                    // Include the entire end date by setting the time to end of day
                    var endOfDay = endDate.Value.Date.AddDays(1).AddTicks(-1);
                    Console.WriteLine($"[FilterEventsAsync] Applying end date filter: {endDate} (end of day: {endOfDay})");
                    filter = filter & filterBuilder.Lte("startDate", endOfDay);
                }

                // Log filter details instead of trying to render BSON document
                Console.WriteLine($"[FilterEventsAsync] Final filter - Category: {category}, StartDate: {startDate}, EndDate: {endDate}");

                List<EventModel> events;
                try 
                {
                    Console.WriteLine($"[FilterEventsAsync] Executing MongoDB query...");
                    var cursor = await _events.FindAsync(filter);
                    events = await cursor.ToListAsync();
                    Console.WriteLine($"[FilterEventsAsync] Successfully retrieved {events.Count} events");
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"[FilterEventsAsync] Error executing MongoDB query: {ex.Message}");
                    Console.WriteLine($"[FilterEventsAsync] Stack Trace: {ex.StackTrace}");
                    if (ex.InnerException != null)
                    {
                        Console.WriteLine($"[FilterEventsAsync] Inner Exception: {ex.InnerException.Message}");
                    }
                    throw new Exception("Error retrieving events from database. Please try again later.", ex);
                }

                var eventDtos = new List<EventDto>();

                foreach (var ev in events)
                {
                    try
                    {
                        Console.WriteLine($"[FilterEventsAsync] Processing event: {ev.Id} - {ev.Title}");
                        AppUser user = null;
                        string username = "Unknown";
                        string userImage = null;
                        
                        try 
                        {
                            Console.WriteLine($"[FilterEventsAsync] Retrieving user with ID: {ev.UserId}");
                            user = await GetUserByIdAsync(ev.UserId);
                            if (user != null)
                            {
                                username = user.Username ?? "Unknown";
                                userImage = user.ProfileImageUrl;
                                Console.WriteLine($"[FilterEventsAsync] Found user: {username}");
                            }
                            else
                            {
                                Console.WriteLine($"[FilterEventsAsync] User not found for ID: {ev.UserId}");
                            }
                        }
                        catch (Exception userEx)
                        {
                            Console.WriteLine($"[FilterEventsAsync] Error retrieving user {ev.UserId}: {userEx.Message}");
                            // Continue with default values
                        }
                        
                        var eventDto = new EventDto
                        {
                            Id = ev.Id,
                            Title = ev.Title,
                            Description = ev.Description,
                            Category = ev.Category,
                            ImageUrl = ev.ImageUrl,
                            UserId = ev.UserId,
                            Username = username,
                            UserImage = userImage
                        };
                        
                        Console.WriteLine($"[FilterEventsAsync] Created DTO for event {ev.Id}");
                        eventDtos.Add(eventDto);
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine($"[FilterEventsAsync] Error processing event {ev.Id}: {ex.Message}");
                        Console.WriteLine(ex.StackTrace);
                        // Continue with next event
                    }
                }

                Console.WriteLine($"[FilterEventsAsync] Returning {eventDtos.Count} filtered events");
                return eventDtos;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[FilterEventsAsync] Error: {ex.Message}");
                Console.WriteLine(ex.StackTrace);
                throw; // Re-throw to be handled by the controller
            }
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
    var comments = await _comments.Find(c => c.PostId == postId).ToListAsync();

    foreach (var comment in comments)
    {
        if (!string.IsNullOrEmpty(comment.UserId))
        {
            var user = await _users.Find(u => u.Id == comment.UserId).FirstOrDefaultAsync();
            if (user != null)
            {
                comment.Username = user.Username ?? "Anonymous";
                comment.UserImage = user.ProfileImageUrl; // ✅ Add this if your AppUser has ImageUrl
            }
        }
    }

    return comments;
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
            { "username", "$user.Username" }
        })
    };

            return await _events.Aggregate<EventDto>(pipeline).ToListAsync();
        }
    }
}