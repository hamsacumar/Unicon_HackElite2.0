using Backend.Models;
using Backend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TokenCheckController : ControllerBase
    {
        private readonly ITokenCheckService _tokencheckService;

        public TokenCheckController(ITokenCheckService tokencheckService)
        {
            _tokencheckService = tokencheckService;
        }

        [HttpGet("me")]
        [Authorize] // requires JWT authentication
        public IActionResult GetUserDetails()
        {
            TokenCheck user = _tokencheckService.GetUserFromClaims(User);

            if (user == null)
                return Unauthorized(new { message = "Invalid token." });

            return Ok(user);
        }
    }
}
