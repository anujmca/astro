using System;

namespace AstroVerse.Core.Domain
{
    public class CompatibilityReport
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public Guid? TenantId { get; set; }
        public Guid PrimaryMemberId { get; set; }
        public FamilyMember? PrimaryMember { get; set; }
        public Guid SecondaryMemberId { get; set; }
        public FamilyMember? SecondaryMember { get; set; }
        
        public decimal GunaMilanScore { get; set; } // Out of 36
        public string ManglikStatus { get; set; } = "{}"; // JSON string
        public string DoshaAnalysis { get; set; } = "{}"; // JSON string
        public decimal CompatibilityScore { get; set; } // Percentage (0-100)
        public string Recommendations { get; set; } = string.Empty;
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
