namespace KimarApi.Models.DTOs;

public record ReceptorFiscal(string RazonSocial, string Cuit, int CondicionIva, string Domicilio);
public record ItemFiscal(string Descripcion, decimal Cantidad, string Unidad, decimal Precio, decimal Neto, decimal Iva);
public record EmisorFiscal(string Id, string Cuit, string RazonSocial, string Domicilio, string IngresosBrutos,
    string InicioActividades, int PuntoVenta);
public record DatosFiscales(EmisorFiscal Emisor, ReceptorFiscal Receptor, List<ItemFiscal> Items, string? Observaciones);
public record PreviewFacturaRequest(Guid ClienteId, IList<ItemVentaRequest> Items, ReceptorFiscal Receptor,
    IList<string> Descripciones, string? Observaciones = null);
public record NotaCreditoRequest(string Motivo, string EfectoComercial); // anular_venta | correccion_fiscal
public record CorregirFiscalRequest(ReceptorFiscal Receptor, IList<string> Descripciones, string? Observaciones, DateOnly Fecha);
public record ComprobanteFiscalDto(Guid Id, Guid? VentaId, string EmisorId, string Ambiente, int Tipo,
    int PuntoVenta, long? Numero, string? NumeroCompleto, DateOnly Fecha, decimal Neto, decimal Iva, decimal Total,
    string Estado, string? Cae, DateOnly? VencimientoCae, DatosFiscales Datos, Guid? ComprobanteOrigenId,
    Guid? ReemplazaId, string? Motivo, string? EfectoComercial, string? UltimoError, string? ObservacionesArca,
    int Intentos, DateTime? ProximoIntento, DateTime? UltimoIntento, DateTime FechaCreacion, bool PdfDisponible, string? ErrorPdf);
