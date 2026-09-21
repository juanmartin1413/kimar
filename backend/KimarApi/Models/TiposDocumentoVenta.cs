namespace KimarApi.Models;

// Catálogo cerrado de documentos que se pueden adjuntar a una Venta desde el módulo de entregas.
// Los repartidores no suben archivos "libres": cada documento tiene un tipo con significado de negocio.
// Se persiste en Adjunto.Tipo (MaxLength 20).
public static class TiposDocumentoVenta
{
    public const string RemitoFirmado = "remito_firmado";

    // Reservado para la factura electrónica (AFIP). Todavía no se habilita la carga manual.
    public const string Factura = "factura";

    public static readonly string[] Habilitados = [RemitoFirmado];

    public static bool EsValido(string? tipo) => tipo is not null && Habilitados.Contains(tipo);

    // Solo el remito firmado por el cliente prueba la entrega; otros documentos no cambian el estado.
    public static bool MarcaEntregado(string tipo) => tipo == RemitoFirmado;
}
