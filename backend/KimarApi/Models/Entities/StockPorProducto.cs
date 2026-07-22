using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace KimarApi.Models.Entities;

public class StockPorProducto
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid ProductoId { get; set; }

    // Variante interna de calidad (ej. "Glaseado 20%"). Null = producto sin variantes internas (comportamiento de siempre).
    public Guid? CalidadId { get; set; }

    public decimal Cantidad { get; set; } = 0;

    public decimal StockMinimo { get; set; } = 0;

    public DateTime FechaActualizacion { get; set; } = DateTime.UtcNow;

    // Navigation
    [ForeignKey(nameof(ProductoId))]
    public Producto Producto { get; set; } = null!;

    [ForeignKey(nameof(CalidadId))]
    public Calidad? Calidad { get; set; }
}
