using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using StudentWorkload.Application.Modules.CourseModules.DTOs;
using StudentWorkload.Application.Modules.CourseModules.Services;
using System.Security.Claims;

namespace StudentWorkload.API.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class ModulesController : ControllerBase
{
    private readonly ICourseModuleService _courseModuleService;

    public ModulesController(ICourseModuleService courseModuleService)
    {
        _courseModuleService = courseModuleService;
    }

    private Guid GetUserId()
    {
        var idClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (Guid.TryParse(idClaim, out Guid id))
        {
            return id;
        }
        throw new UnauthorizedAccessException("User Id claim not found or Invalid.");
    }

    [HttpGet]
    public async Task<IActionResult> GetModules([FromQuery] Guid? moduleId, CancellationToken cancellationToken)
    {
        var userId = GetUserId();
        var modules = await _courseModuleService.GetModulesAsync(userId, moduleId, cancellationToken);
        return Ok(modules);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetModule(Guid id, CancellationToken cancellationToken)
    {
        var userId = GetUserId();
        var module = await _courseModuleService.GetModuleAsync(id, userId, cancellationToken);
        
        if (module == null)
            return NotFound();

        return Ok(module);
    }

    [HttpPost]
    public async Task<IActionResult> CreateModule([FromBody] CreateCourseModuleDto dto, CancellationToken cancellationToken)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var userId = GetUserId();
        var module = await _courseModuleService.CreateModuleAsync(userId, dto, cancellationToken);

        return CreatedAtAction(nameof(GetModule), new { id = module.Id }, module);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> UpdateModule(Guid id, [FromBody] UpdateCourseModuleDto dto, CancellationToken cancellationToken)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var userId = GetUserId();
        var success = await _courseModuleService.UpdateModuleAsync(id, userId, dto, cancellationToken);

        if (!success)
            return NotFound();

        return NoContent();
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteModule(Guid id, CancellationToken cancellationToken)
    {
        var userId = GetUserId();
        var success = await _courseModuleService.DeleteModuleAsync(id, userId, cancellationToken);

        if (!success)
            return NotFound();

        return NoContent();
    }
}
