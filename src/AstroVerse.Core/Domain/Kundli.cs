using System;

namespace AstroVerse.Core.Domain
{
    public class Kundli
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public Guid? TenantId { get; set; }
        public Guid FamilyMemberId { get; set; }
        public FamilyMember? FamilyMember { get; set; }
        public string Rashi { get; set; } = string.Empty;
        public string Nakshatra { get; set; } = string.Empty;
        public string Ascendant { get; set; } = string.Empty;

        // Serialized JSON payloads
        public string LagnaChartData { get; set; } = "{}";
        public string NavamsaChartData { get; set; } = "{}";
        public string PlanetaryPositions { get; set; } = "[]";
        public string DashaAnalysis { get; set; } = "{}";
        public string Yogas { get; set; } = "[]";
        public string Doshas { get; set; } = "{}";
        public string Predictions { get; set; } = "{}";
        public string Panchang { get; set; } = "{}";

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
