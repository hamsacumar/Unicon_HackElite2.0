using Backend.Models;
using System.Collections.Generic;
using System.Threading.Tasks;
using MongoDB.Bson;

namespace Backend.Services
{
    public interface IPostService
    {
        Task<List<EventModel>> GetAsync();
        Task<EventModel?> GetByIdAsync(string id);
        Task CreateAsync(EventModel ev);

        // Mandatory: fetch events with user info
        Task<List<EventDto>> GetEventsWithUsersAsync();

        // Likes
        Task AddLikeAsync(string postId, string userId);
        Task<int> GetLikeCountAsync(string postId);
        Task<bool> CheckIfLikedAsync(string postId, string userId);

        // Comments
        Task<CommentModel> AddCommentAsync(CommentModel comment);
        Task<List<CommentModel>> GetCommentsByPostIdAsync(string postId);
        Task<long> GetCommentCountAsync(string postId);

        // Users
Task<AppUser?> GetUserByIdAsync(string userId);

        // ✅ Bookmarks
        Task<bool> IsBookmarkedAsync(string postId, string userId);
        Task AddBookmarkAsync(string postId, string userId);
        Task RemoveBookmarkAsync(string postId, string userId);
Task<List<EventDto>> GetBookmarksByUserAsync(string userId);
                Task<List<EventDto>> FilterEventsAsync(string? category, DateTime? startDate, DateTime? endDate);
Task<bool> DeletePostAsync(string postId, string userId);


    }
}
