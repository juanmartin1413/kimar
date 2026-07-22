namespace KimarApi.Models.DTOs;

public record CalidadDto(
    Guid Id,
    Guid ProductoId,
    string Nombre,
    bool Activo);

public record CreateCalidadRequest(
    Guid ProductoId,
    string Nombre);

public record UpdateCalidadRequest(
    string? Nombre,
    bool? Activo);
