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

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateMember(Guid id, [FromBody] UpdateMemberRequest request)
        {
            var member = await _context.FamilyMembers.FindAsync(id);
            if (member == null) return NotFound(new { message = "Member profile not found." });

            bool birthDetailsChanged = 
                member.Name != request.Name ||
                member.Gender != request.Gender ||
                member.DateOfBirth != request.DateOfBirth ||
                member.TimeOfBirth != TimeSpan.Parse(request.TimeOfBirth) ||
                member.Latitude != request.Latitude ||
                member.Longitude != request.Longitude ||
                member.PlaceOfBirth != request.PlaceOfBirth;

            member.Name = request.Name;
            member.Gender = request.Gender;
            member.RelationType = request.RelationType;
            member.DateOfBirth = request.DateOfBirth;
            member.TimeOfBirth = TimeSpan.Parse(request.TimeOfBirth);
            member.Latitude = request.Latitude;
            member.Longitude = request.Longitude;
            member.PlaceOfBirth = request.PlaceOfBirth;
            member.Tags = request.Tags ?? new List<string>();
            member.Notes = request.Notes;
            member.UpdatedAt = DateTime.UtcNow;

            if (request.PhotoUrl != null)
            {
                member.PhotoUrl = request.PhotoUrl;
            }
            else if (member.Name != request.Name)
            {
                member.PhotoUrl = $"https://api.dicebear.com/7.x/bottts/svg?seed={Uri.EscapeDataString(request.Name)}";
            }

            _context.Entry(member).State = EntityState.Modified;

            if (birthDetailsChanged)
            {
                try
                {
                    var newKundli = _astroService.GenerateKundli(
                        member.Name,
                        member.Gender,
                        member.DateOfBirth,
                        member.TimeOfBirth,
                        member.Latitude,
                        member.Longitude,
                        member.PlaceOfBirth
                    );

                    var existingKundli = await _context.Kundlis.FirstOrDefaultAsync(k => k.FamilyMemberId == member.Id);
                    if (existingKundli != null)
                    {
                        existingKundli.Rashi = newKundli.Rashi;
                        existingKundli.Nakshatra = newKundli.Nakshatra;
                        existingKundli.Ascendant = newKundli.Ascendant;
                        existingKundli.LagnaChartData = newKundli.LagnaChartData;
                        existingKundli.NavamsaChartData = newKundli.NavamsaChartData;
                        existingKundli.PlanetaryPositions = newKundli.PlanetaryPositions;
                        existingKundli.DashaAnalysis = newKundli.DashaAnalysis;
                        existingKundli.Yogas = newKundli.Yogas;
                        existingKundli.Doshas = newKundli.Doshas;
                        existingKundli.Panchang = newKundli.Panchang;
                        existingKundli.Predictions = newKundli.Predictions;
                        
                        _context.Entry(existingKundli).State = EntityState.Modified;
                    }
                    else
                    {
                        newKundli.FamilyMemberId = member.Id;
                        _context.Kundlis.Add(newKundli);
                    }
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Precomputing Kundli failed on update: {ex.Message}");
                }
            }

            await _context.SaveChangesAsync();

            return Ok(new { success = true, data = member });
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

    public class UpdateMemberRequest
    {
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
