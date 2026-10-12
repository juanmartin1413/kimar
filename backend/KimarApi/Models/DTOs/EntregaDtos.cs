namespace KimarApi.Models.DTOs;

// ── Módulo de entregas (rol repartidor + depósito) ───────────────────────────

public record RepartidorLiteDto(Guid Id, string Nombre);

// RepartidorId null = "listo para entrega, sin asignar" (cualquier repartidor puede tomarlo).
// MedioEnvio null = reparto propio. Con uber/remis el RepartidorId se ignora.
public record MarcarListoRequest(Guid? RepartidorId, string? MedioEnvio = null);

// Cierre manual de un envío externo (uber/remis). La foto del remito firmado es opcional.
public record MarcarEntregadoRequest(string? Nombre, string? ContentType, string? ContenidoBase64);

public record CreateDocumentoEntregaRequest(
    string Tipo,
    string Nombre,
    string ContentType,
    string ContenidoBase64);

// Vista del repartidor sobre una venta: lo necesario para entregar (a quién, dónde, qué).
// Sin precios, total, estado de cobro ni cobranzas.
public record VentaEntregaDto(
    Guid Id,
    DateOnly FechaEntrega,
    string ClienteNombre,
    string? Calle,
    string? Altura,
    string? Localidad,
    string? Telefono1,
    string? Telefono2,
    string VendedorNombre,
    string? NroRemito,
    string? Observaciones,
    string EstadoEntrega,
    Guid? RepartidorId,
    string? RepartidorNombre,
    string MedioEnvio,
    DateTime? FechaListo,
    DateTime? FechaEntregado,
    IList<ItemPreparacionDto> Items,
    IList<AdjuntoDto> Documentos);
