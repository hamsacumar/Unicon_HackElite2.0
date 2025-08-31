using Backend.Models;
using Backend.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using System;
using System.IO;
using System.Threading.Tasks;

namespace EventApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class EventsController : ControllerBase
    {
        private readonly MongoService _mongo;
        private readonly ILogger<EventsController> _logger;
        private readonly string _uploadFolder;

        public EventsController(MongoService mongo, ILogger<EventsController> logger, IWebHostEnvironment env)
        {
            _mongo = mongo;
            _logger = logger;
            _uploadFolder = Path.Combine(env.WebRootPath ?? "wwwroot", "uploads");
            if (!Directory.Exists(_uploadFolder)) Directory.CreateDirectory(_uploadFolder);
        }

        [HttpGet]
        public IActionResult Get()
        {
            var list = _mongo.Get();
            return Ok(list);
        }

        [HttpPost]
        [RequestSizeLimit(50_000_000)]
        public async Task<IActionResult> Create()
        {
            try
            {
                var form = await Request.ReadFormAsync();

                var title = form["title"].ToString();
                var description = form["description"].ToString();
                var category = form["category"].ToString();
                var startDateStr = form["startDate"].ToString();
                var endDateStr = form["endDate"].ToString();

                DateTime.TryParse(startDateStr, out var startDate);
                DateTime.TryParse(endDateStr, out var endDate);

                string imageUrl = null;
                var file = form.Files.GetFile("image");

                if (file != null && file.Length > 0)
                {
                    var ext = Path.GetExtension(file.FileName);
                    var fileName = $"img_{Guid.NewGuid()}{ext}";
                    var savePath = Path.Combine(_uploadFolder, fileName);

                    using (var stream = new FileStream(savePath, FileMode.Create))
                    {
                        await file.CopyToAsync(stream);
                    }

                    // imageUrl relative to server host, e.g. /uploads/filename
                    imageUrl = $"/uploads/{fileName}";
                }

                var ev = new EventModel
                {
                    Title = title,
                    Description = description,
                    Category = category,
                    StartDate = startDate,
                    EndDate = endDate,
                    ImageUrl = imageUrl
                };

                _mongo.Create(ev);

                return Ok(new { success = true, eventId = ev.Id });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Create event failed");
                return BadRequest(new { success = false, message = ex.Message });
            }
        }
    }
}
