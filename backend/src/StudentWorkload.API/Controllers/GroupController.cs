namespace StudentWorkload.API.Controllers;
 
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using StudentWorkload.Application.Modules.Groups.Commands.CreateGroup;
using StudentWorkload.Domain.Modules.Groups.Repositories;
 
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class GroupsController : ControllerBase
{
    private readonly IGroupRepository _groupRepo;
    public GroupsController(IGroupRepository groupRepo) => _groupRepo = groupRepo;
 
    private Guid GetUserId() =>
        Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
 
    // POST api/groups
    [HttpPost]
    public async Task<IActionResult> CreateGroup([FromBody] CreateGroupRequest request)
    {
        var handler = new CreateGroupCommandHandler(_groupRepo);
        var result = await handler.HandleAsync(new CreateGroupCommand(
            request.SubjectId, GetUserId(),
            request.Name, request.Description, request.MaxMembers));
 
        if (!result.IsSuccess) return BadRequest(new { message = result.Error });
 
        return CreatedAtAction(nameof(GetGroup), new { id = result.GroupId },
            new { groupId = result.GroupId, inviteCode = result.InviteCode });
    }
 
    // GET api/groups/{id}
    [HttpGet("{id}")]
    public async Task<IActionResult> GetGroup(Guid id)
    {
        var group = await _groupRepo.GetByIdAsync(id);
        if (group is null) return NotFound();
 
        // Only creator can view their group workspace for now
        if (group.CreatedByUserId != GetUserId()) return Forbid();
 
        return Ok(new {
            group.Id, group.Name, group.Description,
            group.SubjectId, group.MaxMembers,
            group.InviteCode,  // stored for teammate's join feature
            group.CreatedAt
        });
    }
 
    // GET api/groups/subject/{subjectId}
    [HttpGet("subject/{subjectId}")]
    public async Task<IActionResult> GetGroupsBySubject(Guid subjectId)
    {
        var groups = await _groupRepo.GetBySubjectIdAsync(subjectId);
        return Ok(groups.Select(g => new {
            g.Id, g.Name, g.Description, g.MaxMembers, g.CreatedAt
        }));
    }
 
    // GET api/groups/my
    [HttpGet("my")]
    public async Task<IActionResult> GetMyGroups()
    {
        var groups = await _groupRepo.GetByCreatedUserIdAsync(GetUserId());
        return Ok(groups.Select(g => new {
            g.Id, g.Name, g.SubjectId, g.CreatedAt
        }));
    }
}
 
public record CreateGroupRequest(
    Guid SubjectId, string Name, string Description, int MaxMembers = 6);
