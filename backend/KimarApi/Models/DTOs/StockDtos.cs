namespace KimarApi.Models.DTOs;

public record StockActualDto(
    Guid ProductoId,
    string ProductoNombre,
    string Categoria,
    Guid? CalidadId,
    string? CalidadNombre,
    decimal Cantidad,
    decimal StockMinimo,
    string Estado, // SIN_STOCK | BAJO | NORMAL
    DateTime FechaActualizacion);

public record MovimientoStockDto(
    Guid Id,
    Guid ProductoId,
    string ProductoNombre,
    Guid? CalidadId,
    string? CalidadNombre,
    string Tipo,
    decimal Cantidad,
    string Motivo,
    Guid UsuarioId,
    string UsuarioNombre,
    Guid? VentaId,
    Guid? ProveedorId,
    string? ProveedorNombre,
    DateOnly Fecha,
    string? Observaciones,
    DateTime FechaCreacion);

public record RegistrarEntradaRequest(
    Guid ProductoId,
    decimal Cantidad,
    Guid? ProveedorId,
    DateOnly Fecha,
    string? Observaciones,
    Guid? CalidadId = null);

public record AjusteStockRequest(
    Guid ProductoId,
    decimal CantidadNueva,
    string? Observaciones,
    Guid? CalidadId = null);

public record UpdateStockMinimoRequest(decimal StockMinimo, Guid? CalidadId = null);

public record RegistrarSalidaRequest(
    Guid ProductoId,
    decimal Cantidad,
    string Motivo,
    DateOnly Fecha,
    string? Observaciones,
    Guid? CalidadId = null);

public record RegistrarStockRealRequest(
    Guid ProductoId,
    decimal Cantidad,
    DateOnly Fecha,
    string? Observaciones);
