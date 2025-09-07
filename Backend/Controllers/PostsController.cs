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

        // -------------------- GET COMMENTS --------------------
        [AllowAnonymous]
        [HttpGet("{id}/comments")]
        public async Task<ActionResult<List<CommentModel>>> GetComments(string id)
        {
            try
            {
                var comments = await _postService.GetCommentsByPostIdAsync(id);

                // Return only safe properties
                var response = comments.Select(c => new
                {
                    id = c.Id,
                    postId = c.PostId,
                    userId = c.UserId,
                    username = c.Username,
                    userImage = c.UserImage,
                    text = c.Text,
                    createdAt = c.CreatedAt
                }).ToList();

                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Failed to fetch comments for post {id}");
                return StatusCode(500, new { success = false, message = "Unable to fetch comments." });
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
        }
    } // End of PostsController class
} // End of namespace
