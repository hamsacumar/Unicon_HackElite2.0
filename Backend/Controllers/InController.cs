using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Backend.Models;
using Backend.Services;
using Microsoft.Extensions.Logging;
using System;
using System.Threading.Tasks;
using System.Collections.Generic;
using System.Security.Claims;
using Microsoft.AspNetCore.SignalR;
using Hackelite2._0.Hubs;

namespace Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Organizer")]
    public class EventsController : ControllerBase
    {
        private readonly InputService _inputService;
        private readonly INotificationService _notificationService;
        private readonly IHubContext<NotificationHub> _hubContext;
        private readonly ILogger<EventsController> _logger;

        public EventsController(
            InputService inputService, 
            INotificationService notificationService,
            IHubContext<NotificationHub> hubContext,
            ILogger<EventsController> logger)
        {
            _inputService = inputService;
            _notificationService = notificationService;
            _hubContext = hubContext;
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

                // Send notifications to subscribers
                try
                {
#pragma warning disable CS8604 // Possible null reference argument.
                    await _notificationService.SendNotificationsForNewPostAsync(
                        postId: ev.Id,
                        organizerId: userId,
                        title: ev.Title,
                        message: ev.Description,
                        fromUserId: userId
                    );
#pragma warning restore CS8604 // Possible null reference argument.

                    _logger.LogInformation("Notifications sent for new event {EventId}", ev.Id);
                }
                catch (Exception notifEx)
                {
                    _logger.LogError(notifEx, "Failed to send notifications for event {EventId}", ev.Id);
                    // Don't fail the entire request if notifications fail
                }

                return Ok(new { success = true, eventId = ev.Id });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Create event failed");
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        [HttpGet]
        [AllowAnonymous] // Allow anonymous access to view events
        public async Task<ActionResult<List<EventModel>>> Get()
        {
            try
            {
                var events = await _inputService.GetAllAsync();
                return Ok(events);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to get events");
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        [HttpGet("my-events")]
        public async Task<ActionResult<List<EventModel>>> GetMyEvents()
        {
            try
            {
                var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (string.IsNullOrEmpty(userId))
                    return Unauthorized(new { success = false, message = "User not authenticated" });

                var events = await _inputService.GetByUserAsync(userId);
                return Ok(events);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to get user events");
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        [HttpPost("{eventId}/like")]
        [AllowAnonymous]
        public async Task<ActionResult> LikeEvent(string eventId)
        {
            try
            {
                var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (string.IsNullOrEmpty(userId))
                    return Unauthorized(new { success = false, message = "User not authenticated" });

                // Here you would implement the like functionality
                // For now, we'll just send a like notification

                // Get event details (you'd need to implement GetByIdAsync in InputService)
                // var eventModel = await _inputService.GetByIdAsync(eventId);
                
                // Send like notification to event owner
                try
                {
                    await _notificationService.SendLikeNotificationAsync(
                        postOwnerId: "eventOwnerId", // Replace with actual event owner ID
                        likerUserId: userId,
                        postId: eventId,
                        postTitle: "Event Title" // Replace with actual event title
                    );
                }
                catch (Exception notifEx)
                {
                    _logger.LogError(notifEx, "Failed to send like notification for event {EventId}", eventId);
                }

                return Ok(new { success = true, message = "Event liked successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to like event {EventId}", eventId);
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        [HttpPost("{eventId}/comment")]
        [AllowAnonymous]
        public async Task<ActionResult> CommentOnEvent(string eventId, [FromBody] CommentRequest request)
        {
            try
            {
                var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (string.IsNullOrEmpty(userId))
                    return Unauthorized(new { success = false, message = "User not authenticated" });

                if (string.IsNullOrEmpty(request.Comment))
                    return BadRequest(new { success = false, message = "Comment cannot be empty" });

                // Here you would implement the comment functionality
                // For now, we'll just send a comment notification

                try
                {
                    await _notificationService.SendCommentNotificationAsync(
                        postOwnerId: "eventOwnerId", // Replace with actual event owner ID
                        commenterUserId: userId,
                        postId: eventId,
                        postTitle: "Event Title", // Replace with actual event title
                        comment: request.Comment
                    );
                }
                catch (Exception notifEx)
                {
                    _logger.LogError(notifEx, "Failed to send comment notification for event {EventId}", eventId);
                }

                return Ok(new { success = true, message = "Comment added successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to comment on event {EventId}", eventId);
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }
    }

    public class CommentRequest
    {
        public string Comment { get; set; } = string.Empty;
    }
}