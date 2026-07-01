using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace KimarApi.Models.Entities;

public class Vendedor
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required, MaxLength(100)]
    public string Nombre { get; set; } = string.Empty;

    public Guid? UsuarioId { get; set; }

    public bool Activo { get; set; } = true;

    // Navigation
    [ForeignKey(nameof(UsuarioId))]
    public Usuario? Usuario { get; set; }

    public ICollection<Cliente> Clientes { get; set; } = [];
    public ICollection<Pedido> Pedidos { get; set; } = [];
    public ICollection<Venta> Ventas { get; set; } = [];
}
