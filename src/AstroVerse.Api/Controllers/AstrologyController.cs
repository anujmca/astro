using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using AstroVerse.Core.Interfaces;
using AstroVerse.Core.Domain;
using AstroVerse.Infrastructure.Data;

namespace AstroVerse.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AstrologyController : ControllerBase
    {
        private readonly IAstrologyService _astroService;
        private readonly ApplicationDbContext _context;

        public AstrologyController(IAstrologyService astroService, ApplicationDbContext context)
        {
            _astroService = astroService;
            _context = context;
        }

        [HttpPost("kundli")]
        public IActionResult GenerateKundli([FromBody] KundliRequest request)
        {
            var timeOfBirth = TimeSpan.Parse(request.TimeOfBirth);
            var result = _astroService.GenerateKundli(
                request.Name,
                request.Gender,
                request.DateOfBirth,
                timeOfBirth,
                request.Latitude,
                request.Longitude,
                request.PlaceOfBirth
            );

            return Ok(new { success = true, data = result });
        }

        [HttpPost("matchmaking")]
        public IActionResult RunMatchmaking([FromBody] MatchmakingRequest request)
        {
            var primary = new FamilyMember
            {
                Name = request.PrimaryName,
                DateOfBirth = request.PrimaryDateOfBirth,
                TimeOfBirth = TimeSpan.Parse(request.PrimaryTimeOfBirth)
            };

            var secondary = new FamilyMember
            {
                Name = request.SecondaryName,
                DateOfBirth = request.SecondaryDateOfBirth,
                TimeOfBirth = TimeSpan.Parse(request.SecondaryTimeOfBirth)
            };

            var report = _astroService.RunMatchmaking(primary, secondary);
            return Ok(new { success = true, data = report });
        }

        [HttpPost("baby-names")]
        public IActionResult GenerateBabyNames([FromBody] BabyNamesRequest request)
        {
            var timeOfBirth = TimeSpan.Parse(request.TimeOfBirth);
            var names = _astroService.GenerateBabyNames(
                request.DateOfBirth,
                timeOfBirth,
                request.Latitude,
                request.Longitude,
                request.Gender,
                request.Category
            );

            return Ok(new { success = true, names });
        }

        [HttpPost("plan-baby")]
        public IActionResult PlanBaby([FromBody] PlanBabyRequest request)
        {
            var plan = _astroService.PlanBaby(request.ExpectedDate, request.Gender);
            return Ok(new { success = true, data = plan });
        }

        [HttpPost("plan-muhurat")]
        public IActionResult PlanMuhurat([FromBody] PlanMuhuratRequest request)
        {
            var list = _astroService.PlanMuhurat(request.FamilyMemberId, request.EventType, request.StartDate, request.EndDate);
            return Ok(new { success = true, data = list });
        }

        [HttpGet("horoscope")]
        public IActionResult GetHoroscope([FromQuery] string rashi, [FromQuery] string timeframe, [FromQuery] string lang = "en")
        {
            // Direct mock response for horoscope predictions
            var predictions = new System.Collections.Generic.Dictionary<string, string>
            {
                { "Career", "A strong wave of creativity helps resolve outstanding tasks. Be open to feedback." },
                { "Finance", "Good time to organize budgets. Avoid lending cash to acquaintances today." },
                { "Health", "Take periodic breaks to rest your eyes. Stay hydrated." },
                { "Relationships", "Express your affection clearly. An unexpected conversation strengthens bonds." }
            };

            return Ok(new
            {
                success = true,
                data = new
                {
                    rashi,
                    timeframe,
                    predictions,
                    language = lang,
                    date = DateTime.UtcNow.ToString("yyyy-MM-dd")
                }
            });
        }

        [HttpGet("db-check")]
        public async Task<IActionResult> DbCheck()
        {
            try
            {
                var usersCount = await _context.Users.CountAsync();
                return Ok(new { 
                    success = true, 
                    message = "Database is connected and tables can be queried.",
                    usersCount = usersCount
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { 
                    success = false, 
                    message = "Database diagnostic check failed.",
                    error = ex.Message,
                    innerException = ex.InnerException?.Message,
                    stackTrace = ex.StackTrace
                });
            }
        }
    }

    public class KundliRequest
    {
        public string Name { get; set; } = string.Empty;
        public string Gender { get; set; } = "Male";
        public DateTime DateOfBirth { get; set; }
        public string TimeOfBirth { get; set; } = "00:00:00";
        public decimal Latitude { get; set; }
        public decimal Longitude { get; set; }
        public string PlaceOfBirth { get; set; } = string.Empty;
    }

    public class MatchmakingRequest
    {
        public string PrimaryName { get; set; } = string.Empty;
        public DateTime PrimaryDateOfBirth { get; set; }
        public string PrimaryTimeOfBirth { get; set; } = "00:00:00";
        public string SecondaryName { get; set; } = string.Empty;
        public DateTime SecondaryDateOfBirth { get; set; }
        public string SecondaryTimeOfBirth { get; set; } = "00:00:00";
    }

    public class BabyNamesRequest
    {
        public DateTime DateOfBirth { get; set; }
        public string TimeOfBirth { get; set; } = "00:00:00";
        public decimal Latitude { get; set; }
        public decimal Longitude { get; set; }
        public string Gender { get; set; } = "Male";
        public string Category { get; set; } = "Traditional";
    }

    public class PlanBabyRequest
    {
        public DateTime ExpectedDate { get; set; }
        public string Gender { get; set; } = "Unisex";
    }

    public class PlanMuhuratRequest
    {
        public Guid FamilyMemberId { get; set; }
        public string EventType { get; set; } = "Marriage";
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
    }
}
