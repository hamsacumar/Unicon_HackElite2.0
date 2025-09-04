using Backend.Models;
using Backend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ProfileController : ControllerBase
    {
        private readonly IUserService _userService;
        private readonly ILogger<ProfileController> _logger;

        public ProfileController(IUserService userService, ILogger<ProfileController> logger)
        {
            _userService = userService ?? throw new ArgumentNullException(nameof(userService));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        }

        [HttpGet("test")]
        [AllowAnonymous]
        public IActionResult Test()
        {
            _logger.LogInformation("Test endpoint hit successfully");
            return Ok(new { message = "Profile API is working!" });
        }

        // ✅ Upload profile image
        [HttpPost("upload-image")]
        [Authorize]
        [Consumes("multipart/form-data")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> UploadImage([FromForm] UploadImageRequest request)
        {
            try
            {
                _logger.LogInformation("UploadImage endpoint called");
                
                if (request == null)
                {
                    _logger.LogWarning("Upload request is null");
                    return BadRequest(new { message = "Invalid request" });
                }
                
                var file = request.File;
                if (file == null || file.Length == 0)
                {
                    _logger.LogWarning("No file was uploaded or file is empty");
                    return BadRequest(new { message = "No file uploaded or file is empty" });
                }

                // Validate file type and size
                var allowedExtensions = new[] { ".jpg", ".jpeg", ".png" };
                var fileExtension = Path.GetExtension(file.FileName).ToLowerInvariant();
                if (string.IsNullOrEmpty(fileExtension) || !allowedExtensions.Contains(fileExtension))
                {
                    _logger.LogWarning("Invalid file type: {FileName}", file.FileName);
                    return BadRequest(new { message = "Invalid file type. Only JPG, JPEG, and PNG files are allowed." });
                }

                const int maxFileSize = 5 * 1024 * 1024; // 5MB
                if (file.Length > maxFileSize)
                {
                    _logger.LogWarning("File size exceeds the limit: {FileSize} bytes", file.Length);
                    return BadRequest(new { message = "File size exceeds the 5MB limit." });
                }

                // Ensure uploads folder exists
                var uploadsFolder = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads");
                Directory.CreateDirectory(uploadsFolder);

                var fileName = $"{Guid.NewGuid()}{fileExtension}";
                var savePath = Path.Combine(uploadsFolder, fileName);

                _logger.LogInformation($"Saving file to: {savePath}");
                
                await using (var stream = new FileStream(savePath, FileMode.Create))
                {
                    await file.CopyToAsync(stream);
                }

                var userId = User.FindFirst("id")?.Value;
                _logger.LogInformation($"User ID from token: {userId}");
                
                if (string.IsNullOrEmpty(userId))
                {
                    _logger.LogWarning("User ID not found in token");
                    return Unauthorized("User ID not found in token.");
                }

                var imageUrl = $"/uploads/{fileName}";
                _logger.LogInformation($"Updating profile image for user {userId} to {imageUrl}");
                
                await _userService.UpdateProfileImage(userId, imageUrl);
                _logger.LogInformation("Profile image updated successfully");

                return Ok(new { message = "Profile image updated", imageUrl });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error uploading profile image: {Message}", ex.Message);
                return StatusCode(500, new { 
                    success = false,
                    message = "An error occurred while uploading profile image.",
                    error = ex.Message
                });
            }
        }

        // ✅ Skip uploading profile image
        [HttpPost("skip-image")]
        [Authorize]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> SkipImage()
        {
            try
            {
                _logger.LogInformation("SkipImage endpoint called");
                
                var userId = User.FindFirst("id")?.Value;
                if (string.IsNullOrEmpty(userId))
                {
                    _logger.LogWarning("User ID not found in token");
                    return Unauthorized(new { message = "User ID not found in token." });
                }

                _logger.LogInformation("Updating profile image to null for user {UserId}", userId);
                var result = await _userService.UpdateProfileImage(userId, null);
                
                if (!result)
                {
                    _logger.LogWarning("Failed to update profile image for user {UserId}", userId);
                    return StatusCode(500, new { message = "Failed to update profile image." });
                }
                
                _logger.LogInformation("Profile image skipped successfully for user {UserId}", userId);
                return Ok(new { 
                    success = true,
                    message = "Profile image skipped successfully." 
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error skipping profile image: {Message}", ex.Message);
                return StatusCode(500, new { 
                    success = false,
                    message = "An error occurred while skipping profile image.",
                    error = ex.Message
                });
            }
        }
    }
}
