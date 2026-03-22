// FILE PATH:
// backend/src/StudentWorkload.API/Controllers/GroupController.cs

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
 
    // ─── POST api/groups ────────────────────────────────────────────────
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
 
    // ─── GET api/groups/{id} ────────────────────────────────────────────
    // CHANGED: Previously this returned 403 for anyone who wasn't the creator.
    // Now both the creator AND invited members can view the group detail page.
    [HttpGet("{id}")]
    public async Task<IActionResult> GetGroup(Guid id)
    {
        var group = await _groupRepo.GetByIdAsync(id);
        if (group is null) return NotFound();

        var userId = GetUserId();

        // Allow the creator OR any group member to access
        var isCreator = group.CreatedByUserId == userId;
        var isMember  = !isCreator && await _groupRepo.IsUserMemberAsync(id, userId);

        if (!isCreator && !isMember)
            return Forbid();
 
        return Ok(new {
            group.Id,
            group.Name,
            group.Description,
            group.SubjectId,
            group.MaxMembers,
            group.InviteCode,
            group.CreatedAt
        });
    }
 
    // ─── GET api/groups/subject/{subjectId} ─────────────────────────────
    [HttpGet("subject/{subjectId}")]
    public async Task<IActionResult> GetGroupsBySubject(Guid subjectId)
    {
        var groups = await _groupRepo.GetBySubjectIdAsync(subjectId);
        return Ok(groups.Select(g => new {
            g.Id, g.Name, g.Description, g.MaxMembers, g.CreatedAt
        }));
    }
 
    // ─── GET api/groups/my ──────────────────────────────────────────────
    // CHANGED: Previously this only returned groups the user created.
    // Now it returns groups they created PLUS groups they joined via invitation.
    // We deduplicate using UnionBy in case of overlap (shouldn't happen, but
    // defensive programming is good practice).
    [HttpGet("my")]
    public async Task<IActionResult> GetMyGroups()
    {
        var userId = GetUserId();

        // Groups this user created
        var createdGroups = await _groupRepo.GetByCreatedUserIdAsync(userId);

        // Groups this user joined as a member (via invitation)
        var joinedGroups = await _groupRepo.GetByMemberUserIdAsync(userId);

        // Combine and deduplicate by group ID
        var allGroups = createdGroups
            .UnionBy(joinedGroups, g => g.Id)
            .ToList();

        return Ok(allGroups.Select(g => new {
            g.Id, g.Name, g.SubjectId, g.CreatedAt
        }));
    }
}
 
public record CreateGroupRequest(
    Guid SubjectId, string Name, string Description, int MaxMembers = 6);