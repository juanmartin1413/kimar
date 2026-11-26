using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace KimarApi.Models.Entities;

// Compromiso de cobro. Los pagos efectivos se guardan en PagoCliente e ImputacionPago.
public class Cobranza
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid? VentaId { get; set; }

    public Guid ClienteId { get; set; }

    public DateOnly Fecha { get; set; }

    public decimal Monto { get; set; }

    [Required, MaxLength(20)]
    public string FormaPago { get; set; } = ""; // Columna legada: no se asigna un medio al compromiso.

    [Required, MaxLength(20)]
    public string Estado { get; set; } = "pendiente"; // pendiente | cancelado; saldo y vencimiento se derivan.

    // Columna legada sin uso en el modelo nuevo; la fecha efectiva está en PagoCliente.
    public DateOnly? FechaCobro { get; set; }

    [MaxLength(500)]
    public string? Observaciones { get; set; }

    public DateTime FechaCreacion { get; set; } = DateTime.UtcNow;

    public ICollection<ImputacionPago> Imputaciones { get; set; } = [];

    // Navigation
    [ForeignKey(nameof(VentaId))]
    public Venta? Venta { get; set; }

    [ForeignKey(nameof(ClienteId))]
    public Cliente Cliente { get; set; } = null!;
}
