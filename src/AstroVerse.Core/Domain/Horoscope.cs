using System;

namespace AstroVerse.Core.Domain
{
    public class Horoscope
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public string Rashi { get; set; } = string.Empty;
        public string Timeframe { get; set; } = "Daily"; // Daily, Weekly, Monthly, Yearly
        public DateTime DateOfPrediction { get; set; }
        public string Predictions { get; set; } = "{}"; // JSON string { "Career": "...", "Finance": "...", ... }
        public string Language { get; set; } = "en";
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
