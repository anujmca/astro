using System;

namespace AstroVerse.Core.Domain
{
    public class Payment
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public Guid? TenantId { get; set; }
        public Guid UserId { get; set; }
        public User? User { get; set; }
        public decimal Amount { get; set; }
        public string Currency { get; set; } = "USD";
        public string PaymentGateway { get; set; } = "Stripe"; // Stripe, Razorpay, Paypal
        public string GatewayTransactionId { get; set; } = string.Empty;
        public string Status { get; set; } = "Pending"; // Pending, Success, Failed
        public string ReferenceType { get; set; } = "Subscription"; // Subscription, Appointment
        public Guid ReferenceId { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
