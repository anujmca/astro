using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using AstroVerse.Core.Interfaces;
using AstroVerse.Infrastructure.Data;

namespace AstroVerse.Infrastructure.Services
{
    public class AiAssistantService : IAiAssistantService
    {
        private readonly ApplicationDbContext _context;

        public AiAssistantService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<(string Reply, string[] ContextUsed)> GetChatCompletionAsync(Guid userId, string message, Guid? activeMemberId, string languageCode)
        {
            // Retrieve family members to build context
            var members = await _context.FamilyMembers
                .Where(m => m.UserId == userId)
                .ToListAsync();

            var contextUsed = new List<string>();
            string targetMemberName = "yourself";
            string targetMemberRashi = "Aries";
            string targetMemberNakshatra = "Ashwini";
            bool targetMemberIsManglik = false;
            string targetMemberSadeSati = "No active Sade Sati.";

            if (activeMemberId.HasValue)
            {
                var targetMember = members.FirstOrDefault(m => m.Id == activeMemberId.Value);
                if (targetMember != null)
                {
                    targetMemberName = targetMember.Name;
                    contextUsed.Add($"{targetMember.Name} ({targetMember.RelationType})");

                    // Try to load pre-calculated Kundli
                    var kundli = await _context.Kundlis
                        .FirstOrDefaultAsync(k => k.FamilyMemberId == targetMember.Id);

                    if (kundli != null)
                    {
                        targetMemberRashi = kundli.Rashi;
                        targetMemberNakshatra = kundli.Nakshatra;

                        try
                        {
                            var doshasDoc = JsonDocument.Parse(kundli.Doshas);
                            if (doshasDoc.RootElement.TryGetProperty("isManglik", out var isManglikProp))
                            {
                                targetMemberIsManglik = isManglikProp.GetBoolean();
                            }
                            if (doshasDoc.RootElement.TryGetProperty("sadeSatiStatus", out var ssProp))
                            {
                                targetMemberSadeSati = ssProp.GetString() ?? "No active Sade Sati.";
                            }
                        }
                        catch
                        {
                            // Ignore json parse error
                        }
                    }
                }
            }
            else if (members.Count > 0)
            {
                var self = members.FirstOrDefault(m => m.RelationType.Equals("Self", StringComparison.OrdinalIgnoreCase)) ?? members.First();
                targetMemberName = self.Name;
                contextUsed.Add($"{self.Name} (Self)");

                var kundli = await _context.Kundlis
                    .FirstOrDefaultAsync(k => k.FamilyMemberId == self.Id);

                if (kundli != null)
                {
                    targetMemberRashi = kundli.Rashi;
                    targetMemberNakshatra = kundli.Nakshatra;
                }
            }

            // Lowercase comparison
            string query = message.ToLowerInvariant();
            string reply;

            if (query.Contains("sade sati") || query.Contains("sate sati") || query.Contains("shani"))
            {
                reply = $"Analyzing Saturn's transit for {targetMemberName}. Moon Sign: {targetMemberRashi}. Status: {targetMemberSadeSati} " +
                        $"Saturn transit brings structured learning and karmic corrections. We recommend reciting the Shani Chalisa on Saturdays and lighting a mustard oil lamp under a Peepal tree.";
            }
            else if (query.Contains("manglik") || query.Contains("mangala") || query.Contains("mars"))
            {
                string status = targetMemberIsManglik ? "is Manglik (Mars in influential house)" : "is NOT Manglik";
                reply = $"Checking Mars position in the birth chart of {targetMemberName}. The chart indicates that {targetMemberName} {status}. " +
                        $"Manglik status influences temperament and partnership dynamics. If Manglik, performing Kumbh Vivah or balancing energies with a compatible Manglik partner is advised.";
            }
            else if (query.Contains("career") || query.Contains("job") || query.Contains("business") || query.Contains("profession"))
            {
                reply = $"Assessing the 10th house of profession and planetary transits for {targetMemberName}. With Moon Rashi as {targetMemberRashi} and Nakshatra as {targetMemberNakshatra}, " +
                        $"the transit of Jupiter provides progressive alignment. Strong career expansion is indicated from the next quarter. Stay focused on leadership opportunities and avoid impulsive job shifts.";
            }
            else if (query.Contains("marriage") || query.Contains("partner") || query.Contains("spouse") || query.Contains("compatibility"))
            {
                reply = $"Reviewing relationship chart parameters for {targetMemberName}. Astrological metrics suggest favorable alignment in compatibility scores. " +
                        $"If checking matchmaking, ensure Guna Milan scores are above 18 points. Planetary aspects indicate a supportive period for marital decisions in the coming 6-9 months.";
            }
            else if (query.Contains("baby") || query.Contains("child") || query.Contains("names"))
            {
                reply = $"Vedic name generation for {targetMemberName}'s family circle. Based on the Nakshatra {targetMemberNakshatra}, suggested starting syllables are auspicious. " +
                        $"Modern Sanskrit names like Aarav, Kabir, or Kavya are aligned with these planetary vibrations.";
            }
            else
            {
                reply = $"Greetings from AstroVerse! Analyzing birth configuration for {targetMemberName} (Rashi: {targetMemberRashi}, Nakshatra: {targetMemberNakshatra}). " +
                        $"The current Dasha period encourages self-reflection, spiritual learning, and structural consolidation. Please ask about career, Sade Sati, Manglik status, or compatibility reports.";
            }

            // Simple language translation simulation for responses
            if (languageCode == "hi")
            {
                reply = "[हिन्दी अनुवाद] " + reply.Replace("Analyzing", "विश्लेषण कर रहे हैं")
                    .Replace("Checking", "जाँच कर रहे हैं")
                    .Replace("status", "स्थिति")
                    .Replace("career", "करियर");
            }
            else if (languageCode == "ar")
            {
                reply = "[ترجمة عربية] " + reply;
            }

            return (reply, contextUsed.ToArray());
        }
    }
}
