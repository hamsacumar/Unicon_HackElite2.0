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

        public async Task<AppUser> GetUserByIdAsync(string userId)
        {
            return await _users.Find(u => u.Id == userId).FirstOrDefaultAsync();
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
    comment.UserImage = user?.ProfileImageUrl;
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

        // ✅ This must be INSIDE the class
        public async Task<List<BsonDocument>> GetBookmarksByUserAsync(string userId)
        {
            var pipeline = new[]
            {
                new BsonDocument("$match", new BsonDocument("UserId", userId)),
                new BsonDocument("$lookup", new BsonDocument
                {
                    { "from", "Posts" },
                    { "localField", "PostId" },
                    { "foreignField", "_id" },
                    { "as", "Post" }
                }),
                new BsonDocument("$unwind", "$Post"),
                new BsonDocument("$lookup", new BsonDocument
                {
                    { "from", "Users" },
                    { "localField", "Post.UserId" },
                    { "foreignField", "_id" },
                    { "as", "Post.User" }
                }),
                new BsonDocument("$unwind", "$Post.User"),
                new BsonDocument("$replaceRoot", new BsonDocument("newRoot", "$Post"))
            };

            return await _bookmarks.Aggregate<BsonDocument>(pipeline).ToListAsync();
        }
    }
}