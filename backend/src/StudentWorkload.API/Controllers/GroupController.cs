namespace StudentWorkload.API.Controllers;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using StudentWorkload.Application.Modules.Groups.Commands.CreateGroup;
using StudentWorkload.Domain.Modules.Groups.Repositories;
using StudentWorkload.Domain.Modules.Users.Repositories; // ✅ NEW import
 
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class GroupsController : ControllerBase
{
    private readonly IGroupRepository _groupRepo;
    private readonly IUserRepository _userRepo;                           // ✅ NEW
    private readonly IGroupInvitationRepository _invitationRepo;         // ✅ NEW

    // ✅ CHANGE: constructor now accepts 3 dependencies instead of 1
    // DI container in Program.cs already registers all three — no Program.cs changes needed
    public GroupsController(
        IGroupRepository groupRepo,
        IUserRepository userRepo,                                          // ✅ NEW
        IGroupInvitationRepository invitationRepo)                        // ✅ NEW
    {
        _groupRepo = groupRepo;
        _userRepo = userRepo;
        _invitationRepo = invitationRepo;
    }

    private Guid GetUserId() =>
        Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);

    // ─── POST api/groups ─────────────────────────────────────── (UNCHANGED)
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

    // ─── GET api/groups/{id} ─────────────────────────────────── (UNCHANGED)
    [HttpGet("{id}")]
    public async Task<IActionResult> GetGroup(Guid id)
    {
        var group = await _groupRepo.GetByIdAsync(id);
        if (group is null || !group.IsActive) return NotFound();

        var userId = GetUserId();
        var isCreator = group.CreatedByUserId == userId;
        var isMember = !isCreator && await _groupRepo.IsUserMemberAsync(id, userId);

        if (!isCreator && !isMember)
            return Forbid();

        return Ok(new {
            group.Id,
            group.Name,
            group.Description,
            group.SubjectId,
            group.MaxMembers,
            group.InviteCode,
            group.CreatedAt,
            group.CreatedByUserId
        });
    }

    // ─── GET api/groups/subject/{subjectId} ──────────────────── (UNCHANGED)
    [HttpGet("subject/{subjectId}")]
    public async Task<IActionResult> GetGroupsBySubject(Guid subjectId)
    {
        var groups = await _groupRepo.GetBySubjectIdAsync(subjectId);
        return Ok(groups.Select(g => new {
            g.Id, g.Name, g.Description, g.MaxMembers, g.CreatedAt
        }));
    }

    // ─── GET api/groups/my ───────────────────────────────────── (UNCHANGED)
    [HttpGet("my")]
    public async Task<IActionResult> GetMyGroups()
    {
        var userId = GetUserId();
        var createdGroups = await _groupRepo.GetByCreatedUserIdAsync(userId);
        var joinedGroups = await _groupRepo.GetByMemberUserIdAsync(userId);
        var allGroups = createdGroups.UnionBy(joinedGroups, g => g.Id).ToList();

        return Ok(allGroups.Select(g => new {
            g.Id, g.Name, g.SubjectId, g.CreatedAt,
            isCreator = g.CreatedByUserId == userId
        }));
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateGroup(Guid id, [FromBody] UpdateGroupRequest request)
    {
        var group = await _groupRepo.GetByIdAsync(id);
        if (group is null || !group.IsActive)
            return NotFound(new { message = "Workspace not found." });

        var userId = GetUserId();
        if (group.CreatedByUserId != userId)
            return Forbid();

        if (request.SubjectId != group.SubjectId)
        {
            var myGroups = await _groupRepo.GetByCreatedUserIdAsync(userId);
            if (myGroups.Any(g => g.Id != id && g.SubjectId == request.SubjectId))
                return BadRequest(new { message = "You already have a workspace for that subject." });
        }

        var memberCount = (await _groupRepo.GetMembersAsync(id)).Count();
        if (request.MaxMembers < memberCount)
            return BadRequest(new { message = $"Max members cannot be less than the current team size ({memberCount})." });

        try
        {
            group.UpdateDetails(request.Name, request.Description, request.MaxMembers);
            if (request.SubjectId != group.SubjectId)
                group.ChangeSubject(request.SubjectId);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }

        await _groupRepo.SaveChangesAsync();

        return Ok(new {
            group.Id,
            group.Name,
            group.Description,
            group.SubjectId,
            group.MaxMembers,
            group.InviteCode,
            group.CreatedAt,
            group.CreatedByUserId
        });
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteGroup(Guid id)
    {
        var group = await _groupRepo.GetByIdAsync(id);
        if (group is null || !group.IsActive)
            return NotFound(new { message = "Workspace not found." });

        if (group.CreatedByUserId != GetUserId())
            return Forbid();

        group.Deactivate();
        await _groupRepo.SaveChangesAsync();
        return NoContent();
    }

    // ─── GET api/groups/{groupId}/members ────────────────────── ✅ NEW
    // Returns the full list of users currently in the group with their role and join date.
    // Only accessible by the group creator or an existing member.
    [HttpGet("{groupId}/members")]
    public async Task<IActionResult> GetGroupMembers(Guid groupId)
    {
        // 1. Verify the group exists
        var group = await _groupRepo.GetByIdAsync(groupId);
        if (group is null) return NotFound(new { message = "Group not found." });

        // 2. Verify the requester belongs to this group (security check)
        var requesterId = GetUserId();
        var isCreator = group.CreatedByUserId == requesterId;
        var isMember = !isCreator && await _groupRepo.IsUserMemberAsync(groupId, requesterId);

        if (!isCreator && !isMember)
            return Forbid();

        // 3. Load the GroupMember join records
        var members = await _groupRepo.GetMembersAsync(groupId);

        // 4. For each member, enrich with user details from the Users table
        // We fetch each user individually — fine for small groups (max 10 members)
        var result = new List<object>();
        foreach (var member in members)
        {
            var user = await _userRepo.GetByIdAsync(member.UserId);
            if (user is null) continue; // defensive: skip orphaned member records

            result.Add(new
            {
                userId       = user.Id,
                firstName    = user.FirstName,
                lastName     = user.LastName,
                email        = user.Email.Value,  // Email is a Value Object — use .Value
                role         = user.Role.ToString(),
                groupRole    = member.Role.ToString(),  // "Owner" or "Member"
                joinedAt     = member.JoinedAt,
                isOwner      = member.IsOwner
            });
        }

        // 5. Sort: Owner first, then Members alphabetically by last name
        var sorted = result
            .OrderBy(m => ((dynamic)m).isOwner ? 0 : 1)
            .ThenBy(m => ((dynamic)m).lastName)
            .ToList();

        return Ok(new
        {
            groupId      = group.Id,
            groupName    = group.Name,
            totalMembers = sorted.Count,
            maxMembers   = group.MaxMembers,
            members      = sorted
        });
    }

    // ─── GET api/groups/{groupId}/pending-invitations ────────── ✅ NEW
    // Returns all invitations sent for this group that haven't been accepted yet.
    // Only the group owner (creator) can see pending invitations — members cannot.
    [HttpGet("{groupId}/pending-invitations")]
    public async Task<IActionResult> GetPendingInvitations(Guid groupId)
    {
        // 1. Verify group exists
        var group = await _groupRepo.GetByIdAsync(groupId);
        if (group is null) return NotFound(new { message = "Group not found." });

        // 2. Only the group creator can see who has been invited but not yet joined
        // This prevents members from knowing who else was invited
        var requesterId = GetUserId();
        if (group.CreatedByUserId != requesterId)
            return Forbid();

        // 3. Fetch pending invitations
        var pendingInvitations = await _invitationRepo.GetPendingByGroupIdAsync(groupId);

        // 4. Try to enrich with the inviter's name (who sent each invite)
        var result = new List<object>();
        foreach (var invite in pendingInvitations)
        {
            var invitedBy = await _userRepo.GetByIdAsync(invite.InvitedByUserId);

            result.Add(new
            {
                invitationId  = invite.Id,
                invitedEmail  = invite.InvitedEmail,
                invitedByName = invitedBy is not null
                                    ? $"{invitedBy.FirstName} {invitedBy.LastName}"
                                    : "Unknown",
                sentAt        = invite.CreatedAt,
                expiresAt     = invite.ExpiresAt,
                daysUntilExpiry = (int)Math.Max(0, (invite.ExpiresAt - DateTime.UtcNow).TotalDays)
            });
        }

        return Ok(new
        {
            groupId            = group.Id,
            groupName          = group.Name,
            pendingCount       = result.Count,
            pendingInvitations = result
        });
    }
}

public record CreateGroupRequest(
    Guid SubjectId, string Name, string Description, int MaxMembers = 6);

public record UpdateGroupRequest(
    string Name, string Description, int MaxMembers, Guid SubjectId);