using Backend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using System.Threading.Tasks;

namespace Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Organizer")]
    public class UploadController : ControllerBase
    {
        private readonly FileUploadService _fileUploadService;
        private readonly ILogger<UploadController> _logger;

        public UploadController(FileUploadService fileUploadService, ILogger<UploadController> logger)
        {
            _fileUploadService = fileUploadService;
            _logger = logger;
        }

        [HttpPost("image")]
[RequestSizeLimit(50_000_000)]
public async Task<ActionResult> UploadImage([FromForm] FileUploadDto dto)
{
    try
    {
        var imageUrl = await _fileUploadService.UploadImageAsync(dto.File);
        if (imageUrl == null)
            return BadRequest(new { success = false, message = "No file uploaded" });

        return Ok(new { success = true, imageUrl });
    }
    catch (Exception ex)
    {
        _logger.LogError(ex, "Image upload failed");
        return StatusCode(500, new { success = false, message = ex.Message });
    }
}

    }
}
