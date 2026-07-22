using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace KimarApi.Models.Entities;

public class ItemVenta
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid VentaId { get; set; }

    public Guid ProductoId { get; set; }

    // Variante interna de calidad usada para descontar stock. Nunca se expone al cliente.
    public Guid? CalidadId { get; set; }

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

    [ForeignKey(nameof(CalidadId))]
    public Calidad? Calidad { get; set; }
}
