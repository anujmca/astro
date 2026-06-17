using System;
using System.Collections.Generic;
using System.Text.Json;
using Xunit;
using AstroVerse.Core.Domain;
using AstroVerse.Core.Services;

namespace AstroVerse.Tests
{
    public class AstrologyServiceTests
    {
        private readonly AstrologyService _astrologyService;

        public AstrologyServiceTests()
        {
            _astrologyService = new AstrologyService();
        }

        [Fact]
        public void GenerateKundli_ShouldReturnCorrectAscendantAndRashi()
        {
            // Arrange
            string name = "John Doe";
            string gender = "Male";
            DateTime dob = new DateTime(1990, 6, 15);
            TimeSpan tob = new TimeSpan(8, 15, 0); // 8:15 AM
            decimal lat = 28.6139m;
            decimal lng = 77.2090m;
            string place = "New Delhi, India";

            // Act
            var kundli = _astrologyService.GenerateKundli(name, gender, dob, tob, lat, lng, place);

            // Assert
            Assert.NotNull(kundli);
            Assert.NotEmpty(kundli.Rashi);
            Assert.NotEmpty(kundli.Nakshatra);
            
            // Ascendant Index should be (8 + 5 + 12) % 24 = 1. Index 1 / 2 = 0 (Aries) due to longitude offset
            Assert.Equal("Aries", kundli.Ascendant);

            var planetaryPositions = JsonSerializer.Deserialize<List<PlanetaryPositionMock>>(kundli.PlanetaryPositions);
            Assert.NotNull(planetaryPositions);
            Assert.True(planetaryPositions.Count > 0);
        }

        [Fact]
        public void RunMatchmaking_ShouldCalculateConsistentGunaScore()
        {
            // Arrange
            var primary = new FamilyMember
            {
                Name = "Anya",
                Gender = "Female",
                DateOfBirth = new DateTime(1995, 4, 18),
                TimeOfBirth = new TimeSpan(12, 15, 0)
            };

            var secondary = new FamilyMember
            {
                Name = "Rohit",
                Gender = "Male",
                DateOfBirth = new DateTime(1993, 10, 24),
                TimeOfBirth = new TimeSpan(8, 30, 0)
            };

            // Act
            var report = _astrologyService.RunMatchmaking(primary, secondary);

            // Assert
            Assert.NotNull(report);
            Assert.True(report.GunaMilanScore >= 0 && report.GunaMilanScore <= 36);
            Assert.True(report.CompatibilityScore >= 0 && report.CompatibilityScore <= 100);
            Assert.NotEmpty(report.Recommendations);
        }

        [Fact]
        public void VimshottariDasha_ShouldGenerateAllNinePlanetsCycle()
        {
            // Arrange
            var dob = new DateTime(1990, 6, 15);
            var tob = new TimeSpan(8, 15, 0);

            // Act
            var kundli = _astrologyService.GenerateKundli("Test User", "Male", dob, tob, 0, 0, "Test Place");
            var dashas = JsonSerializer.Deserialize<List<DashaMock>>(kundli.DashaAnalysis);

            // Assert
            Assert.NotNull(dashas);
            Assert.Equal(9, dashas.Count);
            
            // Verify that total cycle spans 120 years
            var firstDashaStart = DateTime.Parse(dashas[0].start);
            var lastDashaEnd = DateTime.Parse(dashas[8].end);
            var totalDuration = lastDashaEnd.Year - firstDashaStart.Year;
            
            Assert.Equal(120, totalDuration);
        }

        // Helper mock model classes
        private class PlanetaryPositionMock
        {
            public string planet { get; set; } = string.Empty;
            public string degree { get; set; } = string.Empty;
            public int house { get; set; }
        }

        private class DashaMock
        {
            public string mahadasha { get; set; } = string.Empty;
            public string start { get; set; } = string.Empty;
            public string end { get; set; } = string.Empty;
        }
    }
}
