namespace KimarApi.Models.DTOs;

public record LoginRequest(string Email, string Password);

public record LoginResponse(
    string Token,
    Guid Id,
    string Nombre,
    string Email,
    string Rol);
