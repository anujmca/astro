using AstroVerse.Core.Domain;

namespace AstroVerse.Core.Interfaces
{
    public interface ITokenService
    {
        string GenerateJwtToken(User user);
    }
}
