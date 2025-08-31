// Backend/Controllers/AuthController.cs
using Microsoft.AspNetCore.Mvc;
using Backend.Services;
using Backend.Models.DTOs;
using Backend.Models;
using System.Threading.Tasks;
using MongoDB.Bson;

namespace Backend.Controllers
{
    [ApiController]
    [Route("api/auth")]
    public class AuthController : ControllerBase
    {
        private readonly IUserService _userService;
        private readonly IEmailService _emailService;
        private readonly IJwtService _jwtService;
        private readonly IGoogleAuthService _googleAuthService;

        public AuthController(IUserService userService, IEmailService emailService, IJwtService jwtService, IGoogleAuthService googleAuthService)
        {
            _userService = userService;
            _emailService = emailService;
            _jwtService = jwtService;
            _googleAuthService = googleAuthService;
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterDto dto)
        {
            if (!ValidateRegisterDto(dto, out string error))
            {
                return BadRequest(error);
            }

            var existingUser = await _userService.GetByUsernameOrEmail(dto.Username, dto.Email);
            if (existingUser != null)
            {
                return BadRequest("Username or email already exists.");
            }

            var user = new AppUser
            {
                Id = ObjectId.GenerateNewId().ToString(),
                Username = dto.Username,
                Email = dto.Email,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
                IsEmailVerified = false,
                Role = "Student", // Default role
                FirstName = "",
                LastName = "",
                Address = "",
                Description = "",
                GoogleId = ""
            };

            await _userService.Create(user);

            var code = GenerateCode();
            var verification = new EmailVerification
            {
                Id = ObjectId.GenerateNewId().ToString(),
                UserId = user.Id,
                Code = code,
                Expiry = DateTime.UtcNow.AddMinutes(2),
                Type = "email_verification"
            };
            await _userService.SaveVerification(verification);

            await _emailService.SendEmail(user.Email, "Verify Your Email", $"Your verification code is {code}. It expires in 2 minutes.");

            return Ok(new { Message = "User registered. Verify email with code." });
        }

        [HttpPost("verify-email")]
        public async Task<IActionResult> VerifyEmail([FromBody] VerifyEmailDto dto)
        {
            var user = await _userService.GetByEmail(dto.Email);
            if (user == null || user.IsEmailVerified)
            {
                return BadRequest("Invalid request.");
            }

            var verification = await _userService.GetVerification(user.Id, "email_verification");
            if (verification == null || verification.IsUsed || verification.Expiry < DateTime.UtcNow)
            {
                return BadRequest("Code expired or invalid.");
            }

            if (verification.Code != dto.Code)
            {
                return BadRequest("Incorrect code.");
            }

            verification.IsUsed = true;
            await _userService.UpdateVerification(verification);

            user.IsEmailVerified = true;
            await _userService.Update(user);

            return Ok(new { Message = "Email verified. Proceed to classify account." });
        }

        [HttpPost("resend-verification")]
        public async Task<IActionResult> ResendVerification([FromBody] ResendDto dto)
        {
            var user = await _userService.GetByEmail(dto.Email);
            if (user == null || user.IsEmailVerified)
            {
                return BadRequest("Invalid request.");
            }

            var lastVerification = await _userService.GetVerification(user.Id, "email_verification");
            if (lastVerification != null && lastVerification.Expiry > DateTime.UtcNow.AddMinutes(-2))
            {
                return BadRequest("Wait 2 minutes before resending.");
            }

            var code = GenerateCode();
            var verification = new EmailVerification
            {
                Id = ObjectId.GenerateNewId().ToString(),
                UserId = user.Id,
                Code = code,
                Expiry = DateTime.UtcNow.AddMinutes(2),
                Type = "email_verification"
            };
            await _userService.SaveVerification(verification);

            await _emailService.SendEmail(user.Email, "Verify Your Email", $"Your new verification code is {code}. It expires in 2 minutes.");

            return Ok(new { Message = "Code resent." });
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginDto dto)
        {
            if (string.IsNullOrEmpty(dto.Username) || string.IsNullOrEmpty(dto.Password))
            {
                return BadRequest("Username and password are required.");
            }

            var user = await _userService.GetByUsername(dto.Username);
            if (user == null || !BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash))
            {
                return BadRequest("Invalid credentials.");
            }

            if (!user.IsEmailVerified)
            {
                return BadRequest("Email not verified.");
            }

            var token = _jwtService.GenerateToken(user);
            return Ok(new { Token = token });
        }

        [HttpPost("forgot-password")]
        public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordDto dto)
        {
            if (!ValidateEmail(dto.Email, out string error))
            {
                return BadRequest(error);
            }

            var user = await _userService.GetByEmail(dto.Email);
            if (user == null)
            {
                return BadRequest("User not found.");
            }

            var code = GenerateCode();
            var verification = new EmailVerification
            {
                Id = ObjectId.GenerateNewId().ToString(),
                UserId = user.Id,
                Code = code,
                Expiry = DateTime.UtcNow.AddMinutes(2),
                Type = "password_reset"
            };
            await _userService.SaveVerification(verification);

            await _emailService.SendEmail(user.Email, "Reset Password", $"Your reset code is {code}. It expires in 2 minutes.");

            return Ok(new { Message = "Reset code sent." });
        }

        [HttpPost("verify-reset-code")]
        public async Task<IActionResult> VerifyResetCode([FromBody] VerifyResetCodeDto dto)
        {
            var user = await _userService.GetByEmail(dto.Email);
            if (user == null)
            {
                return BadRequest("Invalid request.");
            }

            var verification = await _userService.GetVerification(user.Id, "password_reset");
            if (verification == null || verification.IsUsed || verification.Expiry < DateTime.UtcNow)
            {
                return BadRequest("Code expired or invalid.");
            }

            if (verification.Code != dto.Code)
            {
                return BadRequest("Incorrect code.");
            }

            return Ok(new { Message = "Code verified. Proceed to reset password." });
        }

        [HttpPost("reset-password")]
        public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordDto dto)
        {
            if (!ValidatePassword(dto.NewPassword, out string error))
            {
                return BadRequest(error);
            }

            if (dto.NewPassword != dto.ConfirmPassword)
            {
                return BadRequest("Passwords do not match.");
            }

            var user = await _userService.GetByEmail(dto.Email);
            if (user == null)
            {
                return BadRequest("Invalid request.");
            }

            var verification = await _userService.GetVerification(user.Id, "password_reset");
            if (verification == null || verification.IsUsed || verification.Expiry < DateTime.UtcNow)
            {
                return BadRequest("Invalid or expired code.");
            }

            verification.IsUsed = true;
            await _userService.UpdateVerification(verification);

            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.NewPassword);
            await _userService.Update(user);

            return Ok(new { Message = "Password reset successfully." });
        }

        [HttpPost("google-signin")]
        public async Task<IActionResult> GoogleSignIn([FromBody] GoogleSignInDto dto)
        {
            var payload = await _googleAuthService.ValidateToken(dto.IdToken);
            if (payload == null)
            {
                return BadRequest("Invalid Google token.");
            }

            var user = await _userService.GetByGoogleId(payload.Subject);
            if (user == null)
            {
                user = new AppUser
                {
                    Id = ObjectId.GenerateNewId().ToString(),
                    GoogleId = payload.Subject,
                    Email = payload.Email,
                    Username = payload.Email.Split('@')[0], // Or generate unique
                    IsEmailVerified = true, // Google verified
                    FirstName = payload.GivenName ?? "",
                    LastName = payload.FamilyName ?? "",
                    PasswordHash = "", // No password for Google users
                    Role = "Student", // Default role
                    Address = "",
                    Description = ""
                };
                await _userService.Create(user);
            }

            var token = _jwtService.GenerateToken(user);
            return Ok(new { Token = token });
        }

        private string GenerateCode()
        {
            return new Random().Next(100000, 999999).ToString();
        }

        private bool ValidateRegisterDto(RegisterDto dto, out string error)
        {
            error = "";
            if (string.IsNullOrEmpty(dto.Username)) error += "Username is required. ";
            if (!ValidateEmail(dto.Email, out string emailError)) error += emailError;
            if (!ValidatePassword(dto.Password, out string passError)) error += passError;
            return string.IsNullOrEmpty(error);
        }

        private bool ValidateEmail(string email, out string error)
        {
            error = "";
            if (string.IsNullOrEmpty(email)) error = "Email is required. ";
            else if (!email.Contains("@") || !email.Contains(".")) error = "Invalid email format. ";
            return string.IsNullOrEmpty(error);
        }

        private bool ValidatePassword(string password, out string error)
        {
            error = "";
            if (string.IsNullOrEmpty(password)) error = "Password is required. ";
            else if (password.Length < 8) error += "Password must be at least 8 characters. ";
            else if (!password.Any(char.IsUpper)) error += "Password must contain a capital letter. ";
            else if (!password.Any(char.IsDigit)) error += "Password must contain a number. ";
            else if (!password.Any(ch => !char.IsLetterOrDigit(ch))) error += "Password must contain a symbol. ";
            return string.IsNullOrEmpty(error);
        }
    }
}