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

    // New methods for likes & comments
    Task AddLikeAsync(string postId, string userId);
    Task<int> GetLikeCountAsync(string postId);

    Task<CommentModel> AddCommentAsync(CommentModel comment);
    Task<List<CommentModel>> GetCommentsByPostIdAsync(string postId);
    Task<bool> CheckIfLikedAsync(string postId, string userId);
    Task<AppUser> GetUserByIdAsync(string userId);
    
    Task<List<EventDto>> FilterEventsAsync(string? category, DateTime? startDate, DateTime? endDate);
}

}
