// FILE PATH:
// backend/src/StudentWorkload.Application/Modules/Groups/Commands/AcceptInvitation/AcceptInvitationCommand.cs

namespace StudentWorkload.Application.Modules.Groups.Commands.AcceptInvitation;

public record AcceptInvitationCommand(string Token, Guid UserId);

public record AcceptInvitationResult(
    bool IsSuccess,
    Guid? GroupId = null,
    string? Error = null);