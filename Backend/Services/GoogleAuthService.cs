// Backend/Services/GoogleAuthService.cs
using Google.Apis.Auth;
using System.Threading.Tasks;

namespace Backend.Services
{
    public class GoogleAuthService : IGoogleAuthService
    {
        public async Task<GoogleJsonWebSignature.Payload> ValidateToken(string idToken)
        {
            try
            {
                var settings = new GoogleJsonWebSignature.ValidationSettings
                {
                    Audience = new[] { "YOUR_GOOGLE_CLIENT_ID" } // Replace with your Google Client ID
                };
                return await GoogleJsonWebSignature.ValidateAsync(idToken, settings);
            }
            catch
            {
                return null!;
            }
        }
    }
}