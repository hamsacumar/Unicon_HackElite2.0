using Backend.Models;
using Backend.Settings;
using Microsoft.Extensions.Options;
using MongoDB.Driver;
using MongoDB.Bson;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;

namespace Backend.Services
{
    public class PostService : IPostService
    {
        private readonly IMongoCollection<EventModel> _events;
        private readonly IMongoCollection<AppUser> _users;
        private readonly IMongoCollection<LikeModel> _likes;
        private readonly IMongoCollection<CommentModel> _comments;
        private readonly IMongoCollection<BookmarkModel> _bookmarks;
        private readonly ILogger<PostService> _logger;

        public PostService(IMongoClient mongoClient, IOptions<MongoDbSettings> settings, ILogger<PostService> logger)
        {
            _logger = logger;
            var database = mongoClient.GetDatabase(settings.Value.DatabaseName);

            // Collections used in this service
            _events = database.GetCollection<EventModel>("events");
            _users = database.GetCollection<AppUser>("Users");
            _likes = database.GetCollection<LikeModel>("likes");
            _comments = database.GetCollection<CommentModel>("comments");
            _bookmarks = database.GetCollection<BookmarkModel>("bookmarks");
            
            _logger.LogInformation("PostService initialized");
        }

       public async Task<AppUser?> GetUserByIdAsync(string userId)
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
                        AppUser? user = null;
                        string username = "Unknown";
                        string? userImage = null;
                        
                        try 
                        {
                            if (string.IsNullOrEmpty(ev.UserId))
                            {
                                Console.WriteLine("[FilterEventsAsync] UserId is null or empty");
                            }
                            else
                            {
                                Console.WriteLine($"[FilterEventsAsync] Retrieving user with ID: {ev.UserId}");
                                user = await GetUserByIdAsync(ev.UserId);
                                if (user != null)
                                {
                                    username = user.Username ?? "Unknown";
                                    userImage = user.ProfileImageUrl ?? string.Empty;
                                    Console.WriteLine($"[FilterEventsAsync] Found user: {username}");
                                }
                                else
                                {
                                    Console.WriteLine($"[FilterEventsAsync] User not found for ID: {ev.UserId}");
                                }
                            }
                        }
                        catch (Exception userEx)
                        {
                            Console.WriteLine($"[FilterEventsAsync] Error retrieving user {ev.UserId}: {userEx.Message}");
                            // Continue with default values
                        }
                        
                        var eventDto = new EventDto
                        {
                            Id = ev.Id ?? string.Empty,
                            Title = ev.Title ?? "No Title",
                            Description = ev.Description ?? string.Empty,
                            Category = ev.Category ?? "Uncategorized",
                            ImageUrl = ev.ImageUrl,
                            UserId = ev.UserId ?? string.Empty,
                            Username = !string.IsNullOrEmpty(username) ? username : "Unknown",
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

        public async Task AddLikeAsync(string postId, string userId)
        {
            var existing = await _likes.Find(l => l.PostId == postId && l.UserId == userId).FirstOrDefaultAsync();
            if (existing == null)
            {
                await _likes.InsertOneAsync(new LikeModel { PostId = postId, UserId = userId });
            }
        }

        public async Task<int> GetLikeCountAsync(string postId)
        {
            return (int)await _likes.CountDocumentsAsync(l => l.PostId == postId);
        }

        public async Task<bool> CheckIfLikedAsync(string postId, string userId)
        {
            var existing = await _likes.Find(l => l.PostId == postId && l.UserId == userId).FirstOrDefaultAsync();
            return existing != null;
        }
/* ================================
   Comments Section
================================== */
public async Task<CommentModel> AddCommentAsync(CommentModel comment)
{
    // Ensure correct user info is stored
    var user = await _users.Find(u => u.Id == comment.UserId).FirstOrDefaultAsync();
    comment.Username = user?.Username ?? "Anonymous";
    comment.UserImage = user?.ProfileImageUrl ?? string.Empty;
    comment.CreatedAt = DateTime.UtcNow;

    await _comments.InsertOneAsync(comment);
    return comment;
}

public async Task<List<CommentModel>> GetCommentsByPostIdAsync(string postId)
{
    if (string.IsNullOrEmpty(postId))
    {
        _logger?.LogError("Post ID cannot be null or empty");
        throw new ArgumentException("Post ID is required", nameof(postId));
    }

    try
    {
        // Ensure database is accessible
        var database = _comments.Database;

        // Fetch collection names safely
        var cursor = await database.ListCollectionNamesAsync();
        var collectionNames = await cursor.ToListAsync();
        _logger?.LogDebug($"Collections in DB: {string.Join(", ", collectionNames)}");

        if (!collectionNames.Contains("comments"))
        {
            _logger?.LogWarning("Comments collection does not exist in the database");
            return new List<CommentModel>();
        }

        // Build filter and sort
        var filter = Builders<CommentModel>.Filter.Eq(c => c.PostId, postId);
        var sort = Builders<CommentModel>.Sort.Ascending(c => c.CreatedAt);

        // Fetch comments
        using var commentCursor = await _comments.FindAsync(filter, new FindOptions<CommentModel> { Sort = sort });
        var comments = await commentCursor.ToListAsync();

        _logger?.LogDebug($"Found {comments.Count} comments for post: {postId}");

        // Ensure safe values
        foreach (var comment in comments)
        {
            if (comment != null)
            {
                comment.Username = !string.IsNullOrWhiteSpace(comment.Username) ? comment.Username : "Anonymous";
                comment.Text = comment.Text ?? string.Empty;
                comment.UserImage = comment.UserImage ?? string.Empty;
            }
        }

        return comments;
    }
    catch (MongoCommandException mce) when (mce.Code == 13 || mce.Code == 18)
    {
        _logger?.LogError(mce, "Authentication failed while accessing MongoDB");
        throw new UnauthorizedAccessException("Database authentication failed", mce);
    }
    catch (TimeoutException tex)
    {
        _logger?.LogError(tex, "Timeout while accessing MongoDB");
        throw new TimeoutException("Database operation timed out", tex);
    }
    catch (Exception ex)
    {
        _logger?.LogError(ex, $"Error fetching comments for post {postId}");
        throw new ApplicationException($"Failed to retrieve comments: {ex.Message}", ex);
    }
}

public async Task<long> GetCommentCountAsync(string postId)
{
    // Count all comments for a post
    return await _comments.CountDocumentsAsync(c => c.PostId == postId);
}


        /* ================================
           Events
        ================================== */

        public async Task<List<EventModel>> GetAsync() =>
            await _events.Find(_ => true).ToListAsync();

      public async Task<EventModel?> GetByIdAsync(string id) =>
    await _events.Find(ev => ev.Id == id).FirstOrDefaultAsync();

        public async Task CreateAsync(EventModel ev) =>
            await _events.InsertOneAsync(ev);

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
                    { "_id", 1 },
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

        /* ================================
           Bookmarks
        ================================== */

        public async Task<bool> IsBookmarkedAsync(string postId, string userId)
        {
            var existing = await _bookmarks.Find(b => b.PostId == postId && b.UserId == userId).FirstOrDefaultAsync();
            return existing != null;
        }

        public async Task AddBookmarkAsync(string postId, string userId)
        {
            if (!await IsBookmarkedAsync(postId, userId))
            {
                await _bookmarks.InsertOneAsync(new BookmarkModel
                {
                    PostId = postId,
                    UserId = userId,
                    CreatedAt = DateTime.UtcNow
                });
            }
        }

        public async Task RemoveBookmarkAsync(string postId, string userId)
        {
            await _bookmarks.DeleteOneAsync(b => b.PostId == postId && b.UserId == userId);
        }

     


    
public async Task<bool> DeletePostAsync(string postId, string userId)
{
    // Ensure the post exists and belongs to the user
    var post = await _events.Find(ev => ev.Id == postId && ev.UserId == userId).FirstOrDefaultAsync();
    if (post == null)
        return false;

    // Delete the post
    await _events.DeleteOneAsync(ev => ev.Id == postId);

    // Also clean up related data
    await _likes.DeleteManyAsync(l => l.PostId == postId);
    await _comments.DeleteManyAsync(c => c.PostId == postId);
    await _bookmarks.DeleteManyAsync(b => b.PostId == postId);

    return true;
}

// ================================
// Bookmarks
// ==================================
public async Task<List<EventDto>> GetBookmarksByUserAsync(string userId)
{
    _logger.LogInformation($"[GetBookmarksByUserAsync] Fetching bookmarks for user: {userId}");

    // Try to parse userId as ObjectId
    ObjectId objectUserId;
    bool isObjectId = ObjectId.TryParse(userId, out objectUserId);

    // Build filter: works for both string and ObjectId storage
    var matchStage = isObjectId
        ? new BsonDocument("$match", new BsonDocument("userId", objectUserId))
        : new BsonDocument("$match", new BsonDocument("userId", userId));

  var pipeline = new List<BsonDocument>
{
    new BsonDocument("$match", new BsonDocument("userId", userId)),

    // Convert postId string -> ObjectId for lookup
    new BsonDocument("$addFields", new BsonDocument
    {
        { "postIdObjectId", new BsonDocument("$convert", new BsonDocument
            {
                { "input", "$postId" },
                { "to", "objectId" },
                { "onError", BsonNull.Value },
                { "onNull", BsonNull.Value }
            })
        }
    }),

    // Lookup event data
    new BsonDocument("$lookup", new BsonDocument
    {
        { "from", "events" },
        { "localField", "postIdObjectId" },
        { "foreignField", "_id" },
        { "as", "eventData" }
    }),

    new BsonDocument("$unwind", "$eventData"),
    new BsonDocument("$sort", new BsonDocument("createdAt", -1)),

    // Lookup user who created the event
    new BsonDocument("$lookup", new BsonDocument
    {
        { "from", "Users" },
        { "localField", "eventData.userId" },
        { "foreignField", "_id" },
        { "as", "userData" }
    }),
    new BsonDocument("$unwind", "$userData"),

    new BsonDocument("$project", new BsonDocument
    {
        { "id", new BsonDocument("$toString", "$eventData._id") },
        { "title", "$eventData.title" },
        { "description", "$eventData.description" },
        { "category", "$eventData.category" },
        { "imageUrl", "$eventData.imageUrl" },
        { "userId", new BsonDocument("$toString", "$userData._id") },
        { "username", "$userData.Username" },
        { "userImage", "$userData.ProfileImageUrl" }
    })
};


    var bookmarks = await _bookmarks.Aggregate<BsonDocument>(pipeline).ToListAsync();

    // Map results to DTOs
    return bookmarks.Select(b => new EventDto
    {
        Id = b["id"].AsString,
        Title = b["title"].AsString,
        Description = b["description"].AsString,
        Category = b["category"].AsString,
        ImageUrl = b["imageUrl"].AsString,
        UserId = b["userId"].AsString,
        Username = b["username"].AsString,
        UserImage = b["userImage"].AsString
    }).ToList();
}



    }
}

  