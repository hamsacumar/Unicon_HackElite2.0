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

        // Upload profile image
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
                
                // Try to get user ID from different possible claim types
                var userId = User.FindFirst("id")?.Value ?? 
                            User.FindFirst("http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier")?.Value ??
                            User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
                
                _logger.LogInformation($"Extracted user ID: {userId ?? "null"}");
                
                if (request?.File == null)
                {
                    _logger.LogWarning("No file was provided in the request");
                    return BadRequest(new { message = "No file was provided" });
                }
                
                _logger.LogInformation("Received file: {FileName}, {ContentType}, {Length} bytes", 
                    request.File.FileName, request.File.ContentType, request.File.Length);
            
            try
            {
                _logger.LogInformation("UploadImage endpoint called");
                
                if (request == null)
                {
                    _logger.LogWarning("Upload request is null");
                    return BadRequest(new { message = "Invalid request" });
                }
                
                _logger.LogInformation("Request received. Files count: {FileCount}", Request.Form.Files?.Count ?? 0);
                _logger.LogInformation("Request headers: {Headers}", string.Join(", ", Request.Headers.Select(h => $"{h.Key}: {h.Value}")));
                
                var file = request.File;
                if (file == null || file.Length == 0)
                {
                    _logger.LogWarning("No file was uploaded or file is empty");
                    _logger.LogWarning("Request form keys: {Keys}", string.Join(", ", Request.Form.Keys));
                    _logger.LogWarning("Request form files: {Files}", string.Join(", ", Request.Form.Files?.Select(f => $"Name: {f.Name}, FileName: {f.FileName}, Length: {f.Length}") ?? new List<string>()));
                    return BadRequest(new { 
                        success = false,
                        message = "No file uploaded or file is empty",
                        formKeys = Request.Form.Keys.ToList(),
                        files = Request.Form.Files?.Select(f => new { 
                            f.Name, 
                            f.FileName, 
                            f.Length,
                            f.ContentType 
                        })
                    });
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
                _logger.LogInformation($"Ensuring uploads directory exists: {uploadsFolder}");
                Directory.CreateDirectory(uploadsFolder);

                var fileName = $"profile_{userId}_{DateTime.UtcNow:yyyyMMddHHmmss}{fileExtension}";
                var savePath = Path.Combine(uploadsFolder, fileName);

                _logger.LogInformation($"Saving file: OriginalName={file.FileName}, SavedName={fileName}, Size={file.Length} bytes, Type={file.ContentType}, Path={savePath}");
                
                try 
                {
                    await using (var stream = new FileStream(savePath, FileMode.Create))
                    {
                        await file.CopyToAsync(stream);
                        await stream.FlushAsync();
                        _logger.LogInformation($"File saved successfully to {savePath}");
                    }
                    
                    // Verify file was written
                    var fileInfo = new FileInfo(savePath);
                    if (!fileInfo.Exists || fileInfo.Length == 0)
                    {
                        _logger.LogError($"File was not written correctly. Exists: {fileInfo.Exists}, Length: {fileInfo.Length} bytes");
                        throw new Exception("Failed to save file to disk");
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, $"Error saving file to {savePath}");
                    throw new Exception($"Failed to save file: {ex.Message}", ex);
                }

                // Get user ID from different possible claim types
                var currentUserId = User.FindFirst("id")?.Value ?? 
                                 User.FindFirst("http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier")?.Value ??
                                 User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
                            
                _logger.LogInformation($"User ID from token: {currentUserId}");
                
                if (string.IsNullOrEmpty(currentUserId))
                {
                    _logger.LogWarning("User ID not found in token. Available claims: {Claims}", 
                        string.Join(", ", User.Claims.Select(c => $"{c.Type}:{c.Value}")));
                    return Unauthorized(new { message = "User ID not found in token." });
                }

                var imageUrl = $"/uploads/{fileName}";
                _logger.LogInformation($"Updating profile image for user {currentUserId} to {imageUrl}");
                
                if (string.IsNullOrEmpty(currentUserId))
                {
                    _logger.LogError("Cannot update profile image: currentUserId is null or empty");
                    throw new InvalidOperationException("User ID is required to update profile image");
                }
                
                await _userService.UpdateProfileImage(currentUserId, imageUrl);
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

        //  Skip uploading profile image
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
                
                // Log all available claims for debugging
                var allClaims = User.Claims.Select(c => $"{c.Type}:{c.Value}").ToList();
                _logger.LogInformation("Available claims in SkipImage: {Claims}", string.Join(", ", allClaims));
            
                // Try to get user ID from all possible claim types
                var userId = User.Claims
                    .Where(c => c.Type == "id" || 
                              c.Type == "sub" ||
                              c.Type == "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier" ||
                              c.Type == System.Security.Claims.ClaimTypes.NameIdentifier)
                    .Select(c => c.Value)
                    .FirstOrDefault();
            
                _logger.LogInformation($"Extracted user ID in SkipImage: {userId ?? "null"}");
                            
                if (string.IsNullOrEmpty(userId))
                {
                    _logger.LogWarning("User ID not found in token. Available claims: {Claims}", 
                        string.Join(", ", User.Claims.Select(c => $"{c.Type}:{c.Value}")));
                    return Unauthorized(new { 
                        success = false,
                        message = "User ID not found in token. Please login again." 
                    });
                }

                _logger.LogInformation("Updating profile image to null for user {UserId}", userId);
                try 
                {
                    var result = await _userService.UpdateProfileImage(userId, null);
                    
                    if (!result)
                    {
                        _logger.LogError("Failed to update profile image for user {UserId} - UserService returned false", userId);
                        return StatusCode(500, new { 
                            success = false,
                            message = "Failed to update profile image. Please try again later." 
                        });
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Exception in SkipImage for user {UserId}: {Message}", userId, ex.Message);
                    return StatusCode(500, new { 
                        success = false,
                        message = "An error occurred while processing your request.",
                        details = ex.Message
                    });
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