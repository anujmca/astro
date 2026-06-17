using System;
using System.Security.Cryptography;
using System.Text;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using AstroVerse.Core.Domain;
using AstroVerse.Core.Interfaces;
using AstroVerse.Infrastructure.Data;

namespace AstroVerse.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ITokenService _tokenService;

        public AuthController(ApplicationDbContext context, ITokenService tokenService)
        {
            _context = context;
            _tokenService = tokenService;
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterRequest request)
        {
            if (await _context.Users.AnyAsync(u => u.Email == request.Email))
            {
                return BadRequest(new { message = "Email already exists." });
            }

            var user = new User
            {
                Email = request.Email,
                FullName = request.FullName,
                PasswordHash = HashPassword(request.Password),
                Role = "User",
                IsEmailVerified = false
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            // Create initial "Self" profile in family vault
            var selfMember = new FamilyMember
            {
                UserId = user.Id,
                Name = user.FullName,
                Gender = "Unisex",
                RelationType = "Self",
                DateOfBirth = DateTime.UtcNow.Date,
                TimeOfBirth = DateTime.UtcNow.TimeOfDay,
                Latitude = 0.00m,
                Longitude = 0.00m,
                PlaceOfBirth = "Unknown",
                Tags = new System.Collections.Generic.List<string> { "Self" },
                Notes = "Auto-generated self profile"
            };

            _context.FamilyMembers.Add(selfMember);
            await _context.SaveChangesAsync();

            var token = _tokenService.GenerateJwtToken(user);
            return Ok(new { success = true, token, user = new { user.Email, user.FullName, user.Role } });
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest request)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == request.Email);
            if (user == null || user.PasswordHash != HashPassword(request.Password))
            {
                return Unauthorized(new { message = "Invalid email or password." });
            }

            var token = _tokenService.GenerateJwtToken(user);
            return Ok(new { success = true, token, user = new { user.Id, user.Email, user.FullName, user.Role } });
        }

        [HttpGet("profile")]
        public async Task<IActionResult> GetProfile()
        {
            // Simple mock profile retrieval based on authorization headers
            // Real authentication header parsing would read claims
            var authHeader = Request.Headers["Authorization"].ToString();
            if (string.IsNullOrEmpty(authHeader))
            {
                return Unauthorized();
            }

            // For testing, return a default user profile if authenticated
            var user = await _context.Users.FirstOrDefaultAsync();
            if (user == null) return NotFound();

            return Ok(new { success = true, user = new { user.Email, user.FullName, user.Role, user.CreatedAt } });
        }

        private static string HashPassword(string password)
        {
            using var sha256 = SHA256.Create();
            var hashedBytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(password));
            return Convert.ToBase64String(hashedBytes);
        }
    }

    public class RegisterRequest
    {
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
    }

    public class LoginRequest
    {
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
    }
}
