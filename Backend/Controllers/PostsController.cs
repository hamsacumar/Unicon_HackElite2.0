using Microsoft.AspNetCore.Mvc;
using Backend.Models;
using Backend.Services;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Backend.Controllers
{
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

        // GET: api/posts
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
                return StatusCode(500, new
                {
                    success = false,
                    message = "Unable to fetch posts. " + ex.Message
                });
            }
        }

        // GET: api/posts/{id}
        [HttpGet("{id}")]
        public async Task<ActionResult<EventDto>> GetPostById(string id)
        {
            try
            {
                var post = await _postService.GetByIdAsync(id);
                if (post == null)
                    return NotFound(new { success = false, message = "Post not found." });

                // Optional: fetch user details for this post
                var eventsWithUsers = await _postService.GetEventsWithUsersAsync();
                var postWithUser = eventsWithUsers.Find(e => e.Id == id);
                return Ok(postWithUser);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Failed to fetch post with id {id}.");
                return StatusCode(500, new
                {
                    success = false,
                    message = "Unable to fetch post. " + ex.Message
                });
            }
        }

        // POST: api/posts/{id}/like
        [HttpPost("{id}/like")]
        public async Task<IActionResult> LikePost(string id, [FromBody] LikeRequest request)
        {
            await _postService.AddLikeAsync(id, request.UserId);
            var likeCount = await _postService.GetLikeCountAsync(id);
            return Ok(new { success = true, likeCount });
        }

        // POST: api/posts/{id}/comment
        [HttpPost("{id}/comment")]
        public async Task<IActionResult> CommentPost(string id, [FromBody] CommentModel comment)
        {
            comment.PostId = id;
            comment.CreatedAt = DateTime.UtcNow;
            await _postService.AddCommentAsync(comment);

            return Ok(new { success = true, comment });
        }

        // GET: api/posts/{id}/comments
        [HttpGet("{id}/comments")]
        public async Task<ActionResult<List<CommentModel>>> GetComments(string id)
        {
            var comments = await _postService.GetCommentsByPostIdAsync(id);
            return Ok(comments);
        }

        // GET: api/posts/{id}/likeCount
        [HttpGet("{id}/likeCount")]
        public async Task<IActionResult> GetLikeCount(string id)
        {
            var count = await _postService.GetLikeCountAsync(id);
            return Ok(new { likeCount = count });
        }

        // GET: api/posts/{id}/isLiked?userId=123
        [HttpGet("{id}/isLiked")]
        public async Task<IActionResult> IsLiked(string id, [FromQuery] string userId)
        {
            var existing = await _postService.CheckIfLikedAsync(id, userId);
            return Ok(new { isLiked = existing });
        }

        // GET: api/posts/{id}/comments/count
        [HttpGet("{id}/comments/count")]
        public async Task<IActionResult> GetCommentCount(string id)
        {
            var comments = await _postService.GetCommentsByPostIdAsync(id);
            return Ok(new { count = comments.Count });
        }
    }
}
