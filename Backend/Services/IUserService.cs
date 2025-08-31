// Backend/Services/IUserService.cs
using Backend.Models;
using System.Threading.Tasks;

namespace Backend.Services
{
    public interface IUserService
    {
        Task Create(AppUser user);
        Task Update(AppUser user);
        Task<AppUser> GetById(string id);
        Task<AppUser> GetByUsername(string username);
        Task<AppUser> GetByEmail(string email);
        Task<AppUser> GetByGoogleId(string googleId);
        Task<AppUser> GetByUsernameOrEmail(string username, string email);
        Task SaveVerification(EmailVerification verification);
        Task<EmailVerification> GetVerification(string userId, string type);
        Task UpdateVerification(EmailVerification verification);
    }
}