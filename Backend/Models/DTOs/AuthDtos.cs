// Backend/Models/DTOs/AuthDtos.cs
namespace Backend.Models.DTOs
{
    public class RegisterDto
    {
        public required string Username { get; set; }
        public required string Email { get; set; }
        public required string Password { get; set; }
    }

    public class LoginDto
    {
        public string? Username { get; set; }
        public string? Email { get; set; }
        public required string Password { get; set; }

        public bool IsValid()
        {
            return (!string.IsNullOrEmpty(Username) || !string.IsNullOrEmpty(Email)) && 
                   !string.IsNullOrEmpty(Password);
        }
    }

    public class VerifyEmailDto
    {
        public required string Email { get; set; }
        public required string Code { get; set; }
    }

    public class ResendDto
    {
        public required string Email { get; set; }
    }

    public class ForgotPasswordDto
    {
        public required string Email { get; set; }
    }

    public class VerifyResetCodeDto
    {
        public required string Email { get; set; }
        public required string Code { get; set; }
    }

    public class ResetPasswordDto
    {
        public required string Email { get; set; }
        public required string NewPassword { get; set; }
        public required string ConfirmPassword { get; set; }
    }

    public class GoogleSignInDto
    {
        public required string IdToken { get; set; }
    }

    public class ClassifyDto
    {
        public required string FirstName { get; set; }
        public required string LastName { get; set; }
        public required string Role { get; set; }
        public required string Address { get; set; }
        public required string Description { get; set; }
    }
}