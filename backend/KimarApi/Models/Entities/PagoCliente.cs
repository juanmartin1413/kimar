using System.ComponentModel.DataAnnotations;

namespace KimarApi.Models.Entities;

public class PagoCliente
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid OperacionId { get; set; }
    [MaxLength(64)] public string Huella { get; set; } = "";
    public Guid ClienteId { get; set; }
    public Cliente Cliente { get; set; } = null!;
    public Guid UsuarioId { get; set; }
    public DateOnly Fecha { get; set; }
    public decimal Monto { get; set; }
    [MaxLength(20)] public string FormaPago { get; set; } = "";
    [MaxLength(500)] public string? Observaciones { get; set; }
    public DateTime FechaCreacion { get; set; } = DateTime.UtcNow;
    public ICollection<ImputacionPago> Imputaciones { get; set; } = [];
}

public class ImputacionPago
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid PagoId { get; set; }
    public PagoCliente Pago { get; set; } = null!;
    public Guid CobranzaId { get; set; }
    public Cobranza Cobranza { get; set; } = null!;
    public decimal Monto { get; set; }
}
