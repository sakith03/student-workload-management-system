// FILE PATH:
// backend/src/StudentWorkload.Application/Common/Interfaces/IEmailService.cs

namespace StudentWorkload.Application.Common.Interfaces;

public interface IEmailService
{
    Task SendInvitationEmailAsync(
        string toEmail,
        string groupName,
        string inviterName,
        string inviteLink,
        CancellationToken ct = default);
}