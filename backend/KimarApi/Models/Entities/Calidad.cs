using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace KimarApi.Models.Entities;

public class Calidad
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid ProductoId { get; set; }

    [Required, MaxLength(100)]
    public string Nombre { get; set; } = string.Empty; // "Glaseado 20%", "Glaseado 30%", etc. — solo uso interno

    public bool Activo { get; set; } = true;

    // Navigation
    [ForeignKey(nameof(ProductoId))]
    public Producto Producto { get; set; } = null!;
    public ICollection<StockPorProducto> Stocks { get; set; } = [];
    public ICollection<MovimientoStock> Movimientos { get; set; } = [];
    public ICollection<ItemVenta> ItemsVenta { get; set; } = [];
    public ICollection<ItemCompra> ItemsCompra { get; set; } = [];
}
