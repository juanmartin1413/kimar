using KimarApi.Data;
using KimarApi.Models.DTOs;
using KimarApi.Models.Entities;
using KimarApi.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace KimarApi.Controllers;

[ApiController]
[Route("api/usuarios")]
[Authorize(Roles = "admin")]
public class UsuariosController(KimarDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var list = await db.Usuarios
            .Select(u => new UsuarioDto(u.Id, u.Nombre, u.Email, u.Rol, u.Activo, u.FechaCreacion))
            .ToListAsync();
        return Ok(list);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var u = await db.Usuarios.FindAsync(id);
        if (u is null) return NotFound();
        return Ok(new UsuarioDto(u.Id, u.Nombre, u.Email, u.Rol, u.Activo, u.FechaCreacion));
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateUsuarioRequest req)
    {
        if (await db.Usuarios.AnyAsync(u => u.Email == req.Email.ToLower()))
            return Conflict(new { message = "Email ya registrado" });

        var user = new Usuario
        {
            Nombre = req.Nombre,
            Email = req.Email.ToLower(),
            PasswordHash = AuthService.HashPassword(req.Password),
            Rol = req.Rol
        };
        db.Usuarios.Add(user);
        await db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = user.Id },
            new UsuarioDto(user.Id, user.Nombre, user.Email, user.Rol, user.Activo, user.FechaCreacion));
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateUsuarioRequest req)
    {
        var user = await db.Usuarios.FindAsync(id);
        if (user is null) return NotFound();

        if (req.Nombre is not null) user.Nombre = req.Nombre;
        if (req.Email is not null) user.Email = req.Email.ToLower();
        if (req.Password is not null) user.PasswordHash = AuthService.HashPassword(req.Password);
        if (req.Rol is not null) user.Rol = req.Rol;
        if (req.Activo.HasValue) user.Activo = req.Activo.Value;

        await db.SaveChangesAsync();
        return Ok(new UsuarioDto(user.Id, user.Nombre, user.Email, user.Rol, user.Activo, user.FechaCreacion));
    }
}
