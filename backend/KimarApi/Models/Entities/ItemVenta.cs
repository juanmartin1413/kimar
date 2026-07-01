using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace KimarApi.Models.Entities;

public class ItemVenta
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid VentaId { get; set; }

    public Guid ProductoId { get; set; }

    [Required, MaxLength(200)]
    public string Descripcion { get; set; } = string.Empty;

    public decimal Cantidad { get; set; }

    public decimal PrecioUnitario { get; set; }

    public decimal Subtotal { get; set; }

    // Navigation
    [ForeignKey(nameof(VentaId))]
    public Venta Venta { get; set; } = null!;

    [ForeignKey(nameof(ProductoId))]
    public Producto Producto { get; set; } = null!;
}
