namespace KimarApi.Models.DTOs;

public record VendedorDto(
    Guid Id,
    string Nombre,
    Guid? UsuarioId,
    string? UsuarioEmail,
    bool Activo);

public record CreateVendedorRequest(string Nombre, Guid? UsuarioId);

public record UpdateVendedorRequest(string? Nombre, Guid? UsuarioId, bool? Activo);
