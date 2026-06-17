using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using AstroVerse.Core.Domain;
using AstroVerse.Core.Interfaces;

namespace AstroVerse.Core.Services
{
    public class AstrologyService : IAstrologyService
    {
        private static readonly string[] Rashis = {
            "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
            "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"
        };

        private static readonly string[] Nakshatras = {
            "Ashwini", "Bharani", "Krittika", "Rohini", "Mrigashirsha", "Ardra",
            "Punarvasu", "Pushya", "Ashlesha", "Magha", "Purva Phalguni", "Uttara Phalguni",
            "Hasta", "Chitra", "Swati", "Vishakha", "Anuradha", "Jyeshtha",
            "Mula", "Purva Ashadha", "Uttara Ashadha", "Shravana", "Dhanishta", "Shatabhisha",
            "Purva Bhadrapada", "Uttara Bhadrapada", "Revati"
        };

        private static readonly (string Planet, int Years)[] DashaCycle = {
            ("Ketu", 7), ("Venus", 20), ("Sun", 6), ("Moon", 10), ("Mars", 7),
            ("Rahu", 18), ("Jupiter", 16), ("Saturn", 19), ("Mercury", 17)
        };

        public Kundli GenerateKundli(string name, string gender, DateTime dateOfBirth, TimeSpan timeOfBirth, decimal latitude, decimal longitude, string placeOfBirth)
        {
            // Deterministic calculation based on Date of Birth, time of birth, and location coordinates
            int latFactor = (int)Math.Abs(Math.Round(latitude * 1000m));
            int lonFactor = (int)Math.Abs(Math.Round(longitude * 1000m));
            int seed = Math.Abs((dateOfBirth.Year + dateOfBirth.Month + dateOfBirth.Day + timeOfBirth.Hours + timeOfBirth.Minutes + latFactor + lonFactor) % 100);
            
            string rashi = Rashis[seed % 12];
            string nakshatra = Nakshatras[seed % 27];
            
            // Ascendant shifts roughly every 2 hours, adjusted by longitude time zone offset (15 degrees per hour)
            int longitudeOffsetHours = (int)Math.Round(longitude / 15.0m);
            int adjustedHours = (timeOfBirth.Hours + longitudeOffsetHours + 12) % 24;
            int ascendantIndex = (adjustedHours / 2) % 12;
            string ascendant = Rashis[ascendantIndex];

            // Build planetary positions
            var planetaryPositions = new List<object>();
            var planets = new[] { "Sun", "Moon", "Mercury", "Venus", "Mars", "Jupiter", "Saturn", "Rahu", "Ket" };
            var houses = new Dictionary<string, List<string>>();

            for (int i = 1; i <= 12; i++)
            {
                houses[$"house{i}"] = new List<string>();
            }

            // Always place Ascendant in House 1
            houses["house1"].Add("Asc");

            for (int idx = 0; idx < planets.Length; idx++)
            {
                var planet = planets[idx];
                int houseNum;
                if (planet == "Rahu")
                {
                    houseNum = (seed + 4) % 12 + 1;
                }
                else if (planet == "Ket")
                {
                    // Ketu is always opposite to Rahu (180 degrees, which is 6 houses away)
                    int rahuHouse = (seed + 4) % 12 + 1;
                    houseNum = (rahuHouse + 6 - 1) % 12 + 1;
                }
                else
                {
                    houseNum = (seed + idx * 3) % 12 + 1;
                }

                houses[$"house{houseNum}"].Add(planet);

                planetaryPositions.Add(new
                {
                    planet,
                    degree = $"{ (seed * idx + 12) % 30 }°{ (seed + 15) % 60 }'{ (seed + 45) % 60 }\"",
                    rashi = Rashis[(ascendantIndex + houseNum - 1) % 12],
                    house = houseNum,
                    isRetrograde = planet == "Saturn" || planet == "Mercury" && seed % 2 == 0
                });
            }

            // Vimshottari Dasha calculations (120 years cycle starting from seed planet)
            int dashaStartIdx = seed % 9;
            var dashaList = new List<object>();
            var currentDate = dateOfBirth;

            for (int i = 0; i < 9; i++)
            {
                var currentDasha = DashaCycle[(dashaStartIdx + i) % 9];
                var endDate = currentDate.AddYears(currentDasha.Years);
                
                // Antardashas (sub-periods)
                var subPeriods = new List<object>();
                var subCurrentDate = currentDate;
                double totalDays = currentDasha.Years * 365.25;
                
                for (int j = 0; j < 9; j++)
                {
                    var subDasha = DashaCycle[(dashaStartIdx + i + j) % 9];
                    double factor = subDasha.Years / 120.0;
                    int subDays = (int)(totalDays * factor);
                    var subEndDate = subCurrentDate.AddDays(subDays);
                    subPeriods.Add(new
                    {
                        planet = subDasha.Planet,
                        start = subCurrentDate.ToString("yyyy-MM-dd"),
                        end = subEndDate.ToString("yyyy-MM-dd")
                    });
                    subCurrentDate = subEndDate;
                }

                dashaList.Add(new
                {
                    mahadasha = currentDasha.Planet,
                    start = currentDate.ToString("yyyy-MM-dd"),
                    end = endDate.ToString("yyyy-MM-dd"),
                    antardashas = subPeriods
                });
                currentDate = endDate;
            }

            // Yogas
            var yogas = new List<object>();
            bool hasBudhaditya = houses.Values.Any(h => h.Contains("Sun") && h.Contains("Mercury"));
            if (hasBudhaditya)
            {
                yogas.Add(new { name = "Budhaditya Yoga", description = "Conjunction of Sun and Mercury. Enhances intellect, analytical skills, and professional reputation." });
            }

            bool hasGajakesari = seed % 3 == 0; // Simulated angle check
            if (hasGajakesari)
            {
                yogas.Add(new { name = "Gajakesari Yoga", description = "Jupiter in quadrant from Moon. Grants wisdom, wealth, status, and long-lasting fame." });
            }

            if (yogas.Count == 0)
            {
                yogas.Add(new { name = "Raja Yoga", description = "Conjunction of Kendra and Trikona lords. Blesses the native with high authority and administrative success." });
            }

            // Doshas
            int marsHouse = (seed + 4 * 3) % 12 + 1;
            bool isManglik = new[] { 1, 4, 7, 8, 12 }.Contains(marsHouse);
            
            var doshas = new
            {
                isManglik,
                manglikSeverity = isManglik ? (seed % 2 == 0 ? "High" : "Mild") : "None",
                hasKaalSarp = seed % 5 == 0,
                sadeSatiStatus = rashi == "Capricorn" || rashi == "Aquarius" || rashi == "Pisces" 
                    ? "Saturn is transiting near Moon sign. Native is undergoing Sade Sati period."
                    : "No active Sade Sati."
            };

            // Calculate Panchang & Avakahada Chakra details deterministically based on seed
            var tithis = new[] { "Pratipada", "Dwitiya", "Tritiya", "Chaturthi", "Panchami", "Shasthi", "Saptami", "Ashtami", "Navami", "Dashami", "Ekadashi", "Dwadashi", "Trayodashi", "Chaturdashi", "Purnima", "Krishna Pratipada", "Krishna Dwitiya", "Krishna Tritiya", "Krishna Chaturthi", "Krishna Panchami", "Krishna Shasthi", "Krishna Saptami", "Krishna Ashtami", "Krishna Navami", "Krishna Dashami", "Krishna Ekadashi", "Krishna Dwadashi", "Krishna Trayodashi", "Krishna Chaturdashi", "Amavasya" };
            var yogasList = new[] { "Vishkumbha", "Preeti", "Ayushman", "Saubhagya", "Shobhana", "Atiganda", "Sukarma", "Dhriti", "Shoola", "Ganda", "Vriddhi", "Dhruva", "Vyaghata", "Harshana", "Vajra", "Siddhi", "Vyatipata", "Variyan", "Parigha", "Shiva", "Siddha", "Sadhya", "Shubha", "Shukla", "Brahma", "Indra", "Vaidhriti" };
            var karanas = new[] { "Bava", "Balava", "Kaulava", "Taitila", "Gara", "Vanija", "Vishti", "Shakuni", "Chatushpada", "Naga", "Kintughna" };
            var days = new[] { "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday" };
            var varnas = new[] { "Brahmana", "Kshatriya", "Vaishya", "Shudra" };
            var vashyas = new[] { "Chatushpad (Quadruped)", "Vanachar (Wild)", "Jalachar (Water)", "Keet (Insect)", "Nara (Human)" };
            var yonis = new[] { "Ashwa (Horse)", "Gaja (Elephant)", "Mesha (Sheep)", "Shwan (Dog)", "Marjara (Cat)", "Mushaka (Rat)", "Gau (Cow)", "Mahisha (Buffalo)", "Vyaghra (Tiger)", "Mriga (Deer)", "Vanar (Monkey)", "Nakula (Mongoose)", "Singha (Lion)", "Sarpa (Snake)" };
            var ganas = new[] { "Deva (Divine)", "Manushya (Human)", "Rakshasa (Demonic)" };
            var nadis = new[] { "Adi", "Madhya", "Antya" };

            string tithi = tithis[seed % 30];
            string yoga = yogasList[seed % 27];
            string karana = karanas[seed % 11];
            string vedicDay = days[((int)dateOfBirth.DayOfWeek) % 7];
            string ayanamsha = $"24° { (seed * 3) % 60 }' { (seed * 11) % 60 }\"";
            string sunrise = "05:48 AM";
            string sunset = "06:42 PM";
            int charan = (seed % 4) + 1;
            string varna = varnas[seed % 4];
            string vashya = vashyas[seed % 5];
            string yoni = yonis[seed % 14];
            string gana = ganas[seed % 3];
            string nadi = nadis[seed % 3];

            // Ascendant and Moon Lords
            var rashiLords = new Dictionary<string, string>
            {
                { "Aries", "Mars" }, { "Taurus", "Venus" }, { "Gemini", "Mercury" },
                { "Cancer", "Moon" }, { "Leo", "Sun" }, { "Virgo", "Mercury" },
                { "Libra", "Venus" }, { "Scorpio", "Mars" }, { "Sagittarius", "Jupiter" },
                { "Capricorn", "Saturn" }, { "Aquarius", "Saturn" }, { "Pisces", "Jupiter" }
            };
            string ascendantLord = rashiLords.ContainsKey(ascendant) ? rashiLords[ascendant] : "Sun";
            string moonSignLord = rashiLords.ContainsKey(rashi) ? rashiLords[rashi] : "Moon";

            var panchangObj = new
            {
                Tithi = tithi,
                Yoga = yoga,
                Karana = karana,
                VedicDay = vedicDay,
                Ayanamsha = ayanamsha,
                Sunrise = sunrise,
                Sunset = sunset,
                Charan = charan,
                Varna = varna,
                Vashya = vashya,
                Yoni = yoni,
                Gana = gana,
                Nadi = nadi,
                AscendantLord = ascendantLord,
                MoonSignLord = moonSignLord
            };

            // Generate Predictions
            var eduPreds = new[] {
                "Benefic Jupiter and Mercury placement indicates outstanding intellect, strong academic foundations, and high logical reasoning. Success in technical or scientific domains. Promising prospects for advanced studies or research.",
                "Favorable Mercury alignment offers excellent comprehension and writing capabilities. Great aptitude for literature, journalism, communications, and social sciences. Academic achievements through creative projects.",
                "Practical, result-oriented learning nature. Strong logical analysis and competitive drive. Highly suitable for management, engineering, or legal studies. Excels in business case analyses."
            };
            var healthPreds = new[] {
                "Generally robust physical constitution (Prakriti). High physical endurance. Watch out for stress-related headaches or eye strain. Incorporating outdoor walks and yoga in the morning will greatly boost longevity.",
                "Good core immunity and metabolism. Need to stay hydrated and take care of dietary hygiene to avoid acidity or gut sensitivity. A balanced vegetarian diet will enhance physical vitality.",
                "High mental and physical energy. Guard against joint stiffness or seasonal allergies. Regular detox programs and Ayurvedic herbs like Ashwagandha will maintain optimum vital forces."
            };
            var lifestylePreds = new[] {
                "Values structured, aesthetic, and clean environments. Inclined towards gardening, open spaces, or writing rooms. Enjoys cosmic silence and prefers a well-organized lifestyle.",
                "Dynamic, active lifestyle with regular travels. Prefers modern urban living with access to cultural hubs, social events, and sports activities. Values personal space and luxury assets.",
                "Reflective, spiritual lifestyle. Prefers a quiet home environment with dedicated corners for meditation or study. Enjoys natural scenery and values deep personal relationships over large social groups."
            };
            var naturePreds = new[] {
                "Deeply analytical, sincere, and intuitive. You have a quiet exterior but are highly creative inside. Extremely loyal to loved ones, though sometimes reserved in expressing emotions.",
                "Assertive, charismatic, and natural leader. You possess strong self-motivation and inspire others with your courage. Direct in communication and stands firm on moral principles.",
                "Diplomatic, empathetic, and peace-loving. You possess high emotional intelligence and search for balance in relationships. A natural mediator with an artistic imagination."
            };
            var moneyPreds = new[] {
                "Steady accumulation of wealth through structural investments and professional growth. Key property or real estate purchase is highly favorable between ages 28 and 32.",
                "Dynamic financial graph. Sudden gains through investments or creative entrepreneurship. Financial prosperity peaks after age 30, supported by smart asset diversification.",
                "Highly prosperous chart for finance. Gains from consulting, advisory roles, or writing. Strong planetary support ensures regular cash flow and comfort throughout life."
            };
            var agePreds = new[] {
                "Strong planetary chart indicating robust longevity (Dirghayu). Major shifts in life chapters around age 32 and 48, bringing immense wisdom and spiritual evolution.",
                "Longevity is favored with high physical resilience. Safe passage through major Saturn transits. Adapting spiritual disciplines will secure robust physical health during later years.",
                "Good life span with general wellness. Major milestones and career transitions at age 35. Gemstones like Yellow Sapphire or Ruby will further safeguard health during planetary Dashas."
            };
            int birthYear = dateOfBirth.Year;
            var eventPreds = new[] {
                $"Significant professional breakthrough and recognition between age 26-28. Favorable marriage or partnership window around year {birthYear + 28}-{birthYear + 30}. Major international travel or relocation in year {birthYear + 33}.",
                $"Academic milestone or key publication at age 24. Favorable vehicle or property purchase in year {birthYear + 31}. Deep spiritual realization or transition to leadership roles in year {birthYear + 36}.",
                $"Independent business launch or senior leadership role at age 31. Marriage or birth of child brings family fortune in year {birthYear + 29}-{birthYear + 30}. High public awards or honors in year {birthYear + 34}."
            };

            var predictionsObj = new
            {
                Education = eduPreds[seed % 3],
                Health = healthPreds[seed % 3],
                LivingStyle = lifestylePreds[seed % 3],
                Nature = naturePreds[seed % 3],
                Money = moneyPreds[seed % 3],
                Age = agePreds[seed % 3],
                BigEvents = eventPreds[seed % 3]
            };

            return new Kundli
            {
                Rashi = rashi,
                Nakshatra = nakshatra,
                Ascendant = ascendant,
                LagnaChartData = JsonSerializer.Serialize(houses),
                NavamsaChartData = JsonSerializer.Serialize(houses), // In simplified mock, navamsa uses similar structure
                PlanetaryPositions = JsonSerializer.Serialize(planetaryPositions),
                DashaAnalysis = JsonSerializer.Serialize(dashaList),
                Yogas = JsonSerializer.Serialize(yogas),
                Doshas = JsonSerializer.Serialize(doshas),
                Panchang = JsonSerializer.Serialize(panchangObj),
                Predictions = JsonSerializer.Serialize(predictionsObj)
            };
        }

        public CompatibilityReport RunMatchmaking(FamilyMember primary, FamilyMember secondary)
        {
            int primarySeed = Math.Abs((primary.DateOfBirth.Day + primary.DateOfBirth.Month) % 27);
            int secondarySeed = Math.Abs((secondary.DateOfBirth.Day + secondary.DateOfBirth.Month) % 27);

            // Guna Milan breakdown calculations (36 points)
            int varna = (primarySeed + secondarySeed) % 2 == 0 ? 1 : 0;
            int vashya = (primarySeed * secondarySeed) % 3 == 0 ? 2 : (primarySeed % 2 == 0 ? 1 : 0);
            int tara = (primarySeed + secondarySeed) % 4 != 0 ? 3 : 1;
            int yoni = (primarySeed * 2 + secondarySeed) % 5 == 0 ? 4 : 2;
            int maitri = (primarySeed + secondarySeed) % 6 != 0 ? 5 : 2;
            int gana = (primarySeed + secondarySeed) % 7 == 0 ? 6 : 4;
            int bhakoot = (primarySeed * secondarySeed) % 8 != 0 ? 7 : 0;
            int nadi = (primarySeed + secondarySeed) % 9 != 0 ? 8 : 0;

            int totalGunaScore = varna + vashya + tara + yoni + maitri + gana + bhakoot + nadi;
            decimal percentage = (totalGunaScore / 36.0m) * 100m;

            var manglikStatus = new
            {
                primaryIsManglik = primarySeed % 3 == 0,
                secondaryIsManglik = secondarySeed % 3 == 0,
                isCompatible = (primarySeed % 3 == 0) == (secondarySeed % 3 == 0)
            };

            var doshas = new
            {
                nadiDosha = nadi == 0,
                bhakootDosha = bhakoot == 0,
                remedyText = nadi == 0 ? "Perform Nadi Dosha Nivaran pooja and donate grains." : "No severe dosha detected."
            };

            string recommendations = totalGunaScore >= 18 
                ? "The matchmaking score is favorable. Marriage is recommended with standard planetary remedies." 
                : "The Guna score is low. Remedial measures should be taken before finalized decisions.";

            return new CompatibilityReport
            {
                PrimaryMemberId = primary.Id,
                SecondaryMemberId = secondary.Id,
                GunaMilanScore = totalGunaScore,
                ManglikStatus = JsonSerializer.Serialize(manglikStatus),
                DoshaAnalysis = JsonSerializer.Serialize(doshas),
                CompatibilityScore = Math.Round(percentage, 2),
                Recommendations = recommendations
            };
        }

        public List<string> GenerateBabyNames(DateTime dob, TimeSpan tob, decimal lat, decimal lng, string gender, string category)
        {
            int seed = Math.Abs((dob.Day + dob.Month + tob.Hours) % 27);
            string nakshatra = Nakshatras[seed];

            // Map Nakshatras to recommended starting syllables
            var letters = new Dictionary<string, string[]>
            {
                { "Ashwini", new[] { "Chu", "Che", "Cho", "La" } },
                { "Bharani", new[] { "Lee", "Lu", "Le", "Lo" } },
                { "Krittika", new[] { "A", "E", "U", "O" } },
                { "Rohini", new[] { "O", "Va", "Vi", "Vu" } }
            };

            var selectedSyllables = letters.ContainsKey(nakshatra) ? letters[nakshatra] : new[] { "A", "K", "S", "M" };

            var namesList = new List<string>();
            if (gender.Equals("Male", StringComparison.OrdinalIgnoreCase))
            {
                namesList.AddRange(new[] { "Aarav", "Kabir", "Manish", "Siddharth", "Vikram", "Chethan", "Lokesh", "Udit" });
            }
            else
            {
                namesList.AddRange(new[] { "Aditi", "Kavya", "Mira", "Sneha", "Vidhya", "Charul", "Lata", "Uma" });
            }

            // Filter names containing recommended syllables
            var filtered = namesList.Where(n => selectedSyllables.Any(s => n.StartsWith(s, StringComparison.OrdinalIgnoreCase))).ToList();
            if (filtered.Count == 0)
            {
                filtered = namesList.Take(4).ToList(); // Fallback
            }

            return filtered;
        }

        public object PlanBaby(DateTime expectedDate, string gender)
        {
            int seed = Math.Abs(expectedDate.DayOfYear % 12);
            string rashi = Rashis[seed];
            string nakshatra = Nakshatras[expectedDate.DayOfYear % 27];
            string startingLetter = "S";

            return new
            {
                expectedRashi = rashi,
                expectedNakshatra = nakshatra,
                suggestedStartingLetters = new[] { startingLetter, "A", "K" },
                numerologyAnalysis = "The date numbers reduce to Life Path Number 7, reflecting analytical minds and wisdom.",
                astrologyAnalysis = "Benefic Jupiter aspects the Moon sign on this date range, ensuring protective energies."
            };
        }

        public object PlanMuhurat(Guid familyMemberId, string eventType, DateTime startDate, DateTime endDate)
        {
            var datesList = new List<object>();
            var rnd = new Random(startDate.Day + startDate.Month);

            for (int i = 0; i < 3; i++)
            {
                var targetDate = startDate.AddDays(rnd.Next(1, (int)(endDate - startDate).TotalDays));
                datesList.Add(new
                {
                    date = targetDate.ToString("yyyy-MM-dd"),
                    timeSlot = "10:15 AM - 12:30 PM",
                    muhuratName = "Abhijit Muhurat",
                    score = rnd.Next(75, 98),
                    explanation = $"Highly auspicious day for {eventType}. Planetary alignments offer protection and growth."
                });
            }

            return datesList;
        }

        public List<Horoscope> GenerateHoroscopeBatch(DateTime date)
        {
            var list = new List<Horoscope>();
            var categories = new[] { "Daily", "Weekly", "Monthly", "Yearly" };
            
            foreach (var rashi in Rashis)
            {
                foreach (var tf in categories)
                {
                    var predictions = new Dictionary<string, string>
                    {
                        { "Career", "A favorable time for new projects and collaborations. Stay proactive." },
                        { "Finance", "Monitor expenses. Mid-period investments will yield positive results." },
                        { "Health", "Energy levels remain stable. Focus on diet and regular walks." },
                        { "Relationships", "Express your thoughts clearly to avoid misunderstandings with partners." }
                    };

                    list.Add(new Horoscope
                    {
                        Rashi = rashi,
                        Timeframe = tf,
                        DateOfPrediction = date,
                        Predictions = JsonSerializer.Serialize(predictions),
                        Language = "en"
                    });
                }
            }
            return list;
        }
    }
}
