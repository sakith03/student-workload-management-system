namespace StudentWorkload.API.Controllers;
 
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using StudentWorkload.Application.Modules.Users.Commands.LoginUser;
using StudentWorkload.Application.Modules.Users.Commands.RegisterUser;
using StudentWorkload.Application.Modules.Users.DTOs;
using StudentWorkload.Application.Common.Interfaces;
using StudentWorkload.Domain.Modules.Users.Repositories;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IUserRepository _userRepository;
    private readonly IJwtService _jwtService;
 
    public AuthController(IUserRepository userRepository, IJwtService jwtService)
    {
        _userRepository = userRepository;
        _jwtService = jwtService;
    }
 
    /// <summary>Register a new user</summary>
    [HttpPost("register")]
    [AllowAnonymous]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
 
        var handler = new RegisterUserCommandHandler(_userRepository);
        var command = new RegisterUserCommand(
            request.Email, request.Password,
            request.FirstName, request.LastName, request.Role);
 
        var result = await handler.HandleAsync(command);
 
        if (!result.IsSuccess)
            return Conflict(new { message = result.ErrorMessage });
 
        return CreatedAtAction(nameof(Register), new { id = result.UserId },
            new { userId = result.UserId, email = result.Email, message = "Registration successful." });
    }
 
    /// <summary>Login and receive JWT token</summary>
    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
 
        var handler = new LoginUserCommandHandler(_userRepository, _jwtService);
        var command = new LoginUserCommand(request.Email, request.Password);
 
        var result = await handler.HandleAsync(command);
 
        if (!result.IsSuccess)
            return Unauthorized(new { message = result.ErrorMessage });
 
        return Ok(new { token = result.Token, email = result.Email, role = result.Role });
    }
 
    /// <summary>Protected test endpoint</summary>
    [HttpGet("me")]
    [Authorize]
    public IActionResult GetCurrentUser()
    {
        var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        var email = User.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value;
        var role = User.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value;
        return Ok(new { userId, email, role });
    }
 
    /// <summary>Admin-only endpoint</summary>
    [HttpGet("admin-only")]
    [Authorize(Roles = "Admin")]
    public IActionResult AdminEndpoint() => Ok(new { message = "You are an Admin." });
}

