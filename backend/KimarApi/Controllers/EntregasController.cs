using System.Security.Claims;
using KimarApi.Data;
using KimarApi.Models;
using KimarApi.Models.DTOs;
using KimarApi.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace KimarApi.Controllers;

// Módulo "Pedidos a entregar": lo que ve y hace el repartidor, más las acciones del depósito
// para marcar pedidos listos. Los roles van por método (en clase + método el [Authorize] es AND).
[ApiController]
[Route("api/entregas")]
[Authorize]
public class EntregasController(KimarDbContext db, EntregaService entregaSvc, AdjuntoService adjuntoSvc) : ControllerBase
{
    private Guid UserId => Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value!);
    private string? Rol => User.FindFirst("rol")?.Value;
    private bool EsGestion => Rol is Roles.Admin or Roles.Gestor;

    // Selector de repartidores para el depósito al marcar un pedido como listo.
    [HttpGet("repartidores")]
    [Authorize(Roles = Roles.GestionYDeposito)]
    public async Task<IActionResult> GetRepartidores()
    {
        var list = await db.Usuarios
            .Where(u => u.Rol == Roles.Repartidor && u.Activo)
            .OrderBy(u => u.Nombre)
            .Select(u => new RepartidorLiteDto(u.Id, u.Nombre))
            .ToListAsync();
        return Ok(list);
    }

    // Pedidos listos/entregados en el rango. El repartidor ve los suyos y los sin asignar; gestión ve todos.
    // Un pedido "listo" de una fecha anterior al rango sigue apareciendo hasta que se entregue,
    // para que no desaparezca de la vista del repartidor por haberse atrasado.
    [HttpGet]
    [Authorize(Roles = Roles.GestionYReparto)]
    public async Task<IActionResult> GetAll([FromQuery] DateOnly desde, [FromQuery] DateOnly hasta)
    {
        if (hasta < desde) return BadRequest(new { error = "El rango de fechas es inválido." });
        if (hasta.DayNumber - desde.DayNumber > 31) return BadRequest(new { error = "El rango máximo es de 31 días." });

        var query = db.Ventas
            .Include(v => v.Cliente).Include(v => v.Vendedor).Include(v => v.Repartidor)
            .Include(v => v.Items).ThenInclude(i => i.Producto)
            .Include(v => v.Items).ThenInclude(i => i.Calidad)
            .Where(v => v.EstadoEntrega != EstadosEntrega.Pendiente
                     && v.FechaEntrega <= hasta
                     && (v.FechaEntrega >= desde || v.EstadoEntrega == EstadosEntrega.Listo));

        if (!EsGestion)
        {
            var userId = UserId;
            query = query.Where(v => v.RepartidorId == userId || v.RepartidorId == null);
        }

        var ventas = await query
            .OrderBy(v => v.FechaEntrega).ThenBy(v => v.Cliente.Nombre)
            .ToListAsync();

        var ids = ventas.Select(v => v.Id).ToList();
        var documentos = (await db.Adjuntos
                .Include(a => a.Usuario)
                .Where(a => a.EntidadTipo == "Venta" && ids.Contains(a.EntidadId))
                .OrderByDescending(a => a.FechaCreacion)
                .ToListAsync())
            .ToLookup(a => a.EntidadId);

        return Ok(ventas.Select(v => new VentaEntregaDto(
            v.Id, v.FechaEntrega,
            v.Cliente?.Nombre ?? "", v.Cliente?.Calle, v.Cliente?.Altura, v.Cliente?.Localidad,
            v.Cliente?.Telefono1, v.Cliente?.Telefono2,
            v.Vendedor?.Nombre ?? "", v.NroRemito, v.Observaciones,
            v.EstadoEntrega, v.RepartidorId, v.Repartidor?.Nombre, v.FechaListo, v.FechaEntregado,
            v.Items.Select(i => new ItemPreparacionDto(
                i.ProductoId, i.Producto?.Nombre ?? i.Descripcion, i.Descripcion,
                i.CalidadId, i.Calidad?.Nombre, i.Cantidad, i.Producto?.Unidad ?? "kg")).ToList(),
            documentos[v.Id].Select(AdjuntosController.Map).ToList())));
    }

    [HttpPost("{ventaId}/listo")]
    [Authorize(Roles = Roles.GestionYDeposito)]
    public async Task<IActionResult> MarcarListo(Guid ventaId, [FromBody] MarcarListoRequest req)
        => DesdeResultado(await entregaSvc.MarcarListoAsync(ventaId, req.RepartidorId));

    [HttpPost("{ventaId}/volver-a-preparacion")]
    [Authorize(Roles = Roles.GestionYDeposito)]
    public async Task<IActionResult> VolverAPreparacion(Guid ventaId)
        => DesdeResultado(await entregaSvc.VolverAPreparacionAsync(ventaId));

    // Autoasignación del repartidor. Gestión asigna/reasigna vía "listo".
    [HttpPost("{ventaId}/tomar")]
    [Authorize(Roles = Roles.Repartidor)]
    public async Task<IActionResult> Tomar(Guid ventaId)
        => DesdeResultado(await entregaSvc.TomarAsync(ventaId, UserId));

    [HttpPost("{ventaId}/soltar")]
    [Authorize(Roles = Roles.GestionYReparto)]
    public async Task<IActionResult> Soltar(Guid ventaId)
        => DesdeResultado(await entregaSvc.SoltarAsync(ventaId, UserId, EsGestion));

    [HttpPost("{ventaId}/documentos")]
    [Authorize(Roles = Roles.GestionYReparto)]
    public async Task<IActionResult> AdjuntarDocumento(Guid ventaId, [FromBody] CreateDocumentoEntregaRequest req)
    {
        var (r, adjunto) = await entregaSvc.AdjuntarDocumentoAsync(ventaId, req, UserId, EsGestion);
        if (!r.Ok) return DesdeResultado(r);
        return CreatedAtAction(nameof(GetDocumento), new { ventaId, adjuntoId = adjunto!.Id }, AdjuntosController.Map(adjunto));
    }

    [HttpGet("{ventaId}/documentos/{adjuntoId}")]
    [Authorize(Roles = Roles.GestionYReparto)]
    public async Task<IActionResult> GetDocumento(Guid ventaId, Guid adjuntoId)
    {
        var permiso = await entregaSvc.PuedeVerDocumentoAsync(ventaId, adjuntoId, UserId, EsGestion);
        if (!permiso.Ok) return DesdeResultado(permiso);

        var resultado = await adjuntoSvc.LeerAsync(adjuntoId);
        if (resultado is null) return NotFound();
        var (adjunto, contenido) = resultado.Value;
        return Ok(new AdjuntoContenidoDto(adjunto.Id, adjunto.Nombre, adjunto.ContentType, Convert.ToBase64String(contenido)));
    }

    private IActionResult DesdeResultado(ResultadoEntrega r)
    {
        if (r.NotFound) return NotFound();
        if (r.Forbidden) return Forbid();
        if (!r.Ok) return BadRequest(new { error = r.Error });
        return NoContent();
    }
}
