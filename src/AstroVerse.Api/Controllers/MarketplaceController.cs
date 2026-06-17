using System;
using System.Collections.Generic;
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
    public class MarketplaceController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public MarketplaceController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet("astrologers")]
        public async Task<IActionResult> GetAstrologers()
        {
            var list = await _context.Astrologers
                .Include(a => a.User)
                .Where(a => a.IsApproved)
                .Select(a => new
                {
                    a.Id,
                    a.Bio,
                    a.ExperienceYears,
                    a.Specialties,
                    a.Languages,
                    a.HourlyRate,
                    a.Rating,
                    FullName = a.User != null ? a.User.FullName : "Acharya Ji",
                    Email = a.User != null ? a.User.Email : string.Empty,
                    PhotoUrl = $"https://api.dicebear.com/7.x/adventurer/svg?seed={Uri.EscapeDataString(a.User != null ? a.User.FullName : "Acharya Ji")}"
                })
                .ToListAsync();

            return Ok(new { success = true, data = list });
        }

        [HttpPost("book")]
        public async Task<IActionResult> BookAppointment([FromBody] BookAppointmentRequest request)
        {
            var user = await _context.Users.FindAsync(request.UserId);
            var astrologer = await _context.Astrologers.FindAsync(request.AstrologerId);

            if (astrologer == null)
            {
                return NotFound(new { message = "Astrologer not found." });
            }

            var appointment = new Appointment
            {
                UserId = request.UserId != Guid.Empty ? request.UserId : (user?.Id ?? Guid.NewGuid()),
                AstrologerId = request.AstrologerId,
                ScheduledAt = request.ScheduledAt,
                DurationMinutes = request.DurationMinutes,
                Type = request.Type,
                Status = "Scheduled",
                MeetingUrl = $"https://meet.jit.si/astroverse-{Guid.NewGuid().ToString().Substring(0, 8)}",
                Notes = request.Notes
            };

            _context.Appointments.Add(appointment);
            await _context.SaveChangesAsync();

            return Ok(new { success = true, data = appointment });
        }

        [HttpGet("appointments")]
        public async Task<IActionResult> GetAppointments([FromQuery] Guid userId)
        {
            var list = await _context.Appointments
                .Include(a => a.Astrologer)
                .ThenInclude(ast => ast!.User)
                .Where(a => a.UserId == userId || userId == Guid.Empty)
                .Select(a => new
                {
                    a.Id,
                    a.ScheduledAt,
                    a.DurationMinutes,
                    a.Type,
                    a.Status,
                    a.MeetingUrl,
                    a.Notes,
                    AstrologerName = a.Astrologer != null && a.Astrologer.User != null ? a.Astrologer.User.FullName : "Acharya Ji"
                })
                .ToListAsync();

            return Ok(new { success = true, data = list });
        }
    }

    public class BookAppointmentRequest
    {
        public Guid UserId { get; set; }
        public Guid AstrologerId { get; set; }
        public DateTime ScheduledAt { get; set; }
        public int DurationMinutes { get; set; } = 30;
        public string Type { get; set; } = "Video"; // Video, Audio, Chat
        public string? Notes { get; set; }
    }
}
