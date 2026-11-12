using System.ComponentModel.DataAnnotations;

namespace KimarApi.Models.Entities;

// El borrador y la solicitud durable son el mismo documento. Nunca se elimina un autorizado.
public class ComprobanteFiscal
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid? VentaId { get; set; }
    public Venta? Venta { get; set; }
    public Guid UsuarioId { get; set; }
    public Guid ClienteId { get; set; }
    [MaxLength(80)] public string EmisorId { get; set; } = "";
    [MaxLength(20)] public string Ambiente { get; set; } = "";
    [MaxLength(11)] public string CuitEmisor { get; set; } = "";
    public int PuntoVenta { get; set; }
    public int Tipo { get; set; } = 1; // 1: FC A, 3: NC A
    public long? Numero { get; set; }
    public DateOnly Fecha { get; set; }
    public decimal Neto { get; set; }
    public decimal Iva { get; set; }
    public decimal Total { get; set; }
    [MaxLength(30)] public string Estado { get; set; } = "borrador";
    public string DatosJson { get; set; } = "";
    [MaxLength(64)] public string HuellaVenta { get; set; } = "";
    public Guid? ComprobanteOrigenId { get; set; }
    public Guid? ReemplazaId { get; set; }
    [MaxLength(30)] public string? EfectoComercial { get; set; }
    [MaxLength(500)] public string? Motivo { get; set; }
    [MaxLength(20)] public string? Cae { get; set; }
    public DateOnly? VencimientoCae { get; set; }
    public string? ObservacionesArca { get; set; }
    public string? UltimoError { get; set; }
    public int Intentos { get; set; }
    public DateTime FechaCreacion { get; set; } = DateTime.UtcNow;
    public DateTime? UltimoIntento { get; set; }
    public DateTime? ProximoIntento { get; set; }
    public DateTime? AutorizadoEn { get; set; }
    [MaxLength(300)] public string? RutaPdf { get; set; }
    [MaxLength(64)] public string? HashPdf { get; set; }
    public string? ErrorPdf { get; set; }
    public ICollection<IntentoFiscal> Historial { get; set; } = [];
}

public class IntentoFiscal
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid ComprobanteFiscalId { get; set; }
    public ComprobanteFiscal ComprobanteFiscal { get; set; } = null!;
    public DateTime Fecha { get; set; } = DateTime.UtcNow;
    public long? Numero { get; set; }
    [MaxLength(30)] public string Resultado { get; set; } = "";
    public string? Detalle { get; set; }
}
