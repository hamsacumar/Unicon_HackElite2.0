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
            // Try to get user ID from different possible claim types
            var userId = user.Claims.FirstOrDefault(c => 
                c.Type == ClaimTypes.NameIdentifier || 
                c.Type == "nameid" ||
                c.Type == "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"
            )?.Value;

            // Try to get role from different possible claim types
            var role = user.Claims.FirstOrDefault(c => 
                c.Type == ClaimTypes.Role || 
                c.Type == "role" ||
                c.Type == "http://schemas.microsoft.com/ws/2008/06/identity/claims/role"
            )?.Value;

            if (string.IsNullOrEmpty(userId) || string.IsNullOrEmpty(role))
            {
                // Log the available claims for debugging
                var claims = user.Claims.Select(c => $"{c.Type} = {c.Value}");
                System.Console.WriteLine($"Available claims: {string.Join(", ", claims)}");
                return null!;
            }

            return new TokenCheck
            {
                Id = userId,
                Role = role
            };
        }
    }
}
