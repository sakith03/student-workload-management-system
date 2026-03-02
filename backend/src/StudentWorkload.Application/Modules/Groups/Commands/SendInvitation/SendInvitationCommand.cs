// FILE PATH:
// backend/src/StudentWorkload.Application/Modules/Groups/Commands/SendInvitation/SendInvitationCommand.cs

namespace StudentWorkload.Application.Modules.Groups.Commands.SendInvitation;

public record SendInvitationCommand(Guid GroupId, Guid InvitedByUserId, string InvitedEmail);

public record SendInvitationResult(bool IsSuccess, string? Error = null);