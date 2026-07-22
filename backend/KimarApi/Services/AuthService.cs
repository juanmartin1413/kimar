using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using KimarApi.Data;
using KimarApi.Models.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

namespace KimarApi.Services;

public class AuthService(KimarDbContext db, IConfiguration config)
{
    public async Task<(string Token, Usuario Usuario)?> LoginAsync(string email, string password)
    {
        var user = await db.Usuarios
            .FirstOrDefaultAsync(u => u.Email == email.ToLower() && u.Activo);

        if (user is null || !BCrypt.Net.BCrypt.Verify(password, user.PasswordHash))
            return null;

        var token = GenerateToken(user);
        return (token, user);
    }

    private string GenerateToken(Usuario user)
    {
        var secret = Environment.GetEnvironmentVariable("JWT_SECRET")
            ?? config["Jwt:Secret"]!;
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var expHours = int.TryParse(config["Jwt:ExpirationHours"], out var h) ? h : 48;

        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new Claim(JwtRegisteredClaimNames.Email, user.Email),
            new Claim(ClaimTypes.Role, user.Rol),
            new Claim("nombre", user.Nombre),
            new Claim("rol", user.Rol)
        };

        var token = new JwtSecurityToken(
            issuer: config["Jwt:Issuer"],
            audience: config["Jwt:Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddHours(expHours),
            signingCredentials: creds);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    public static string HashPassword(string password) =>
        BCrypt.Net.BCrypt.HashPassword(password, workFactor: 12);
}
