using Backend.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

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

        // <<< Add this line >>>
        Task<long> GetCommentCountAsync(string postId);

        // Users
        Task<AppUser> GetUserByIdAsync(string userId);
    }
}
