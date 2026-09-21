namespace KimarApi.Models.DTOs;

public record ItemVentaDto(
    Guid Id,
    Guid ProductoId,
    Guid? CalidadId,
    string? CalidadNombre,
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
    IList<CobranzaDto> Cobranzas,
    string EstadoEntrega,
    Guid? RepartidorId,
    string? RepartidorNombre,
    DateTime? FechaEntregado);

public record ItemVentaRequest(
    Guid ProductoId,
    string Descripcion,
    decimal Cantidad,
    decimal PrecioUnitario,
    Guid? CalidadId = null);

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
    string? NroFactura,
    string? Observaciones,
    IList<ItemVentaRequest> Items,
    IList<CobranzaRequest> Cobranzas);

public record UpdateVentaRequest(
    string? NroRemito,
    string? NroFactura,
    string? Observaciones);

// ── Pedidos a preparar (rol depósito) ────────────────────────────────────────
// Sin precios, totales, estado de cobro ni cobranzas: es información comercial que el depósito no necesita.
public record ItemPreparacionDto(
    Guid ProductoId,
    string ProductoNombre,
    string Descripcion,
    Guid? CalidadId,
    string? CalidadNombre,
    decimal Cantidad,
    string Unidad);

public record VentaPreparacionDto(
    Guid Id,
    DateOnly FechaEntrega,
    string ClienteNombre,
    string VendedorNombre,
    string? NroRemito,
    string? Observaciones,
    string EstadoEntrega,
    Guid? RepartidorId,
    string? RepartidorNombre,
    IList<ItemPreparacionDto> Items);

// ── Edición completa de venta (solo admin) ───────────────────────────────────
// Id null = cuota nueva. Solo se envían las cuotas pendientes deseadas; las cobradas no se tocan.
public record PlanCobroItemRequest(
    Guid? Id,
    DateOnly Fecha,
    decimal Monto,
    string FormaPago,
    string? Observaciones = null);

public record UpdateVentaCompletaRequest(
    Guid ClienteId,
    Guid VendedorId,
    DateOnly FechaEntrega,
    string? NroRemito,
    string? NroFactura,
    string? Observaciones,
    IList<ItemVentaRequest> Items,
    IList<PlanCobroItemRequest> Cobranzas);
