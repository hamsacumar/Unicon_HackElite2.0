using Backend.Models;
using System.Linq;
using System.Security.Claims;

namespace Backend.Services
{
    public interface ITokenCheckService
    {
        TokenCheck GetUserFromClaims(ClaimsPrincipal user);
    }

    public class TokenCheckService : ITokenCheckService
    {
        public TokenCheck GetUserFromClaims(ClaimsPrincipal user)
        {
            var userId = user.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier)?.Value;
            var role = user.Claims.FirstOrDefault(c => c.Type == ClaimTypes.Role)?.Value;

            if (string.IsNullOrEmpty(userId) || string.IsNullOrEmpty(role))
                return null!;

            return new TokenCheck
            {
                Id = userId,
                Role = role
            };
        }
    }
}
