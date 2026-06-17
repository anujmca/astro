using System;
using System.Collections.Generic;

namespace AstroVerse.Core.Domain
{
    public class Astrologer
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public Guid UserId { get; set; }
        public User? User { get; set; }
        public string? Bio { get; set; }
        public int ExperienceYears { get; set; }
        public List<string> Specialties { get; set; } = new();
        public List<string> Languages { get; set; } = new();
        public decimal HourlyRate { get; set; }
        public decimal Rating { get; set; } = 5.00m;
        public bool IsApproved { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
