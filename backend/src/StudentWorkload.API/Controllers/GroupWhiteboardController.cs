namespace StudentWorkload.API.Controllers;

using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using StudentWorkload.Domain.Modules.Groups.Repositories;

[ApiController]
[Route("api/groups/{groupId}/whiteboard")]
[Authorize]
public class GroupWhiteboardController : ControllerBase
{
    private readonly IGroupRepository _groupRepo;
    private readonly IGroupWhiteboardStateRepository _whiteboardRepo;

    public GroupWhiteboardController(IGroupRepository groupRepo, IGroupWhiteboardStateRepository whiteboardRepo)
    {
        _groupRepo = groupRepo;
        _whiteboardRepo = whiteboardRepo;
    }

    private Guid GetUserId() => Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);

    private async Task<bool> CanAccessGroup(Guid groupId, Guid userId)
    {
        var group = await _groupRepo.GetByIdAsync(groupId);
        if (group is null || !group.IsActive) return false;
        if (group.CreatedByUserId == userId) return true;
        return await _groupRepo.IsUserMemberAsync(groupId, userId);
    }

    [HttpGet("state")]
    public async Task<IActionResult> GetState(Guid groupId)
    {
        if (!await CanAccessGroup(groupId, GetUserId()))
            return Forbid();

        var state = await _whiteboardRepo.GetByGroupIdAsync(groupId);
        return Ok(new
        {
            groupId,
            stateJson = state?.StateJson ?? "[]",
            updatedAt = state?.UpdatedAt
        });
    }
}
