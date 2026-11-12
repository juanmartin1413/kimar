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
    string? Cuit,
    Guid? VendedorId,
    string? VendedorNombre,
    bool Activo,
    DateTime FechaCreacion,
    bool RequiereFactura = false, string? RazonSocial = null, string? DomicilioFiscal = null, int? CondicionIva = null);

public record CreateClienteRequest(
    string Nombre,
    string? Calle,
    string? Altura,
    string? Localidad,
    string? Provincia,
    string? Telefono1,
    string? Telefono2,
    string? Email,
    string? Cuit,
    Guid? VendedorId,
    bool RequiereFactura = false, string? RazonSocial = null, string? DomicilioFiscal = null, int? CondicionIva = null);

public record UpdateClienteRequest(
    string? Nombre,
    string? Calle,
    string? Altura,
    string? Localidad,
    string? Provincia,
    string? Telefono1,
    string? Telefono2,
    string? Email,
    string? Cuit,
    Guid? VendedorId,
    bool? Activo,
    bool? RequiereFactura = null, string? RazonSocial = null, string? DomicilioFiscal = null, int? CondicionIva = null);
