// Backend/DTOs/ProfileUpdateRequest.cs
namespace Backend.DTOs
{
    public class ProfileUpdateRequest
    {
        public string? FirstName { get; set; }
        public string? LastName { get; set; }
        public string? Username { get; set; }
        public string? Description { get; set; }
        public string? ProfileImageUrl { get; set; }
    }
}
