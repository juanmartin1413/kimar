using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace KimarApi.Models.Entities;

public class Pedido
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid ClienteId { get; set; }

    public Guid VendedorId { get; set; }

    public DateOnly Fecha { get; set; } = DateOnly.FromDateTime(DateTime.UtcNow);

    [Required, MaxLength(20)]
    public string Estado { get; set; } = "pendiente"; // pendiente | confirmado | cancelado

    [MaxLength(500)]
    public string? Observaciones { get; set; }

    public DateTime FechaCreacion { get; set; } = DateTime.UtcNow;

    // Navigation
    [ForeignKey(nameof(ClienteId))]
    public Cliente Cliente { get; set; } = null!;

    [ForeignKey(nameof(VendedorId))]
    public Vendedor Vendedor { get; set; } = null!;

    public ICollection<ItemPedido> Items { get; set; } = [];

    public Venta? Venta { get; set; }
}
