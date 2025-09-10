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

        // ================= Upload Profile Image =================
        [HttpPost("upload-image")]
        [Authorize]
        [Consumes("multipart/form-data")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> UploadImage([FromForm] UploadImageRequest request)
        {
            _logger.LogInformation("=== Starting UploadImage ===");

            try
            {
                // Log request details
                _logger.LogInformation("Request Content-Type: {ContentType}", Request.ContentType);
                _logger.LogInformation("Request Headers: {Headers}",
                    string.Join(", ", Request.Headers.Select(h => $"{h.Key}: {h.Value}")));

                // Extract userId from token
                var userId = User.FindFirst("id")?.Value ??
                             User.FindFirst("http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier")?.Value ??
                             User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;

                _logger.LogInformation($"Extracted user ID: {userId ?? "null"}");

                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized(new { message = "User ID not found in token." });
                }

                if (request?.File == null)
                {
                    _logger.LogWarning("No file was provided in the request");
                    return BadRequest(new { message = "No file was provided" });
                }

                var file = request.File;
                _logger.LogInformation("Received file: {FileName}, {ContentType}, {Length} bytes",
                    file.FileName, file.ContentType, file.Length);

                // Validate file type
                var allowedExtensions = new[] { ".jpg", ".jpeg", ".png" };
                var fileExtension = Path.GetExtension(file.FileName).ToLowerInvariant();

                if (string.IsNullOrEmpty(fileExtension) || !allowedExtensions.Contains(fileExtension))
                {
                    return BadRequest(new { message = "Invalid file type. Only JPG, JPEG, and PNG files are allowed." });
                }

                // Validate file size (max 5MB)
                const int maxFileSize = 5 * 1024 * 1024;
                if (file.Length > maxFileSize)
                {
                    return BadRequest(new { message = "File size exceeds the 5MB limit." });
                }

                // Ensure uploads folder exists
                var uploadsFolder = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads");
                Directory.CreateDirectory(uploadsFolder);

                var fileName = $"profile_{userId}_{DateTime.UtcNow:yyyyMMddHHmmss}{fileExtension}";
                var savePath = Path.Combine(uploadsFolder, fileName);

                _logger.LogInformation("Saving file: {FileName} -> {SavePath}", file.FileName, savePath);

                await using (var stream = new FileStream(savePath, FileMode.Create))
                {
                    await file.CopyToAsync(stream);
                    await stream.FlushAsync();
                }

                var fileInfo = new FileInfo(savePath);
                if (!fileInfo.Exists || fileInfo.Length == 0)
                {
                    throw new Exception("File was not written correctly.");
                }

                var imageUrl = $"/uploads/{fileName}";
                _logger.LogInformation("Updating profile image for user {UserId} to {ImageUrl}", userId, imageUrl);

                await _userService.UpdateProfileImage(userId, imageUrl);

                return Ok(new { message = "Profile image updated", imageUrl });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error uploading profile image");
                return StatusCode(500, new
                {
                    success = false,
                    message = "An error occurred while uploading profile image.",
                    error = ex.Message
                });
            }
        }

        // ================= Skip Profile Image =================
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

                var allClaims = User.Claims.Select(c => $"{c.Type}:{c.Value}").ToList();
                _logger.LogInformation("Available claims: {Claims}", string.Join(", ", allClaims));

                var userId = User.Claims
                    .Where(c => c.Type == "id" ||
                                c.Type == "sub" ||
                                c.Type == "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier" ||
                                c.Type == System.Security.Claims.ClaimTypes.NameIdentifier)
                    .Select(c => c.Value)
                    .FirstOrDefault();

                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized(new
                    {
                        success = false,
                        message = "User ID not found in token. Please login again."
                    });
                }

                var result = await _userService.UpdateProfileImage(userId, null);
                if (!result)
                {
                    return StatusCode(500, new
                    {
                        success = false,
                        message = "Failed to update profile image. Please try again later."
                    });
                }

                return Ok(new
                {
                    success = true,
                    message = "Profile image skipped successfully."
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error skipping profile image");
                return StatusCode(500, new
                {
                    success = false,
                    message = "An error occurred while skipping profile image.",
                    error = ex.Message
                });
            }
        }
    }
}
