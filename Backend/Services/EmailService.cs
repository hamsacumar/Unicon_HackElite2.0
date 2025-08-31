// Backend/Services/EmailService.cs
using Backend.Settings;
using Microsoft.Extensions.Options;
using System.Net.Mail;
using System.Net;
using System.Threading.Tasks;

namespace Backend.Services
{
    public class EmailService : IEmailService
    {
        private readonly EmailSettings _settings;

        public EmailService(IOptions<EmailSettings> settings)
        {
            _settings = settings.Value;
            
            // Validate required settings
            if (string.IsNullOrEmpty(_settings.SmtpHost))
                throw new InvalidOperationException("EmailSettings:SmtpHost is not configured");
            if (string.IsNullOrEmpty(_settings.Username))
                throw new InvalidOperationException("EmailSettings:Username is not configured");
            if (string.IsNullOrEmpty(_settings.Password))
                throw new InvalidOperationException("EmailSettings:Password is not configured");
            if (string.IsNullOrEmpty(_settings.From))
                throw new InvalidOperationException("EmailSettings:From is not configured");
        }

        public async Task SendEmail(string to, string subject, string body)
        {
            using var client = new SmtpClient(_settings.SmtpHost, _settings.Port)
            {
                Credentials = new NetworkCredential(_settings.Username, _settings.Password),
                EnableSsl = true
            };
            var message = new MailMessage(_settings.From, to, subject, body);
            await client.SendMailAsync(message);
        }
    }
}