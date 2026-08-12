namespace KimarApi.Models.DTOs;

public record ItemCompraDto(
    Guid Id,
    Guid ProductoId,
    string ProductoNombre,
    Guid? CalidadId,
    string? CalidadNombre,
    decimal Cantidad,
    decimal PrecioUnitario,
    decimal Subtotal);

public record CompraDto(
    Guid Id,
    Guid ProveedorId,
    string ProveedorNombre,
    Guid UsuarioId,
    string UsuarioNombre,
    Guid FormaPagoProveedorId,
    DateOnly FechaRecepcion,
    string NroRemito,
    string? NroFactura,
    decimal Total,
    string Estado,
    string? Observaciones,
    DateTime FechaCreacion,
    IList<ItemCompraDto> Items,
    CompromisoProvDto? Compromiso);

public record ItemCompraRequest(
    Guid ProductoId,
    Guid? CalidadId,
    decimal Cantidad,
    decimal PrecioUnitario);

public record CreateCompraRequest(
    Guid ProveedorId,
    DateOnly FechaRecepcion,
    string NroRemito,
    string? NroFactura,
    string? Observaciones,
    IList<ItemCompraRequest> Items);
