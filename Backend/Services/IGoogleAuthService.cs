// Backend/Services/IGoogleAuthService.cs
using Google.Apis.Auth;
using System.Threading.Tasks;

namespace Backend.Services
{
    public interface IGoogleAuthService
    {
        Task<GoogleJsonWebSignature.Payload> ValidateToken(string idToken);
    }
}