using System.Security.Claims;
using KimarApi.Models.DTOs;
using KimarApi.Models.Entities;
using KimarApi.Services;
using KimarApi.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace KimarApi.Controllers;

[ApiController]
[Route("api/adjuntos")]
[Authorize(Roles = "admin,gestor")]
public class AdjuntosController(AdjuntoService adjuntoSvc, KimarDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string entidadTipo, [FromQuery] Guid entidadId)
    {
        var list = await adjuntoSvc.ListarAsync(entidadTipo, entidadId);
        return Ok(list.Select(Map));
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var resultado = await adjuntoSvc.LeerAsync(id);
        if (resultado is null) return NotFound();
        var (adjunto, contenido) = resultado.Value;
        return Ok(new AdjuntoContenidoDto(adjunto.Id, adjunto.Nombre, adjunto.ContentType, Convert.ToBase64String(contenido)));
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateAdjuntoRequest req)
    {
        if (req.EntidadTipo is not ("Compra" or "Venta" or "PagoCliente") || req.EntidadTipo == "Venta" && req.Tipo != "remito_firmado")
            return BadRequest(new { error = "Los comprobantes fiscales de ventas se generan exclusivamente desde Facturación." });
        if (req.EntidadTipo == "PagoCliente") {
            if (req.Tipo != "comprobante_pago" || !await db.PagosCliente.AnyAsync(p => p.Id == req.EntidadId)) return BadRequest(new { error = "Pago inválido." });
            if (req.ContentType is not ("application/pdf" or "image/jpeg" or "image/png" or "image/webp")) return BadRequest(new { error = "Adjuntá PDF, JPG, PNG o WebP." });
            if (string.IsNullOrEmpty(req.ContenidoBase64) || req.ContenidoBase64.Length > 11200000) return BadRequest(new { error = "El comprobante debe tener hasta 8 MB." });
            try { if (Convert.FromBase64String(req.ContenidoBase64).Length > 8 * 1024 * 1024) return BadRequest(new { error = "El comprobante supera 8 MB." }); }
            catch (FormatException) { return BadRequest(new { error = "Archivo inválido." }); }
        }
        var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value!);
        var adjunto = await adjuntoSvc.GuardarAsync(
            req.EntidadTipo, req.EntidadId, req.Tipo, req.Nombre, req.ContentType, req.ContenidoBase64, userId);
        return CreatedAtAction(nameof(GetById), new { id = adjunto.Id }, Map(adjunto));
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var eliminado = await adjuntoSvc.EliminarAsync(id);
        if (!eliminado) return NotFound();
        return NoContent();
    }

    public static AdjuntoDto Map(Adjunto a) => new(
        a.Id, a.EntidadTipo, a.EntidadId, a.Tipo, a.Nombre, a.ContentType, a.UsuarioId, a.Usuario?.Nombre ?? "", a.FechaCreacion);
}
