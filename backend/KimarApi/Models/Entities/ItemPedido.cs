using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace KimarApi.Models.Entities;

public class ItemPedido
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid PedidoId { get; set; }

    public Guid ProductoId { get; set; }

    [Required, MaxLength(200)]
    public string ProductoNombre { get; set; } = string.Empty;

    public decimal Cantidad { get; set; }

    public decimal PrecioUnitario { get; set; }

    public decimal Subtotal { get; set; }

    // Navigation
    [ForeignKey(nameof(PedidoId))]
    public Pedido Pedido { get; set; } = null!;

    [ForeignKey(nameof(ProductoId))]
    public Producto Producto { get; set; } = null!;
}
