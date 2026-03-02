// FILE PATH:
// backend/src/StudentWorkload.Application/Modules/Groups/Commands/AcceptInvitation/AcceptInvitationCommandHandler.cs

namespace StudentWorkload.Application.Modules.Groups.Commands.AcceptInvitation;

using StudentWorkload.Domain.Modules.Groups.Entities;
using StudentWorkload.Domain.Modules.Groups.Repositories;

public class AcceptInvitationCommandHandler
{
    private readonly IGroupInvitationRepository _invitationRepo;
    private readonly IGroupRepository _groupRepo;

    public AcceptInvitationCommandHandler(
        IGroupInvitationRepository invitationRepo,
        IGroupRepository groupRepo)
    {
        _invitationRepo = invitationRepo;
        _groupRepo = groupRepo;
    }

    public async Task<AcceptInvitationResult> HandleAsync(
        AcceptInvitationCommand cmd,
        CancellationToken ct = default)
    {
        // 1. Load invitation
        var invitation = await _invitationRepo.GetByTokenAsync(cmd.Token, ct);
        if (invitation is null)
            return new AcceptInvitationResult(false, Error: "Invitation not found.");

        if (!invitation.IsValid())
            return new AcceptInvitationResult(false, Error: "Invitation has expired or already been used.");

        // 2. Check if already a member
        var alreadyMember = await _groupRepo.IsUserMemberAsync(invitation.GroupId, cmd.UserId, ct);
        if (alreadyMember)
        {
            invitation.Accept();
            await _invitationRepo.SaveChangesAsync(ct);
            return new AcceptInvitationResult(true, invitation.GroupId);
        }

        // 3. Check max members
        var members = (await _groupRepo.GetMembersAsync(invitation.GroupId, ct)).ToList();
        var group = await _groupRepo.GetByIdAsync(invitation.GroupId, ct);
        if (group is null)
            return new AcceptInvitationResult(false, Error: "Group no longer exists.");

        if (members.Count >= group.MaxMembers)
            return new AcceptInvitationResult(false, Error: "This group is already full.");

        // 4. Add as member and mark invitation accepted
        var member = GroupMember.Create(invitation.GroupId, cmd.UserId, GroupRole.Member);
        await _groupRepo.AddMemberAsync(member, ct);
        invitation.Accept();

        await _groupRepo.SaveChangesAsync(ct);
        await _invitationRepo.SaveChangesAsync(ct);

        return new AcceptInvitationResult(true, invitation.GroupId);
    }
}