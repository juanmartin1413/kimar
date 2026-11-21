using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace KimarApi.Models.Entities;

public class ComisionDocumento
{
    public Guid Id { get; set; } = Guid.NewGuid();
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)] public long Numero { get; set; }
    public Guid VendedorId { get; set; }
    public Vendedor Vendedor { get; set; } = null!;
    public Guid OperacionId { get; set; }
    [MaxLength(64)] public string Huella { get; set; } = "";
    [MaxLength(30)] public string Tipo { get; set; } = "liquidacion";
    public DateOnly Fecha { get; set; }
    public DateTime Creado { get; set; } = DateTime.UtcNow;
    public Guid UsuarioId { get; set; }
    public Guid? OrigenId { get; set; }
    public decimal Comision { get; set; }
    public decimal Pago { get; set; }
    public decimal Compensado { get; set; }
    [MaxLength(30)] public string? FormaPago { get; set; }
    [MaxLength(200)] public string? Referencia { get; set; }
    [MaxLength(500)] public string? Motivo { get; set; }
    public string DatosJson { get; set; } = "{}";
    public List<ComisionDetalle> Detalles { get; set; } = [];
    public List<ComisionAplicacion> Aplicaciones { get; set; } = [];
}

public class ComisionDetalle
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid DocumentoId { get; set; }
    public ComisionDocumento Documento { get; set; } = null!;
    public Guid VentaId { get; set; }
    public Venta Venta { get; set; } = null!;
    public decimal Importe { get; set; }
}

public class ComisionAplicacion
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid DocumentoId { get; set; }
    public ComisionDocumento Documento { get; set; } = null!;
    public Guid AnticipoId { get; set; }
    public ComisionDocumento Anticipo { get; set; } = null!;
    public decimal Importe { get; set; }
}
