using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace KimarApi.Models.Entities;

public class Cobranza
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid? VentaId { get; set; }

    public Guid ClienteId { get; set; }

    public DateOnly Fecha { get; set; }

    public decimal Monto { get; set; }

    [Required, MaxLength(20)]
    public string FormaPago { get; set; } = "efectivo"; // efectivo | transferencia | cheque

    [Required, MaxLength(20)]
    public string Estado { get; set; } = "pendiente"; // pendiente | cobrado | vencido

    [MaxLength(500)]
    public string? Observaciones { get; set; }

    public DateTime FechaCreacion { get; set; } = DateTime.UtcNow;

    // Navigation
    [ForeignKey(nameof(VentaId))]
    public Venta? Venta { get; set; }

    [ForeignKey(nameof(ClienteId))]
    public Cliente Cliente { get; set; } = null!;
}
