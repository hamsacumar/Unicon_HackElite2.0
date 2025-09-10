// Backend/Models/DTOs/UserProfileDto.cs
namespace Backend.Models.DTOs
{
    public class UserProfileDto
    {
        public string? FirstName { get; set; }
        public string? LastName { get; set; }
        public string? Description { get; set; }
        public string Username { get; set; } = string.Empty;
    }
}
