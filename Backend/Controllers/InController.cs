using Microsoft.AspNetCore.Mvc;
using Backend.Models;
using Backend.Services;
using Microsoft.Extensions.Logging;
using System;
using System.Threading.Tasks;
using System.IO;

namespace Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class EventsController : ControllerBase
    {
        private readonly InputService _inputService;
        private readonly ILogger<EventsController> _logger;
        private readonly IWebHostEnvironment _env;

        public EventsController(InputService inputService, ILogger<EventsController> logger, IWebHostEnvironment env)
        {
            _inputService = inputService;
            _logger = logger;
            _env = env;
        }

        [HttpPost]
        public async Task<ActionResult> Create([FromForm] EventCreateDto dto)
        {
            try
            {
                // If UserId is null, auto-generate one
                var userId = dto.UserId ?? Guid.NewGuid().ToString();

                string? imageUrl = null;
                if (dto.Image != null)
                {
                    var uploadsFolder = Path.Combine(_env.WebRootPath, "uploads");
                    if (!Directory.Exists(uploadsFolder))
                        Directory.CreateDirectory(uploadsFolder);

                    var fileName = $"{Guid.NewGuid()}_{dto.Image.FileName}";
                    var filePath = Path.Combine(uploadsFolder, fileName);

                    using var stream = new FileStream(filePath, FileMode.Create);
                    await dto.Image.CopyToAsync(stream);

                    imageUrl = $"/uploads/{fileName}";
                }

                var ev = new EventModel
                {
                    Title = dto.Title,
                    Description = dto.Description,
                    Category = dto.Category,
                    StartDate = dto.StartDate,
                    EndDate = dto.EndDate,
                    UserId = userId,
                    ImageUrl = imageUrl
                };

                await _inputService.CreateAsync(ev);

                return Ok(new { success = true, eventId = ev.Id, userId });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Create event failed");
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        [HttpGet]
        public async Task<ActionResult> Get()
        {
            try
            {
                var events = await _inputService.GetAsync();
                return Ok(events);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Get events failed");
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }
    }
}
