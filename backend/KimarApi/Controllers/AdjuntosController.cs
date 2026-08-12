using System.Security.Claims;
using KimarApi.Models.DTOs;
using KimarApi.Models.Entities;
using KimarApi.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace KimarApi.Controllers;

[ApiController]
[Route("api/adjuntos")]
[Authorize(Roles = "admin,gestor")]
public class AdjuntosController(AdjuntoService adjuntoSvc) : ControllerBase
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

    private static AdjuntoDto Map(Adjunto a) => new(
        a.Id, a.EntidadTipo, a.EntidadId, a.Tipo, a.Nombre, a.ContentType, a.UsuarioId, a.FechaCreacion);
}
