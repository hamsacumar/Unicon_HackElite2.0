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
            // Extract only the userId from JWT
            var userId = User.Claims
                .FirstOrDefault(c => c.Type == "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier")
                ?.Value;

            if (string.IsNullOrEmpty(userId))
                return Unauthorized("User ID not found in token.");

            // Get full profile from MongoDB
            var user = await _profileService.GetUserByIdAsync(userId);
            if (user == null)
                return NotFound("User not found.");

            // Return only what you want
            return Ok(new
            {
                user.Username,
                user.Description
            });
        }

    }
}
