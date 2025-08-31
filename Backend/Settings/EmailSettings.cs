// Backend/Settings/EmailSettings.cs
namespace Backend.Settings
{
    public class EmailSettings
    {
        public required string SmtpHost { get; set; }
        public int Port { get; set; }
        public required string Username { get; set; }
        public required string Password { get; set; }
        public required string From { get; set; }
    }
}