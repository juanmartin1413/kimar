using KimarApi.Models.DTOs;
using KimarApi.Services;
using Microsoft.AspNetCore.Mvc;

namespace KimarApi.Controllers;

[ApiController]
[Route("auth")]
public class AuthController(AuthService authService) : ControllerBase
{
    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest req)
    {
        var result = await authService.LoginAsync(req.Email, req.Password);
        if (result is null)
            return Unauthorized(new { message = "Credenciales inválidas" });

        var (token, user) = result.Value;
        return Ok(new LoginResponse(token, user.Id, user.Nombre, user.Email, user.Rol));
    }
}
