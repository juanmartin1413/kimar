using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace KimarApi.Models.Entities;

public class Venta
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid? PedidoId { get; set; }

    public Guid ClienteId { get; set; }

    public Guid VendedorId { get; set; }

    public DateOnly FechaEntrega { get; set; }

    [MaxLength(50)]
    public string? NroRemito { get; set; }

    [MaxLength(50)]
    public string? NroFactura { get; set; }

    public decimal Total { get; set; }

    [Required, MaxLength(20)]
    public string Estado { get; set; } = "debe"; // debe | cobrado_parcial | pagado

    [MaxLength(500)]
    public string? Observaciones { get; set; }

    public DateTime FechaCreacion { get; set; } = DateTime.UtcNow;

    // Navigation
    [ForeignKey(nameof(PedidoId))]
    public Pedido? Pedido { get; set; }

    [ForeignKey(nameof(ClienteId))]
    public Cliente Cliente { get; set; } = null!;

    [ForeignKey(nameof(VendedorId))]
    public Vendedor Vendedor { get; set; } = null!;

    public ICollection<ItemVenta> Items { get; set; } = [];
    public ICollection<Cobranza> Cobranzas { get; set; } = [];
    public ICollection<MovimientoStock> MovimientosStock { get; set; } = [];
}
