using System.ComponentModel.DataAnnotations;

namespace KimarApi.Models.Entities;

public class Proveedor
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required, MaxLength(200)]
    public string Nombre { get; set; } = string.Empty;

    [MaxLength(50)]
    public string? Telefono { get; set; }

    [MaxLength(200)]
    public string? Email { get; set; }

    [MaxLength(300)]
    public string? Direccion { get; set; }

    public bool Activo { get; set; } = true;

    public DateTime FechaCreacion { get; set; } = DateTime.UtcNow;

    // Navigation
    public ICollection<CompromisoProv> Compromisos { get; set; } = [];
    public ICollection<ProductoProveedor> ProductosProveedores { get; set; } = [];
    public ICollection<MovimientoStock> MovimientosStock { get; set; } = [];
    public ICollection<FormaPagoProveedor> FormasPago { get; set; } = [];
    public ICollection<Compra> Compras { get; set; } = [];
}
