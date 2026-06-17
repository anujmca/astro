using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using AstroVerse.Core.Domain;
using AstroVerse.Infrastructure.Data;

namespace AstroVerse.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class SubscriptionController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public SubscriptionController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet("status")]
        public async Task<IActionResult> GetStatus([FromQuery] Guid userId)
        {
            var targetUserId = userId;
            if (targetUserId == Guid.Empty)
            {
                var fallbackUser = await _context.Users.FirstOrDefaultAsync(u => u.Role == "User");
                if (fallbackUser != null) targetUserId = fallbackUser.Id;
            }

            var sub = await _context.Subscriptions
                .Where(s => s.UserId == targetUserId)
                .OrderByDescending(s => s.StartDate)
                .FirstOrDefaultAsync();

            if (sub == null)
            {
                return Ok(new
                {
                    success = true,
                    data = new
                    {
                        planType = "Free",
                        status = "Active",
                        endDate = DateTime.UtcNow.AddYears(100),
                        limits = new { maxFamilyMembers = 3, hasAiAssistant = false }
                    }
                });
            }

            var limits = sub.PlanType switch
            {
                "Basic" => new { maxFamilyMembers = 5, hasAiAssistant = true },
                "Premium" => new { maxFamilyMembers = 9999, hasAiAssistant = true },
                "Professional" => new { maxFamilyMembers = 9999, hasAiAssistant = true },
                _ => new { maxFamilyMembers = 3, hasAiAssistant = false }
            };

            return Ok(new
            {
                success = true,
                data = new
                {
                    planType = sub.PlanType,
                    status = sub.Status,
                    endDate = sub.EndDate,
                    limits
                }
            });
        }

        [HttpPost("upgrade")]
        public async Task<IActionResult> UpgradePlan([FromBody] UpgradeRequest request)
        {
            var targetUserId = request.UserId;
            if (targetUserId == Guid.Empty)
            {
                var fallbackUser = await _context.Users.FirstOrDefaultAsync(u => u.Role == "User");
                if (fallbackUser != null) targetUserId = fallbackUser.Id;
            }

            var user = await _context.Users.FindAsync(targetUserId);
            if (user == null) return NotFound();

            // Check if there's an active subscription
            var activeSub = await _context.Subscriptions
                .FirstOrDefaultAsync(s => s.UserId == targetUserId);

            if (activeSub != null)
            {
                activeSub.PlanType = request.PlanType;
                activeSub.StartDate = DateTime.UtcNow;
                activeSub.EndDate = DateTime.UtcNow.AddMonths(1);
                activeSub.Status = "Active";
            }
            else
            {
                var sub = new Subscription
                {
                    UserId = targetUserId,
                    PlanType = request.PlanType,
                    StartDate = DateTime.UtcNow,
                    EndDate = DateTime.UtcNow.AddMonths(1),
                    Status = "Active",
                    StripeCustomerId = $"cus_{Guid.NewGuid().ToString().Substring(0, 8)}",
                    StripeSubscriptionId = $"sub_{Guid.NewGuid().ToString().Substring(0, 8)}"
                };
                _context.Subscriptions.Add(sub);
            }

            // Record Payment log
            decimal amount = request.PlanType switch
            {
                "Basic" => 9.99m,
                "Premium" => 19.99m,
                "Professional" => 49.99m,
                _ => 0.00m
            };

            var payment = new Payment
            {
                UserId = targetUserId,
                Amount = amount,
                Currency = "USD",
                PaymentGateway = "Stripe",
                GatewayTransactionId = $"txn_{Guid.NewGuid().ToString().Substring(0, 12)}",
                Status = "Success",
                ReferenceType = "Subscription",
                ReferenceId = Guid.NewGuid()
            };

            _context.Payments.Add(payment);
            await _context.SaveChangesAsync();

            return Ok(new { success = true, planType = request.PlanType, message = "Successfully upgraded subscription." });
        }
    }

    public class UpgradeRequest
    {
        public Guid UserId { get; set; }
        public string PlanType { get; set; } = "Premium"; // Basic, Premium, Professional
    }
}
