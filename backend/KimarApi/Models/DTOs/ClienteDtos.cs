namespace KimarApi.Models.DTOs;

public record ClienteDto(
    Guid Id,
    string Nombre,
    string? Calle,
    string? Altura,
    string? Localidad,
    string? Provincia,
    string? Telefono1,
    string? Telefono2,
    string? Email,
    Guid? VendedorId,
    string? VendedorNombre,
    bool Activo,
    DateTime FechaCreacion);

public record CreateClienteRequest(
    string Nombre,
    string? Calle,
    string? Altura,
    string? Localidad,
    string? Provincia,
    string? Telefono1,
    string? Telefono2,
    string? Email,
    Guid? VendedorId);

public record UpdateClienteRequest(
    string? Nombre,
    string? Calle,
    string? Altura,
    string? Localidad,
    string? Provincia,
    string? Telefono1,
    string? Telefono2,
    string? Email,
    Guid? VendedorId,
    bool? Activo);
