using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace KimarApi.Models.Entities;

public class Cliente
{
    public bool RequiereFactura { get; set; }
    [MaxLength(200)] public string? RazonSocial { get; set; }
    [MaxLength(300)] public string? DomicilioFiscal { get; set; }
    public int? CondicionIva { get; set; }
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required, MaxLength(200)]
    public string Nombre { get; set; } = string.Empty;

    [MaxLength(200)]
    public string? Calle { get; set; }

    [MaxLength(20)]
    public string? Altura { get; set; }

    [MaxLength(100)]
    public string? Localidad { get; set; }

    [MaxLength(100)]
    public string? Provincia { get; set; }

    [MaxLength(50)]
    public string? Telefono1 { get; set; }

    [MaxLength(50)]
    public string? Telefono2 { get; set; }

    [MaxLength(200)]
    public string? Email { get; set; }

    [MaxLength(20)]
    public string? Cuit { get; set; }

    public Guid? VendedorId { get; set; }

    public bool Activo { get; set; } = true;

    public DateTime FechaCreacion { get; set; } = DateTime.UtcNow;

    // Navigation
    [ForeignKey(nameof(VendedorId))]
    public Vendedor? Vendedor { get; set; }

    public ICollection<Pedido> Pedidos { get; set; } = [];
    public ICollection<Venta> Ventas { get; set; } = [];
    public ICollection<Cobranza> Cobranzas { get; set; } = [];
}
