namespace KimarApi.Models.DTOs;

public record ItemVentaDto(
    Guid Id,
    Guid ProductoId,
    string Descripcion,
    decimal Cantidad,
    decimal PrecioUnitario,
    decimal Subtotal);

public record CobranzaDto(
    Guid Id,
    Guid? VentaId,
    Guid ClienteId,
    string ClienteNombre,
    DateOnly Fecha,
    decimal Monto,
    string FormaPago,
    string Estado,
    string? Observaciones,
    DateTime FechaCreacion);

public record VentaDto(
    Guid Id,
    Guid? PedidoId,
    Guid ClienteId,
    string ClienteNombre,
    Guid VendedorId,
    string VendedorNombre,
    DateOnly FechaEntrega,
    string? NroRemito,
    string? NroFactura,
    decimal Total,
    string Estado,
    string? Observaciones,
    DateTime FechaCreacion,
    IList<ItemVentaDto> Items,
    IList<CobranzaDto> Cobranzas);

public record ItemVentaRequest(
    Guid ProductoId,
    string Descripcion,
    decimal Cantidad,
    decimal PrecioUnitario);

public record CobranzaRequest(
    DateOnly Fecha,
    decimal Monto,
    string FormaPago,
    string Estado = "pendiente",
    string? Observaciones = null);

public record CreateVentaRequest(
    Guid? PedidoId,
    Guid ClienteId,
    Guid VendedorId,
    DateOnly FechaEntrega,
    string? NroRemito,
    string? NroFactura,
    string? Observaciones,
    IList<ItemVentaRequest> Items,
    IList<CobranzaRequest> Cobranzas);

public record UpdateVentaRequest(
    string? NroRemito,
    string? NroFactura,
    string? Observaciones);
