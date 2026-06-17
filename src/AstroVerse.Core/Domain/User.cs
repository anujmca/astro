using System;

namespace AstroVerse.Core.Domain
{
    public class User
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public Guid? TenantId { get; set; }
        public string Email { get; set; } = string.Empty;
        public string? PasswordHash { get; set; }
        public string Role { get; set; } = "User"; // User, Astrologer, Admin, SuperAdmin
        public string FullName { get; set; } = string.Empty;
        public string? PhoneNumber { get; set; }
        public bool IsEmailVerified { get; set; }
        public bool TwoFactorEnabled { get; set; }
        public string? TwoFactorSecret { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        public Astrologer? AstrologerProfile { get; set; }
    }
}
