using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace KimarApi.Models.Entities;

public class ItemCompra
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid CompraId { get; set; }

    public Guid ProductoId { get; set; }

    public Guid? CalidadId { get; set; }

    public decimal Cantidad { get; set; }

    public decimal PrecioUnitario { get; set; }

    public decimal Subtotal { get; set; }

    // Navigation
    [ForeignKey(nameof(CompraId))]
    public Compra Compra { get; set; } = null!;

    [ForeignKey(nameof(ProductoId))]
    public Producto Producto { get; set; } = null!;

    [ForeignKey(nameof(CalidadId))]
    public Calidad? Calidad { get; set; }
}
