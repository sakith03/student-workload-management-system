// FILE PATH:
// backend/src/StudentWorkload.Application/Modules/Groups/Commands/SendInvitation/SendInvitationCommandHandler.cs

namespace StudentWorkload.Application.Modules.Groups.Commands.SendInvitation;

using StudentWorkload.Application.Common.Interfaces;
using StudentWorkload.Domain.Modules.Groups.Entities;
using StudentWorkload.Domain.Modules.Groups.Repositories;
using StudentWorkload.Domain.Modules.Users.Repositories;

public class SendInvitationCommandHandler
{
    private readonly IGroupRepository _groupRepo;
    private readonly IGroupInvitationRepository _invitationRepo;
    private readonly IUserRepository _userRepo;
    private readonly IEmailService _emailService;
    private readonly string _frontendBaseUrl;

    public SendInvitationCommandHandler(
        IGroupRepository groupRepo,
        IGroupInvitationRepository invitationRepo,
        IUserRepository userRepo,
        IEmailService emailService,
        string frontendBaseUrl)
    {
        _groupRepo = groupRepo;
        _invitationRepo = invitationRepo;
        _userRepo = userRepo;
        _emailService = emailService;
        _frontendBaseUrl = frontendBaseUrl;
    }

    public async Task<SendInvitationResult> HandleAsync(
        SendInvitationCommand cmd,
        CancellationToken ct = default)
    {
        // 1. Validate group exists and inviter is a member/owner
        var group = await _groupRepo.GetByIdAsync(cmd.GroupId, ct);
        if (group is null)
            return new SendInvitationResult(false, "Group not found.");

        if (group.CreatedByUserId != cmd.InvitedByUserId)
        {
            var isMember = await _groupRepo.IsUserMemberAsync(cmd.GroupId, cmd.InvitedByUserId, ct);
            if (!isMember)
                return new SendInvitationResult(false, "You are not a member of this group.");
        }

        // 2. Validate email format
        if (!IsValidEmail(cmd.InvitedEmail))
            return new SendInvitationResult(false, "Invalid email address.");

        // 3. Check for existing pending invitation
        var alreadyInvited = await _invitationRepo.HasPendingInvitationAsync(
            cmd.GroupId, cmd.InvitedEmail, ct);
        if (alreadyInvited)
            return new SendInvitationResult(false, "An invitation has already been sent to this email.");

        // 4. Get inviter display name
        var inviter = await _userRepo.GetByIdAsync(cmd.InvitedByUserId);
        var inviterName = inviter is not null
            ? $"{inviter.FirstName} {inviter.LastName}"
            : "A group member";

        // 5. Create invitation record
        var invitation = GroupInvitation.Create(cmd.GroupId, cmd.InvitedByUserId, cmd.InvitedEmail);
        await _invitationRepo.AddAsync(invitation, ct);
        await _invitationRepo.SaveChangesAsync(ct);

        // 6. Send email
        var inviteLink = $"{_frontendBaseUrl}/invite/{invitation.Token}";
        await _emailService.SendInvitationEmailAsync(
            cmd.InvitedEmail,
            group.Name,
            inviterName,
            inviteLink,
            ct);

        return new SendInvitationResult(true);
    }

    private static bool IsValidEmail(string email)
    {
        try
        {
            var addr = new System.Net.Mail.MailAddress(email);
            return addr.Address == email.Trim().ToLowerInvariant();
        }
        catch { return false; }
    }
}