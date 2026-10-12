namespace KimarApi.Models;

// Cómo sale un pedido listo para entrega. Se persiste en Venta.MedioEnvio (MaxLength 20).
// reparto: lo lleva un repartidor propio (asignado o sin asignar); cierra al subir el remito firmado.
// uber / remis: envío externo. No lo ve ni lo toma ningún repartidor; depósito/gestión lo marcan
//               entregado a mano (con foto del remito firmado opcional).
public static class MediosEnvio
{
    public const string Reparto = "reparto";
    public const string Uber = "uber";
    public const string Remis = "remis";

    public static readonly string[] Todos = [Reparto, Uber, Remis];

    public static bool EsValido(string? medio) => medio is not null && Todos.Contains(medio);

    public static bool EsExterno(string medio) => medio is Uber or Remis;
}
