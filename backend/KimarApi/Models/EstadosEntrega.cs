namespace KimarApi.Models;

// Ciclo de entrega de una Venta, independiente del estado de cobro (Venta.Estado).
// pendiente: el depósito todavía la está preparando.
// listo:     preparada, esperando que un repartidor la retire (con o sin repartidor asignado).
// entregado: el repartidor subió el remito firmado. Estado final: no se revierte.
public static class EstadosEntrega
{
    public const string Pendiente = "pendiente";
    public const string Listo = "listo";
    public const string Entregado = "entregado";
}
