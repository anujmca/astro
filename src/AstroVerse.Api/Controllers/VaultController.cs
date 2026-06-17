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
    public class VaultController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IAstrologyService _astroService;

        public VaultController(ApplicationDbContext context, IAstrologyService astroService)
        {
            _context = context;
            _astroService = astroService;
        }

        [HttpGet]
        public async Task<IActionResult> GetMembers([FromQuery] Guid userId)
        {
            // Fallback user if userId not specified (support dev environment)
            var targetUserId = userId;
            if (targetUserId == Guid.Empty)
            {
                var fallbackUser = await _context.Users.FirstOrDefaultAsync(u => u.Role == "User");
                if (fallbackUser != null) targetUserId = fallbackUser.Id;
            }

            var members = await _context.FamilyMembers
                .Where(m => m.UserId == targetUserId)
                .ToListAsync();

            return Ok(new { success = true, data = members });
        }

        [HttpPost]
        public async Task<IActionResult> AddMember([FromBody] AddMemberRequest request)
        {
            var targetUserId = request.UserId;
            if (targetUserId == Guid.Empty)
            {
                var fallbackUser = await _context.Users.FirstOrDefaultAsync(u => u.Role == "User");
                if (fallbackUser != null) targetUserId = fallbackUser.Id;
            }

            var member = new FamilyMember
            {
                UserId = targetUserId,
                Name = request.Name,
                Gender = request.Gender,
                RelationType = request.RelationType,
                DateOfBirth = request.DateOfBirth,
                TimeOfBirth = TimeSpan.Parse(request.TimeOfBirth),
                Latitude = request.Latitude,
                Longitude = request.Longitude,
                PlaceOfBirth = request.PlaceOfBirth,
                PhotoUrl = request.PhotoUrl ?? $"https://api.dicebear.com/7.x/bottts/svg?seed={Uri.EscapeDataString(request.Name)}",
                Tags = request.Tags ?? new List<string>(),
                Notes = request.Notes
            };

            _context.FamilyMembers.Add(member);
            await _context.SaveChangesAsync();

            // Automatically pre-compute Kundli for this family member on creation
            try
            {
                var kundli = _astroService.GenerateKundli(
                    member.Name,
                    member.Gender,
                    member.DateOfBirth,
                    member.TimeOfBirth,
                    member.Latitude,
                    member.Longitude,
                    member.PlaceOfBirth
                );
                kundli.FamilyMemberId = member.Id;
                _context.Kundlis.Add(kundli);
                await _context.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                // In robust app, log but do not fail profile insertion
                Console.WriteLine($"Precomputing Kundli failed: {ex.Message}");
            }

            return Ok(new { success = true, data = member });
        }

        [HttpGet("{id}/kundli")]
        public async Task<IActionResult> GetMemberKundli(Guid id)
        {
            var kundli = await _context.Kundlis.FirstOrDefaultAsync(k => k.FamilyMemberId == id);
            if (kundli == null)
            {
                // If not precomputed, calculate dynamically
                var member = await _context.FamilyMembers.FindAsync(id);
                if (member == null) return NotFound(new { message = "Member profile not found." });

                kundli = _astroService.GenerateKundli(
                    member.Name,
                    member.Gender,
                    member.DateOfBirth,
                    member.TimeOfBirth,
                    member.Latitude,
                    member.Longitude,
                    member.PlaceOfBirth
                );
                kundli.FamilyMemberId = member.Id;
                _context.Kundlis.Add(kundli);
                await _context.SaveChangesAsync();
            }

            return Ok(new { success = true, data = kundli });
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteMember(Guid id)
        {
            var member = await _context.FamilyMembers.FindAsync(id);
            if (member == null) return NotFound();

            _context.FamilyMembers.Remove(member);
            await _context.SaveChangesAsync();

            return Ok(new { success = true, message = "Member profile deleted from vault." });
        }
    }

    public class AddMemberRequest
    {
        public Guid UserId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Gender { get; set; } = "Male";
        public string RelationType { get; set; } = "Sibling";
        public DateTime DateOfBirth { get; set; }
        public string TimeOfBirth { get; set; } = "00:00:00";
        public decimal Latitude { get; set; }
        public decimal Longitude { get; set; }
        public string PlaceOfBirth { get; set; } = string.Empty;
        public string? PhotoUrl { get; set; }
        public List<string>? Tags { get; set; }
        public string? Notes { get; set; }
    }
}
