using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using AstroVerse.Core.Domain;
using AstroVerse.Core.Interfaces;
using AstroVerse.Infrastructure.Data;

namespace AstroVerse.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AdminController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ITranslationService _translationService;

        public AdminController(ApplicationDbContext context, ITranslationService translationService)
        {
            _context = context;
            _translationService = translationService;
        }

        [HttpGet("metrics")]
        public async Task<IActionResult> GetDashboardMetrics()
        {
            int totalUsers = await _context.Users.CountAsync();
            int totalAstrologers = await _context.Astrologers.CountAsync();
            int totalFamilyProfiles = await _context.FamilyMembers.CountAsync();
            int activeAppointments = await _context.Appointments.CountAsync();
            decimal totalRevenue = await _context.Payments
                .Where(p => p.Status == "Success")
                .SumAsync(p => p.Amount);

            // Plan distributions
            var subPlans = await _context.Subscriptions
                .GroupBy(s => s.PlanType)
                .Select(g => new { plan = g.Key, count = g.Count() })
                .ToListAsync();

            // Language distributions
            var langUsage = new List<object>
            {
                new { name = "English", value = 65 },
                new { name = "Hindi", value = 25 },
                new { name = "Arabic", value = 5 },
                new { name = "Spanish", value = 3 },
                new { name = "French", value = 2 }
            };

            return Ok(new
            {
                success = true,
                data = new
                {
                    totalUsers,
                    totalAstrologers,
                    totalFamilyProfiles,
                    activeAppointments,
                    totalRevenue,
                    subscriptions = subPlans,
                    languages = langUsage
                }
            });
        }

        [HttpGet("translations")]
        public async Task<IActionResult> GetTranslations([FromQuery] string? lang)
        {
            if (!string.IsNullOrEmpty(lang))
            {
                var dict = await _translationService.GetTranslationsAsync(lang);
                return Ok(new { success = true, data = dict });
            }

            var list = await _translationService.GetAllTranslationsAsync();
            return Ok(new { success = true, data = list });
        }

        [HttpPost("translations")]
        public async Task<IActionResult> UpdateTranslation([FromBody] UpdateTranslationRequest request)
        {
            await _translationService.UpdateTranslationAsync(request.LanguageCode, request.Key, request.Value);
            return Ok(new { success = true, message = "Translation key updated successfully." });
        }
    }

    public class UpdateTranslationRequest
    {
        public string LanguageCode { get; set; } = "en";
        public string Key { get; set; } = string.Empty;
        public string Value { get; set; } = string.Empty;
    }
}
