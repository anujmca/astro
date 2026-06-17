using System;

namespace AstroVerse.Core.Domain
{
    public class Translation
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public string LanguageCode { get; set; } = "en";
        public string Key { get; set; } = string.Empty;
        public string Value { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
