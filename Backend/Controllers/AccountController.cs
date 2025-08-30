// Backend/Controllers/AccountController.cs
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Backend.Services;
using Backend.Models.DTOs;
using System.Threading.Tasks;
using System.Security.Claims;

namespace Backend.Controllers
{
    [ApiController]
    [Route("api/account")]
    [Authorize]
    public class AccountController : ControllerBase
    {
        private readonly IUserService _userService;

        public AccountController(IUserService userService)
        {
            _userService = userService;
        }

        [HttpPost("classify")]
        public async Task<IActionResult> Classify([FromBody] ClassifyDto dto)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (userId == null) return Unauthorized();
            var user = await _userService.GetById(userId);
            if (user == null || !user.IsEmailVerified)
            {
                return BadRequest("Invalid request.");
            }

            if (string.IsNullOrEmpty(dto.FirstName)) return BadRequest("First name is required.");
            if (string.IsNullOrEmpty(dto.LastName)) return BadRequest("Last name is required.");
            if (string.IsNullOrEmpty(dto.Role) || !new[] { "Student", "Admin", "Organizer" }.Contains(dto.Role))
            {
                return BadRequest("Invalid role. Must be Student, Admin, or Organizer.");
            }
            if (string.IsNullOrEmpty(dto.Address)) return BadRequest("Address is required.");

            user.FirstName = dto.FirstName;
            user.LastName = dto.LastName;
            user.Role = dto.Role;
            user.Address = dto.Address;
            user.Description = dto.Description;

            await _userService.Update(user);

            return Ok(new { Message = "Account classified successfully." });
        }
    }
}