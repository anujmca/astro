using System;

namespace AstroVerse.Core.Domain
{
    public class Subscription
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public Guid? TenantId { get; set; }
        public Guid UserId { get; set; }
        public User? User { get; set; }
        public string PlanType { get; set; } = "Free"; // Free, Basic, Premium, Professional
        public string Status { get; set; } = "Active"; // Active, Canceled, Expired
        public DateTime StartDate { get; set; } = DateTime.UtcNow;
        public DateTime EndDate { get; set; } = DateTime.UtcNow.AddDays(30);
        public string? StripeCustomerId { get; set; }
        public string? StripeSubscriptionId { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
