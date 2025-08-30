// Backend/Services/IJwtService.cs
using Backend.Models;

namespace Backend.Services
{
    public interface IJwtService
    {
        string GenerateToken(AppUser user);
    }
}