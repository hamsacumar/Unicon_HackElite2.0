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

        // POST: api/posts
        [HttpPost]
        public async Task<ActionResult> CreatePost([FromBody] EventModel ev)
        {
            try
            {
                if (ev == null)
                    return BadRequest(new { success = false, message = "Invalid post data." });

                await _postService.CreateAsync(ev);
                return Ok(new { success = true, postId = ev.Id });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to create post.");
                return StatusCode(500, new
                {
                    success = false,
                    message = "Unable to create post. " + ex.Message
                });
            }
        }
    }
}
