namespace KimarApi.Models.DTOs;

public record GastoFijoDto(
    Guid Id,
    string Nombre,
    string? Descripcion,
    decimal Monto,
    string Tipo,
    int? DiaPago,
    bool Activo,
    DateTime FechaCreacion);

public record CreateGastoFijoRequest(
    string Nombre,
    string? Descripcion,
    decimal Monto,
    string Tipo,
    int? DiaPago);

public record UpdateGastoFijoRequest(
    string? Nombre,
    string? Descripcion,
    decimal? Monto,
    int? DiaPago,
    bool? Activo);

public record InstanciaGastoDto(
    Guid Id,
    Guid GastoFijoId,
    string GastoNombre,
    int Mes,
    int Anio,
    decimal Monto,
    DateOnly? FechaVencimiento,
    bool Pagado,
    DateOnly? FechaPago,
    DateTime FechaCreacion);
