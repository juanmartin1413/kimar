using System.Security.Claims;
using KimarApi.Data;
using KimarApi.Models;
using KimarApi.Models.Entities;
using KimarApi.Services;
using KimarApi.Services.Facturacion;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace KimarApi.Controllers;

[ApiController, Route("api/ventas"), Authorize(Roles = Roles.Comercial)]
public class VentaDocumentosController(KimarDbContext db, FiscalConfig config) : ControllerBase
{
    private IQueryable<Venta> VentasPermitidas()
    {
        var query = db.Ventas.AsNoTracking();
        if (User.FindFirst("rol")?.Value == Roles.Vendedor)
        {
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            query = query.Where(v => v.Vendedor.UsuarioId == userId);
        }
        return query;
    }

    [HttpGet("{id:guid}/remito/pdf")]
    public async Task<IActionResult> Remito(Guid id)
    {
        var venta = await VentasPermitidas().Include(v => v.Cliente).Include(v => v.Vendedor)
            .Include(v => v.Items).FirstOrDefaultAsync(v => v.Id == id);
        if (venta is null) return NotFound();
        if (string.IsNullOrWhiteSpace(venta.NroRemito))
            return Conflict(new { error = "La venta todavía no tiene número de remito." });
        Response.Headers.CacheControl = "private, no-store";
        return File(RemitoPdf.Render(venta), "application/pdf", $"Remito-{venta.NroRemito}.pdf");
    }

    [HttpGet("{id:guid}/factura/pdf")]
    public async Task<IActionResult> Factura(Guid id)
    {
        var venta = await VentasPermitidas().Include(v => v.Comprobantes).FirstOrDefaultAsync(v => v.Id == id);
        if (venta is null) return NotFound();
        // El número mostrado en la venta identifica su factura vigente, nunca una nota de crédito.
        var factura = venta.Comprobantes.Where(c => c.Tipo == 1 && c.Estado == "autorizado")
            .FirstOrDefault(c => $"{c.PuntoVenta:D5}-{c.Numero:D8}" == venta.NroFactura);
        if (factura is null) return Conflict(new { error = "La venta todavía no tiene una factura emitida disponible para descargar." });
        if (factura.RutaPdf is null || !System.IO.File.Exists(Path.Combine(config.StorageRoot, factura.RutaPdf)))
            return Conflict(new { error = "El PDF todavía no está disponible. Podés regenerarlo desde Facturación." });
        var bytes = await System.IO.File.ReadAllBytesAsync(Path.Combine(config.StorageRoot, factura.RutaPdf), HttpContext.RequestAborted);
        Response.Headers.CacheControl = "private, no-store";
        return File(bytes, "application/pdf", $"FC-A-{venta.NroFactura}.pdf");
    }
}
