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
    [ApiController]
    [Route("api/[controller]")]
    public class PostsController : ControllerBase
    {
        private readonly IPostService _postService;  // Change to interface
        private readonly ILogger<PostsController> _logger;

        public PostsController(IPostService postService, ILogger<PostsController> logger)  // Change to interface
        {
            _postService = postService;
            _logger = logger;
        }

        // GET: api/posts
        [HttpGet]
        public async Task<ActionResult<List<EventDto>>> Get()
        {
            try
            {
                var events = await _postService.GetAsync();

                var eventDtos = events.Select(e => new EventDto
                {
                    Id = e.Id,
                    Title = e.Title ?? "",
                    Description = e.Description ?? "",
                    Category = e.Category ?? "",
                    ImageUrl = e.ImageUrl
                }).ToList();

                return Ok(eventDtos);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to get posts");
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        // POST: api/posts
        [HttpPost]
        public async Task<ActionResult> Create([FromBody] EventModel ev)
        {
            try
            {
                await _postService.CreateAsync(ev);
                return Ok(new { success = true, postId = ev.Id });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to create post");
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }
    }
}
