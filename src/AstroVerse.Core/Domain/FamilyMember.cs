using System;
using System.Collections.Generic;

namespace AstroVerse.Core.Domain
{
    public class FamilyMember
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public Guid? TenantId { get; set; }
        public Guid UserId { get; set; }
        public User? User { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Gender { get; set; } = string.Empty; // Male, Female, Unisex
        public string RelationType { get; set; } = string.Empty; // Self, Spouse, Child, Parent, Sibling, Friend
        public DateTime DateOfBirth { get; set; }
        public TimeSpan TimeOfBirth { get; set; }
        public decimal Latitude { get; set; }
        public decimal Longitude { get; set; }
        public string PlaceOfBirth { get; set; } = string.Empty;
        public string? PhotoUrl { get; set; }
        public List<string> Tags { get; set; } = new();
        public string? Notes { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        public List<Kundli> Kundlis { get; set; } = new();
    }
}
