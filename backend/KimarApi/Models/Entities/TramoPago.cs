using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace KimarApi.Models.Entities;

public class TramoPago
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid FormaPagoProveedorId { get; set; }

    public int Orden { get; set; }

    // % del total de la compra que cubre este tramo; la suma de tramos de una misma FormaPagoProveedor debe ser 100
    public decimal Porcentaje { get; set; }

    // Días desde la fecha de recepción de la mercadería hasta el vencimiento de este tramo
    public int DiasPlazo { get; set; }

    [Required, MaxLength(20)]
    public string MetodoPago { get; set; } = "transferencia"; // transferencia | echeq | efectivo

    // Navigation
    [ForeignKey(nameof(FormaPagoProveedorId))]
    public FormaPagoProveedor FormaPagoProveedor { get; set; } = null!;
}
