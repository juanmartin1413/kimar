using System.ComponentModel.DataAnnotations;

namespace KimarApi.Models.Entities;

public class Producto
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required, MaxLength(200)]
    public string Nombre { get; set; } = string.Empty;

    [Required, MaxLength(30)]
    public string Categoria { get; set; } = "otros"; // calamares|langostinos|bivalvos|pescados|pulpos|otros

    public decimal PrecioKg { get; set; }

    [Required, MaxLength(20)]
    public string Unidad { get; set; } = "kg"; // kg | unidad

    public bool Activo { get; set; } = true;

    // Navigation
    public ICollection<ItemPedido> ItemsPedido { get; set; } = [];
    public ICollection<ItemVenta> ItemsVenta { get; set; } = [];
    public StockPorProducto? Stock { get; set; }
    public ICollection<MovimientoStock> MovimientosStock { get; set; } = [];
    public ICollection<ProductoProveedor> ProductosProveedores { get; set; } = [];
}
