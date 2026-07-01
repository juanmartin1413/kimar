namespace KimarApi.Models.DTOs;

public record ProveedorDto(
    Guid Id,
    string Nombre,
    string? Telefono,
    string? Email,
    string? Direccion,
    bool Activo,
    DateTime FechaCreacion);

public record CreateProveedorRequest(
    string Nombre,
    string? Telefono,
    string? Email,
    string? Direccion);

public record UpdateProveedorRequest(
    string? Nombre,
    string? Telefono,
    string? Email,
    string? Direccion,
    bool? Activo);

public record CuotaProvDto(
    Guid Id,
    DateOnly Fecha,
    decimal Monto,
    string FormaPago,
    string Estado,
    DateOnly? FechaPago);

public record CompromisoProvDto(
    Guid Id,
    Guid ProveedorId,
    string ProveedorNombre,
    string Concepto,
    string? Observaciones,
    DateTime FechaCreacion,
    IList<CuotaProvDto> Cuotas);

public record CreateCompromisoRequest(
    Guid ProveedorId,
    string Concepto,
    string? Observaciones,
    IList<CuotaRequest> Cuotas);

public record CuotaRequest(
    DateOnly Fecha,
    decimal Monto,
    string FormaPago);
