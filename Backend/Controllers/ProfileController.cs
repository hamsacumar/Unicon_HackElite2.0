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

        public ProfileController(IUserService userService)
        {
            _userService = userService;
        }

        // Upload profile image
        [HttpPost("upload-image")]
        [Authorize]  // Only logged in users
        public async Task<IActionResult> UploadImage([FromForm] IFormFile file)
        {
            if (file == null || file.Length == 0)
                return BadRequest("No file uploaded.");

            // Save to local folder (can replace with Google Cloud later)
            var fileName = $"{Guid.NewGuid()}_{file.FileName}";
            var savePath = Path.Combine("wwwroot/profile-images", fileName);

            Directory.CreateDirectory("wwwroot/profile-images");

            using (var stream = new FileStream(savePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            var userId = User.FindFirst("id")?.Value; // get user id from JWT
            var imageUrl = $"/profile-images/{fileName}";

            await _userService.UpdateProfileImage(userId, imageUrl);

            return Ok(new { message = "Profile image updated", imageUrl });
        }

        // Skip image (just clears profile image)
        [HttpPost("skip-image")]
        [Authorize]
        public async Task<IActionResult> SkipImage()
        {
            var userId = User.FindFirst("id")?.Value;
            await _userService.UpdateProfileImage(userId, null);

            return Ok(new { message = "Skipped profile image" });
        }
    }
}
