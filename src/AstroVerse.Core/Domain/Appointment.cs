using System;

namespace AstroVerse.Core.Domain
{
    public class Appointment
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public Guid? TenantId { get; set; }
        public Guid UserId { get; set; }
        public User? User { get; set; }
        public Guid AstrologerId { get; set; }
        public Astrologer? Astrologer { get; set; }
        public DateTime ScheduledAt { get; set; }
        public int DurationMinutes { get; set; } = 30;
        public string Type { get; set; } = "Video"; // Video, Audio, Chat
        public string Status { get; set; } = "Scheduled"; // Scheduled, Completed, Cancelled
        public string? MeetingUrl { get; set; }
        public string? Notes { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
