//controllers/postscontroller.cs

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Backend.Models;
using Backend.Services;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Backend.Controllers
{
    [Authorize] // <-- ensures JWT is required for all actions
    [ApiController]
    [Route("api/[controller]")]
    public class PostsController : ControllerBase
    {
        private readonly IPostService _postService;
        private readonly ILogger<PostsController> _logger;

        public PostsController(IPostService postService, ILogger<PostsController> logger)
        {
            _postService = postService;
            _logger = logger;
        }

        // -------------------- GET ALL POSTS --------------------
        [AllowAnonymous] // Anyone can view posts
        [HttpGet]
        public async Task<ActionResult<List<EventDto>>> GetAllPosts()
        {
            try
            {
                var eventsWithUsers = await _postService.GetEventsWithUsersAsync();
                return Ok(eventsWithUsers);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to fetch posts with user details.");
                return StatusCode(500, new { success = false, message = "Unable to fetch posts. " + ex.Message });
            }
        }

        // -------------------- GET SINGLE POST --------------------
        [AllowAnonymous]
        [HttpGet("filter")]
        public async Task<ActionResult<List<EventDto>>> GetFilteredEvents(
            [FromQuery] string? category,
            [FromQuery] string? startDate,
            [FromQuery] string? endDate)
        {
            try
            {
                _logger.LogInformation($"[GetFilteredEvents] Filtering events - Category: {category}, StartDate: {startDate}, EndDate: {endDate}");
                
                // Parse dates if provided
                DateTime? parsedStartDate = null;
                DateTime? parsedEndDate = null;
                
                if (!string.IsNullOrEmpty(startDate) && DateTime.TryParse(startDate, out var start))
                {
                    parsedStartDate = start;
                }
                
                if (!string.IsNullOrEmpty(endDate) && DateTime.TryParse(endDate, out var end))
                {
                    // Set to end of day
                    parsedEndDate = end.Date.AddDays(1).AddTicks(-1);
                }
                
                var filteredEvents = await _postService.FilterEventsAsync(category, parsedStartDate, parsedEndDate);
                _logger.LogInformation($"[GetFilteredEvents] Found {filteredEvents?.Count ?? 0} events matching the filter");
                
                return Ok(filteredEvents);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Failed to filter events. Category: {category}, StartDate: {startDate}, EndDate: {endDate}");
                return StatusCode(500, new { 
                    success = false, 
                    message = "Unable to filter events. " + ex.Message,
                    details = ex.StackTrace
                });
            }
        }

        [AllowAnonymous]
        [HttpGet("{id}")]
        public async Task<ActionResult<EventDto>> GetPostById(string id)
        {
            try
            {
                var post = await _postService.GetByIdAsync(id);
                if (post == null)
                    return NotFound(new { success = false, message = "Post not found." });

                var eventsWithUsers = await _postService.GetEventsWithUsersAsync();
                var postWithUser = eventsWithUsers.Find(e => e.Id == id);
                return Ok(postWithUser);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Failed to fetch post with id {id}.");
                return StatusCode(500, new { success = false, message = "Unable to fetch post. " + ex.Message });
            }
        }

        // -------------------- LIKE POST --------------------
        [HttpPost("{id}/like")]
        public async Task<IActionResult> LikePost(string id)
        {
            var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
                return Unauthorized(new { success = false, message = "User not logged in." });

            // Add like only if not already liked
            var isAlreadyLiked = await _postService.CheckIfLikedAsync(id, userId);
            if (isAlreadyLiked)
                return BadRequest(new { success = false, message = "You already liked this post." });

            await _postService.AddLikeAsync(id, userId);

            var likeCount = await _postService.GetLikeCountAsync(id);
            return Ok(new { success = true, likeCount });
        }

        // -------------------- CHECK IF POST IS LIKED --------------------
        [HttpGet("{id}/isLiked")]
        public async Task<IActionResult> IsLiked(string id)
        {
            var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
                return Unauthorized(new { success = false, message = "User not logged in." });

            var existing = await _postService.CheckIfLikedAsync(id, userId);
            return Ok(new { isLiked = existing });
        }

        // -------------------- GET LIKE COUNT --------------------
        [AllowAnonymous]
        [HttpGet("{id}/likeCount")]
        public async Task<IActionResult> GetLikeCount(string id)
        {
            var likeCount = await _postService.GetLikeCountAsync(id);
            return Ok(new { likeCount });
        }

        // -------------------- ADD COMMENT --------------------
[HttpPost("{id}/comment")]
public async Task<IActionResult> CommentPost(string id, [FromBody] CommentModel comment)
{
    var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
    if (string.IsNullOrEmpty(userId))
        return Unauthorized(new { success = false, message = "User not logged in." });

    // Fetch user details
    var user = await _postService.GetUserByIdAsync(userId);

    // Fill comment details
    comment.PostId = id;
    comment.UserId = userId;
    comment.Username = user?.Username ?? "Anonymous";
    comment.UserImage = user?.ProfileImageUrl;  // include user image
    comment.CreatedAt = DateTime.UtcNow;

    // Add comment via service
    var savedComment = await _postService.AddCommentAsync(comment);

    var commentWithUser = new
    {
        savedComment.Id,
        savedComment.PostId,
        savedComment.UserId,
        savedComment.Username,
        savedComment.UserImage,
        text = savedComment.Text,
        savedComment.CreatedAt
    };

    return Ok(new { success = true, comment = commentWithUser });
}


        [HttpPost("{id}/bookmark")]
public async Task<IActionResult> ToggleBookmark(string id)
{
    var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
    if (string.IsNullOrEmpty(userId))
        return Unauthorized(new { success = false, message = "User not logged in." });

    var isBookmarked = await _postService.IsBookmarkedAsync(id, userId);
    if (isBookmarked)
        await _postService.RemoveBookmarkAsync(id, userId);
    else
        await _postService.AddBookmarkAsync(id, userId);

    return Ok(new { success = true, isBookmarked = !isBookmarked });
}

[HttpGet("{id}/isBookmarked")]
public async Task<IActionResult> IsBookmarked(string id)
{
    var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
    if (string.IsNullOrEmpty(userId))
        return Unauthorized(new { success = false, message = "User not logged in." });

    var existing = await _postService.IsBookmarkedAsync(id, userId);
    return Ok(new { isBookmarked = existing });
}

[HttpGet("bookmarks")]
public async Task<IActionResult> GetUserBookmarks()
{
    var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
    if (string.IsNullOrEmpty(userId))
        return Unauthorized(new { success = false, message = "User not logged in." });

    var bookmarks = await _postService.GetBookmarksByUserAsync(userId);
    return Ok(new { success = true, bookmarks });
}


// -------------------- GET COMMENTS --------------------
[AllowAnonymous]
[HttpGet("{id}/comments")]
public async Task<ActionResult<List<object>>> GetComments(string id)
{
    _logger.LogInformation($"Fetching comments for post: {id}");
    
    if (string.IsNullOrEmpty(id))
    {
        _logger.LogWarning("Post ID is null or empty");
        return BadRequest(new { success = false, message = "Post ID is required" });
    }

    try
    {
        _logger.LogDebug($"Calling GetCommentsByPostIdAsync for post: {id}");
        var comments = await _postService.GetCommentsByPostIdAsync(id);
        _logger.LogDebug($"Retrieved {comments?.Count ?? 0} comments for post: {id}");

        if (comments == null)
        {
            _logger.LogWarning($"No comments found for post: {id}");
            return Ok(new List<object>());
        }

        // Directly use stored username and userImage from the comment
        var response = comments.Select(c => new
        {
            id = c?.Id ?? string.Empty,
            postId = c?.PostId ?? string.Empty,
            userId = c?.UserId ?? string.Empty,
            username = c?.Username ?? "Anonymous",
            userImage = c?.UserImage ?? string.Empty,
            text = c?.Text ?? string.Empty,
            createdAt = c?.CreatedAt ?? DateTime.UtcNow
        }).ToList();

        _logger.LogInformation($"Successfully processed {response.Count} comments for post: {id}");
        return Ok(response);
    }
    catch (Exception ex)
    {
        _logger.LogError(ex, $"Failed to fetch comments for post {id}");
        return StatusCode(500, new { 
            success = false, 
            message = "Unable to fetch comments.",
            error = ex.Message,
            stackTrace = ex.StackTrace
        });
    }
}

// -------------------- GET COMMENT COUNT --------------------

[AllowAnonymous]
[HttpGet("{id}/comments/count")]
public async Task<IActionResult> GetCommentCount(string id)
{
    try
    {
        var count = await _postService.GetCommentCountAsync(id);
        return Ok(new { count });
    }
    catch (Exception ex)
    {
        _logger.LogError(ex, $"Failed to fetch comment count for post {id}");
        return StatusCode(500, new { success = false, message = "Unable to fetch comment count." });
    }
} // end of GetCommentCount

// -------------------- DELETE POST --------------------
[HttpDelete("{id}")]
public async Task<IActionResult> DeletePost(string id)
{
    var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
    if (string.IsNullOrEmpty(userId))
        return Unauthorized(new { success = false, message = "User not logged in." });

    var success = await _postService.DeletePostAsync(id, userId);
    if (!success) 
        return NotFound(new { success = false, message = "Post not found or not owned by user" });

    return Ok(new { success = true, message = "Post deleted successfully" });
}


} // end of PostsController class
} // end of namespace Backend.Controllers


