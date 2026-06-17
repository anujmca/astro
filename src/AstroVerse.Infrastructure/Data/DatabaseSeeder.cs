using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Cryptography;
using System.Text;
using AstroVerse.Core.Domain;

namespace AstroVerse.Infrastructure.Data
{
    public static class DatabaseSeeder
    {
        public static void Seed(ApplicationDbContext context)
        {
            context.Database.EnsureCreated();

            if (!context.Users.Any())
            {
                // Seed Admin
                var admin = new User
                {
                    Email = "admin@astroverse.com",
                    FullName = "Super Admin",
                    Role = "SuperAdmin",
                    PasswordHash = HashPassword("Admin@123"),
                    IsEmailVerified = true
                };

                // Seed User
                var user = new User
                {
                    Email = "user@astroverse.com",
                    FullName = "Regular User",
                    Role = "User",
                    PasswordHash = HashPassword("User@123"),
                    IsEmailVerified = true
                };

                // Seed Astrologer
                var astrologerUser = new User
                {
                    Email = "astrologer@astroverse.com",
                    FullName = "Acharya Sharma",
                    Role = "Astrologer",
                    PasswordHash = HashPassword("Astro@123"),
                    IsEmailVerified = true
                };

                context.Users.AddRange(admin, user, astrologerUser);
                context.SaveChanges();

                var astrologerProfile = new Astrologer
                {
                    UserId = astrologerUser.Id,
                    Bio = "Professional Vedic astrologer with over 15 years of experience in planetary alignments and gemstone remedies.",
                    ExperienceYears = 15,
                    Specialties = new List<string> { "Vedic", "Kundli Matching", "Muhurat" },
                    Languages = new List<string> { "English", "Hindi", "Sanskrit" },
                    HourlyRate = 75.00m,
                    Rating = 4.9m,
                    IsApproved = true
                };

                context.Astrologers.Add(astrologerProfile);
                context.SaveChanges();

                // Add simulated family member for user
                var familyMember = new FamilyMember
                {
                    UserId = user.Id,
                    Name = "Regular User",
                    Gender = "Male",
                    RelationType = "Self",
                    DateOfBirth = new DateTime(1993, 10, 24),
                    TimeOfBirth = new TimeSpan(8, 30, 0),
                    Latitude = 28.6139m,
                    Longitude = 77.2090m,
                    PlaceOfBirth = "Delhi, India",
                    Tags = new List<string> { "Self" },
                    Notes = "Default profile"
                };

                var spouseMember = new FamilyMember
                {
                    UserId = user.Id,
                    Name = "Priya Sen",
                    Gender = "Female",
                    RelationType = "Spouse",
                    DateOfBirth = new DateTime(1995, 4, 18),
                    TimeOfBirth = new TimeSpan(12, 15, 0),
                    Latitude = 19.0760m,
                    Longitude = 72.8777m,
                    PlaceOfBirth = "Mumbai, India",
                    Tags = new List<string> { "Spouse", "Family" },
                    Notes = "Spouse details"
                };

                context.FamilyMembers.AddRange(familyMember, spouseMember);
                context.SaveChanges();
            }

            if (!context.Translations.Any())
            {
                var translations = new List<Translation>
                {
                    // English
                    new() { LanguageCode = "en", Key = "home_title", Value = "Discover Your Cosmic Blueprint" },
                    new() { LanguageCode = "en", Key = "home_subtitle", Value = "Connect with stars, plan life events, and chat with AI astrologers." },
                    new() { LanguageCode = "en", Key = "nav_vault", Value = "Astro Vault" },
                    new() { LanguageCode = "en", Key = "nav_marketplace", Value = "Marketplace" },
                    new() { LanguageCode = "en", Key = "nav_ai_assistant", Value = "AI Assistant" },
                    new() { LanguageCode = "en", Key = "nav_horoscope", Value = "Horoscope" },
                    new() { LanguageCode = "en", Key = "nav_compatibility", Value = "Matchmaking" },
                    new() { LanguageCode = "en", Key = "nav_muhurat", Value = "Muhurat Planner" },
                    new() { LanguageCode = "en", Key = "nav_admin", Value = "Admin Portal" },

                    // Hindi
                    new() { LanguageCode = "hi", Key = "home_title", Value = "अपने ब्रह्मांडीय खाके की खोज करें" },
                    new() { LanguageCode = "hi", Key = "home_subtitle", Value = "सितारों से जुड़ें, जीवन की घटनाओं की योजना बनाएं, और एआई ज्योतिषियों से चैट करें।" },
                    new() { LanguageCode = "hi", Key = "nav_vault", Value = "एस्ट्रो वॉल्ट" },
                    new() { LanguageCode = "hi", Key = "nav_marketplace", Value = "परामर्श बाज़ार" },
                    new() { LanguageCode = "hi", Key = "nav_ai_assistant", Value = "एआई सहायक" },
                    new() { LanguageCode = "hi", Key = "nav_horoscope", Value = "राशिफल" },
                    new() { LanguageCode = "hi", Key = "nav_compatibility", Value = "कुंडली मिलान" },
                    new() { LanguageCode = "hi", Key = "nav_muhurat", Value = "शुभ मुहूर्त नियोजक" },
                    new() { LanguageCode = "hi", Key = "nav_admin", Value = "प्रशासक पोर्टल" },

                    // Arabic
                    new() { LanguageCode = "ar", Key = "home_title", Value = "اكتشف مخططك الكوني" },
                    new() { LanguageCode = "ar", Key = "home_subtitle", Value = "تواصل مع النجوم، وخطط لأحداث الحياة، ودردش مع منجمي الذكاء الاصطناعي." },
                    new() { LanguageCode = "ar", Key = "nav_vault", Value = "قبو الفلك" },
                    new() { LanguageCode = "ar", Key = "nav_marketplace", Value = "سوق الاستشارات" },
                    new() { LanguageCode = "ar", Key = "nav_ai_assistant", Value = "مساعد الذكاء الاصطناعي" },
                    new() { LanguageCode = "ar", Key = "nav_horoscope", Value = "الأبراج" },
                    new() { LanguageCode = "ar", Key = "nav_compatibility", Value = "التوافق" },
                    new() { LanguageCode = "ar", Key = "nav_muhurat", Value = "مخطط الأوقات السعيدة" },
                    new() { LanguageCode = "ar", Key = "nav_admin", Value = "لوحة التحكم" }
                };

                context.Translations.AddRange(translations);
                context.SaveChanges();
            }
        }

        private static string HashPassword(string password)
        {
            using var sha256 = SHA256.Create();
            var hashedBytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(password));
            return Convert.ToBase64String(hashedBytes);
        }
    }
}
