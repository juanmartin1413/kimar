using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace KimarApi.Models.Entities;

public class ProductoProveedor
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid ProductoId { get; set; }

    public Guid ProveedorId { get; set; }

    [MaxLength(100)]
    public string? Codigo { get; set; }

    public decimal PrecioCompra { get; set; }

    public bool Activo { get; set; } = true;

    // Navigation
    [ForeignKey(nameof(ProductoId))]
    public Producto Producto { get; set; } = null!;

    [ForeignKey(nameof(ProveedorId))]
    public Proveedor Proveedor { get; set; } = null!;
}
