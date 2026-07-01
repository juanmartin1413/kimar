namespace KimarApi.Models.DTOs;

public record ItemPedidoDto(
    Guid Id,
    Guid ProductoId,
    string ProductoNombre,
    decimal Cantidad,
    decimal PrecioUnitario,
    decimal Subtotal);

public record PedidoDto(
    Guid Id,
    Guid ClienteId,
    string ClienteNombre,
    Guid VendedorId,
    string VendedorNombre,
    DateOnly Fecha,
    string Estado,
    string? Observaciones,
    DateTime FechaCreacion,
    IList<ItemPedidoDto> Items);

public record ItemPedidoRequest(
    Guid ProductoId,
    string ProductoNombre,
    decimal Cantidad,
    decimal PrecioUnitario);

public record CreatePedidoRequest(
    Guid ClienteId,
    Guid VendedorId,
    DateOnly Fecha,
    string? Observaciones,
    IList<ItemPedidoRequest> Items);

public record UpdatePedidoRequest(
    string? Estado,
    string? Observaciones);
