using Backend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Linq;
using System.Threading.Tasks;

namespace Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ProfileDetailController : ControllerBase
    {
        private readonly ProfileDetailService _profileService;

        public ProfileDetailController(ProfileDetailService profileService)
        {
            _profileService = profileService;
        }

        [HttpGet("me")]
        [Authorize]
        public async Task<IActionResult> GetMyProfile()
        {
            var userId = User.Claims
                .FirstOrDefault(c => c.Type == "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier")
                ?.Value;

            if (string.IsNullOrEmpty(userId))
                return Unauthorized("User ID not found in token.");

            var user = await _profileService.GetUserByIdAsync(userId);
            if (user == null)
                return NotFound("User not found.");

            return Ok(new
            {
                user.Username,
                user.Description,
                ProfileImageUrl = user.ProfileImageUrl
            });
        }

        [HttpGet("my-events")]
        [Authorize]
        public async Task<IActionResult> GetMyEvents()
        {
            var userId = User.Claims
                .FirstOrDefault(c => c.Type == "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier")
                ?.Value;

            if (string.IsNullOrEmpty(userId))
                return Unauthorized("User ID not found in token.");

            var events = await _profileService.GetEventsByUserIdAsync(userId);

            return Ok(events);
        }

[HttpGet("events/{username}")]
[AllowAnonymous] // or [Authorize]
public async Task<IActionResult> GetEventsByUsername(string username)
{
    if (string.IsNullOrWhiteSpace(username))
        return BadRequest("Username is required.");

    var events = await _profileService.GetEventsByUsernameAsync(username);

            if (events == null || !events.Any())
                return NotFound($"No events found for user '{username}'.");

            return Ok(events);
        }

        [HttpGet("description/{username}")]
        [AllowAnonymous] // or [Authorize] if you want only logged-in users
        public async Task<IActionResult> GetDescriptionByUsername(string username)
        {
            if (string.IsNullOrWhiteSpace(username))
                return BadRequest("Username is required.");

            var (description, profileImageUrl) = await _profileService.GetDescriptionByUsernameAsync(username);

            if (description == null && profileImageUrl == null)
                return NotFound($"User '{username}' not found.");

            return Ok(new 
            { 
                Username = username, 
                Description = description,
                ProfileImageUrl = profileImageUrl 
            });
        }

        [HttpGet("posts/count/{username}")]
        [AllowAnonymous] // or [Authorize]
        public async Task<IActionResult> GetPostCountByUsername(string username)
        {
            if (string.IsNullOrWhiteSpace(username))
                return BadRequest("Username is required.");

            var count = await _profileService.GetPostCountByUsernameAsync(username);
            return Ok(new { username, postCount = count });
        }


[HttpGet("my-postcount")]
[Authorize]
public async Task<IActionResult> GetMyPostCount()
{
    var userId = User.Claims
        .FirstOrDefault(c => c.Type == "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier")
        ?.Value;

    if (string.IsNullOrEmpty(userId))
        return Unauthorized("User ID not found in token.");

    var count = await _profileService.GetPostCountByUserIdAsync(userId);
    return Ok(new { count });
}

[HttpGet("profile-image/me")]
[Authorize]
public async Task<IActionResult> GetMyProfileImage()
{
    var userId = User.Claims
        .FirstOrDefault(c => c.Type == "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier")
        ?.Value;

    if (string.IsNullOrEmpty(userId))
        return Unauthorized("User ID not found in token.");

    var imageUrl = await _profileService.GetProfileImageByUserIdAsync(userId);
    if (imageUrl == null)
        return NotFound("Profile image not found.");

    return Ok(new { ProfileImageUrl = imageUrl });
}

[HttpGet("profile-image/{username}")]
[AllowAnonymous]
public async Task<IActionResult> GetProfileImageByUsername(string username)
{
    if (string.IsNullOrWhiteSpace(username))
        return BadRequest("Username is required.");

    var imageUrl = await _profileService.GetProfileImageByUsernameAsync(username);
    if (imageUrl == null)
        return NotFound($"Profile image not found for user '{username}'.");

    return Ok(new { ProfileImageUrl = imageUrl });
}

[HttpGet("my-bookmarks")]
[Authorize]
public async Task<IActionResult> GetMyBookmarks()
{
    var userId = User.Claims
        .FirstOrDefault(c => c.Type == "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier")
        ?.Value;

    if (string.IsNullOrEmpty(userId))
        return Unauthorized("User ID not found in token.");

    var bookmarkedPosts = await _profileService.GetBookmarkedPostsByUserIdAsync(userId);

    if (bookmarkedPosts == null || !bookmarkedPosts.Any())
        return NotFound("No bookmarked posts found.");

    return Ok(bookmarkedPosts);
}

    }
}