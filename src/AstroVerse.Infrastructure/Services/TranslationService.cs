using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Distributed;
using AstroVerse.Core.Domain;
using AstroVerse.Core.Interfaces;
using AstroVerse.Infrastructure.Data;

namespace AstroVerse.Infrastructure.Services
{
    public class TranslationService : ITranslationService
    {
        private readonly ApplicationDbContext _context;
        private readonly IDistributedCache _cache;
        private const string CachePrefix = "translations:";

        public TranslationService(ApplicationDbContext context, IDistributedCache cache)
        {
            _context = context;
            _cache = cache;
        }

        public async Task<Dictionary<string, string>> GetTranslationsAsync(string languageCode)
        {
            string cacheKey = $"{CachePrefix}{languageCode}";
            try
            {
                var cachedData = await _cache.GetStringAsync(cacheKey);
                if (!string.IsNullOrEmpty(cachedData))
                {
                    return JsonSerializer.Deserialize<Dictionary<string, string>>(cachedData) 
                           ?? new Dictionary<string, string>();
                }
            }
            catch
            {
                // Fallback to DB silently if Redis connection fails in development
            }

            var dbTranslations = await _context.Translations
                .Where(t => t.LanguageCode == languageCode)
                .ToDictionaryAsync(t => t.Key, t => t.Value);

            if (dbTranslations.Count > 0)
            {
                try
                {
                    var options = new DistributedCacheEntryOptions
                    {
                        AbsoluteExpirationRelativeToNow = TimeSpan.FromHours(24)
                    };
                    await _cache.SetStringAsync(cacheKey, JsonSerializer.Serialize(dbTranslations), options);
                }
                catch
                {
                    // Ignore cache errors in offline/dev envs
                }
            }

            return dbTranslations;
        }

        public async Task UpdateTranslationAsync(string languageCode, string key, string value)
        {
            var translation = await _context.Translations
                .FirstOrDefaultAsync(t => t.LanguageCode == languageCode && t.Key == key);

            if (translation != null)
            {
                translation.Value = value;
            }
            else
            {
                _context.Translations.Add(new Translation
                {
                    LanguageCode = languageCode,
                    Key = key,
                    Value = value
                });
            }

            await _context.SaveChangesAsync();

            // Clear cache
            string cacheKey = $"{CachePrefix}{languageCode}";
            try
            {
                await _cache.RemoveAsync(cacheKey);
            }
            catch
            {
                // Ignore Redis failures
            }
        }

        public async Task<List<Translation>> GetAllTranslationsAsync()
        {
            return await _context.Translations.ToListAsync();
        }
    }
}
