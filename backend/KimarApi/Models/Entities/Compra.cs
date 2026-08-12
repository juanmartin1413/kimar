using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace KimarApi.Models.Entities;

public class Compra
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid ProveedorId { get; set; }

    public Guid UsuarioId { get; set; }

    // Snapshot de qué forma de pago negociada estaba vigente al momento de la compra.
    // Se resuelve del lado del servidor; nunca cambia aunque el proveedor pacte una condición nueva después.
    public Guid FormaPagoProveedorId { get; set; }

    // Fecha en que la mercadería ingresa a la empresa; base de cómputo de los plazos de pago
    public DateOnly FechaRecepcion { get; set; }

    [Required, MaxLength(50)]
    public string NroRemito { get; set; } = string.Empty;

    [MaxLength(50)]
    public string? NroFactura { get; set; }

    public decimal Total { get; set; }

    [Required, MaxLength(20)]
    public string Estado { get; set; } = "registrada"; // registrada | anulada

    [MaxLength(500)]
    public string? Observaciones { get; set; }

    public DateTime FechaCreacion { get; set; } = DateTime.UtcNow;

    // Navigation
    [ForeignKey(nameof(ProveedorId))]
    public Proveedor Proveedor { get; set; } = null!;

    [ForeignKey(nameof(UsuarioId))]
    public Usuario Usuario { get; set; } = null!;

    [ForeignKey(nameof(FormaPagoProveedorId))]
    public FormaPagoProveedor FormaPagoProveedor { get; set; } = null!;

    public ICollection<ItemCompra> Items { get; set; } = [];
    public ICollection<MovimientoStock> MovimientosStock { get; set; } = [];
    public CompromisoProv? Compromiso { get; set; }
}
