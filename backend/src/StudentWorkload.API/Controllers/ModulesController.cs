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

    /// <summary>
    /// POST api/modules/manual
    /// Creates a goal from a manually entered step list.
    /// Steps are required (at least 1). Uses the same entity/service as AI-generated goals.
    /// </summary>
    [HttpPost("manual")]
    public async Task<IActionResult> CreateManualModule([FromBody] CreateCourseModuleDto dto, CancellationToken cancellationToken)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        if (dto.StepByStepGuidance == null || dto.StepByStepGuidance.Count == 0)
            return BadRequest(new { message = "At least one step is required for a manual goal." });

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

    /// <summary>
    /// PATCH api/modules/{id}/completions
    /// Lightweight endpoint — updates only the step completion booleans.
    /// Returns 409 Conflict if the goal's deadline has already passed.
    /// </summary>
    [HttpPatch("{id:guid}/completions")]
    public async Task<IActionResult> PatchCompletions(
        Guid id,
        [FromBody] PatchStepCompletionsDto dto,
        CancellationToken cancellationToken)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var userId = GetUserId();
        var (found, closed) = await _courseModuleService.PatchCompletionsAsync(
            id, userId, dto.Completions, cancellationToken);

        if (!found)   return NotFound();
        if (closed)   return Conflict(new { message = "Goal is closed — deadline has passed." });

        return NoContent();
    }

    /// <summary>
    /// PATCH api/modules/{id}/complete
    /// Officially marks the goal as completed and locks it permanently.
    /// Returns 409 Conflict if the goal is already completed or past its deadline.
    /// </summary>
    [HttpPatch("{id:guid}/complete")]
    public async Task<IActionResult> CompleteGoal(Guid id, CancellationToken cancellationToken)
    {
        var userId = GetUserId();
        var (found, alreadyDone) = await _courseModuleService.CompleteGoalAsync(
            id, userId, cancellationToken);

        if (!found)       return NotFound();
        if (alreadyDone)  return Conflict(new { message = "Goal is already completed or closed." });

        return NoContent();
    }
}
