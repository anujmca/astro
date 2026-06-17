using System.Collections.Generic;
using System.Threading.Tasks;
using AstroVerse.Core.Domain;

namespace AstroVerse.Core.Interfaces
{
    public interface ITranslationService
    {
        Task<Dictionary<string, string>> GetTranslationsAsync(string languageCode);
        Task UpdateTranslationAsync(string languageCode, string key, string value);
        Task<List<Translation>> GetAllTranslationsAsync();
    }
}
