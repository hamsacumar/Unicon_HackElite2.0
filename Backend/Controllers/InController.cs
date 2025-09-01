using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Backend.Models;
using Backend.Services;
using Microsoft.Extensions.Logging;
using System;
using System.IO;
using System.Threading.Tasks;
using System.Collections.Generic;
using System.Security.Claims;

namespace Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Organizer")] // Only Organization role can access
    public class EventsController : ControllerBase
    {
        private readonly InputService _inputService;
        private readonly ILogger<EventsController> _logger;
        private readonly string _uploadFolder;

        public EventsController(InputService inputService, ILogger<EventsController> logger, IWebHostEnvironment env)
        {
            _inputService = inputService;
            _logger = logger;

            _uploadFolder = Path.Combine(env.WebRootPath ?? "wwwroot", "uploads");
            if (!Directory.Exists(_uploadFolder))
                Directory.CreateDirectory(_uploadFolder);
        }

        // POST: api/events
        [HttpPost]
        [RequestSizeLimit(50_000_000)]
        public async Task<ActionResult> Create([FromForm] EventModel ev, IFormFile? image)
        {
            try
            {

                var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (string.IsNullOrEmpty(userId))
                    return Unauthorized(new { success = false, message = "User not authenticated" });
                    ev.UserId = userId;
                if (image != null && image.Length > 0)
                {
                    var ext = Path.GetExtension(image.FileName);
                    var fileName = $"img_{Guid.NewGuid()}{ext}";
                    var savePath = Path.Combine(_uploadFolder, fileName);

                    using (var stream = new FileStream(savePath, FileMode.Create))
                    {
                        await image.CopyToAsync(stream);
                    }

                    ev.ImageUrl = $"/uploads/{fileName}";
                }

                await _inputService.CreateAsync(ev);

                return Ok(new { success = true, eventId = ev.Id });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Create event failed");
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        // GET: api/events
        [HttpGet]
        public async Task<ActionResult<List<EventModel>>> Get()
        {
            try
            {
                var events = await _inputService.GetAsync();
                return Ok(events);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to get events");
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }
    }
}
