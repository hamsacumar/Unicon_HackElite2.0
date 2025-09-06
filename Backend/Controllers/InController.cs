using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Backend.Models;
using Backend.Services;
using Microsoft.Extensions.Logging;
using System;
using System.Threading.Tasks;
using System.Collections.Generic;
using System.Security.Claims;

namespace Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Organizer")]
    public class EventsController : ControllerBase
    {
        private readonly InputService _inputService;
        private readonly ILogger<EventsController> _logger;

        public EventsController(InputService inputService, ILogger<EventsController> logger)
        {
            _inputService = inputService;
            _logger = logger;
        }

        [HttpPost]
        public async Task<ActionResult> Create([FromBody] EventCreateDto dto)
        {
            try
            {
                var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (string.IsNullOrEmpty(userId))
                    return Unauthorized(new { success = false, message = "User not authenticated" });

                var ev = new EventModel
                {
                    Title = dto.Title,
                    Description = dto.Description,
                    Category = dto.Category,
                    StartDate = dto.StartDate,
                    EndDate = dto.EndDate,
                    UserId = userId,
                    ImageUrl = dto.ImageUrl
                };

                await _inputService.CreateAsync(ev);

                return Ok(new { success = true, eventId = ev.Id });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Create event failed");
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

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
