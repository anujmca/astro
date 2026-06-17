using System;
using System.Collections.Generic;
using AstroVerse.Core.Domain;

namespace AstroVerse.Core.Interfaces
{
    public interface IAstrologyService
    {
        Kundli GenerateKundli(string name, string gender, DateTime dateOfBirth, TimeSpan timeOfBirth, decimal latitude, decimal longitude, string placeOfBirth);
        CompatibilityReport RunMatchmaking(FamilyMember primary, FamilyMember secondary);
        List<string> GenerateBabyNames(DateTime dob, TimeSpan tob, decimal lat, decimal lng, string gender, string category);
        object PlanBaby(DateTime expectedDate, string gender);
        object PlanMuhurat(Guid familyMemberId, string eventType, DateTime startDate, DateTime endDate);
        List<Horoscope> GenerateHoroscopeBatch(DateTime date);
    }
}
