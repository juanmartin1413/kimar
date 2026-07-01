namespace KimarApi.Models.DTOs;

public record StockActualDto(
    Guid ProductoId,
    string ProductoNombre,
    string Categoria,
    decimal Cantidad,
    decimal StockMinimo,
    string Estado, // SIN_STOCK | BAJO | NORMAL
    DateTime FechaActualizacion);

public record MovimientoStockDto(
    Guid Id,
    Guid ProductoId,
    string ProductoNombre,
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
    string? Observaciones);

public record AjusteStockRequest(
    Guid ProductoId,
    decimal CantidadNueva,
    string? Observaciones);

public record UpdateStockMinimoRequest(decimal StockMinimo);

public record RegistrarStockRealRequest(
    Guid ProductoId,
    decimal Cantidad,
    DateOnly Fecha,
    string? Observaciones);
