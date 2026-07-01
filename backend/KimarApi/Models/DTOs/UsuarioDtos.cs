namespace KimarApi.Models.DTOs;

public record UsuarioDto(
    Guid Id,
    string Nombre,
    string Email,
    string Rol,
    bool Activo,
    DateTime FechaCreacion);

public record CreateUsuarioRequest(
    string Nombre,
    string Email,
    string Password,
    string Rol);

public record UpdateUsuarioRequest(
    string? Nombre,
    string? Email,
    string? Password,
    string? Rol,
    bool? Activo);
