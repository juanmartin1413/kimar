using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace KimarApi.Models.Entities;

// Documento/foto genérico asociado a cualquier entidad del sistema (compras hoy, facturas de venta
// u otros comprobantes a futuro). El contenido vive en disco (ver AdjuntoService); esta fila solo
// guarda metadata + la ruta relativa dentro de la raíz de almacenamiento configurada.
public class Adjunto
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required, MaxLength(50)]
    public string EntidadTipo { get; set; } = string.Empty; // Compra | Venta | ...

    public Guid EntidadId { get; set; }

    [Required, MaxLength(20)]
    public string Tipo { get; set; } = "otro"; // remito | factura | otro

    [Required, MaxLength(200)]
    public string Nombre { get; set; } = string.Empty;

    [Required, MaxLength(100)]
    public string ContentType { get; set; } = string.Empty;

    [Required, MaxLength(300)]
    public string RutaArchivo { get; set; } = string.Empty;

    public Guid UsuarioId { get; set; }

    public DateTime FechaCreacion { get; set; } = DateTime.UtcNow;

    // Navigation
    [ForeignKey(nameof(UsuarioId))]
    public Usuario Usuario { get; set; } = null!;
}
