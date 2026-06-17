using System;
using System.Threading.Tasks;

namespace AstroVerse.Core.Interfaces
{
    public interface IAiAssistantService
    {
        Task<(string Reply, string[] ContextUsed)> GetChatCompletionAsync(Guid userId, string message, Guid? activeMemberId, string languageCode);
    }
}
