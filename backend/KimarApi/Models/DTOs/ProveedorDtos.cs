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
    DateOnly? FechaPago,
    decimal? MontoPagado,
    string? FormaPagoReal);

public record PagarCuotaRequest(
    decimal? MontoPagado = null,
    string? FormaPagoReal = null);

public record TramoPagoDto(
    Guid Id,
    int Orden,
    decimal Porcentaje,
    int DiasPlazo,
    string MetodoPago);

public record FormaPagoProveedorDto(
    Guid Id,
    Guid ProveedorId,
    DateOnly FechaDesde,
    DateOnly? FechaHasta,
    string? Observaciones,
    DateTime FechaCreacion,
    IList<TramoPagoDto> Tramos);

public record TramoPagoRequest(
    int Orden,
    decimal Porcentaje,
    int DiasPlazo,
    string MetodoPago);

public record CreateFormaPagoRequest(
    DateOnly FechaDesde,
    IList<TramoPagoRequest> Tramos,
    string? Observaciones = null);

public record CompromisoProvDto(
    Guid Id,
    Guid ProveedorId,
    string ProveedorNombre,
    Guid? CompraId,
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
