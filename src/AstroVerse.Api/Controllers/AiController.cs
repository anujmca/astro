using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using AstroVerse.Core.Interfaces;

namespace AstroVerse.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AiController : ControllerBase
    {
        private readonly IAiAssistantService _aiService;

        public AiController(IAiAssistantService aiService)
        {
            _aiService = aiService;
        }

        [HttpPost("chat")]
        public async Task<IActionResult> Chat([FromBody] ChatRequest request)
        {
            var result = await _aiService.GetChatCompletionAsync(
                request.UserId,
                request.Message,
                request.ActiveMemberId,
                request.LanguageCode ?? "en"
            );

            return Ok(new
            {
                success = true,
                data = new
                {
                    reply = result.Reply,
                    contextUsed = result.ContextUsed
                }
            });
        }
    }

    public class ChatRequest
    {
        public Guid UserId { get; set; }
        public string Message { get; set; } = string.Empty;
        public Guid? ActiveMemberId { get; set; }
        public string? LanguageCode { get; set; } = "en";
    }
}
