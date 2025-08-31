// Backend/Services/IEmailService.cs
using System.Threading.Tasks;

namespace Backend.Services
{
    public interface IEmailService
    {
        Task SendEmail(string to, string subject, string body);
    }
}