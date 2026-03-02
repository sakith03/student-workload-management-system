// FILE PATH:
// backend/src/StudentWorkload.Domain/Modules/Groups/Entities/GroupInvitation.cs

namespace StudentWorkload.Domain.Modules.Groups.Entities;

public enum InvitationStatus { Pending = 1, Accepted = 2, Expired = 3 }

public class GroupInvitation
{
    public Guid Id { get; private set; }
    public Guid GroupId { get; private set; }
    public Guid InvitedByUserId { get; private set; }
    public string InvitedEmail { get; private set; } = string.Empty;
    public string Token { get; private set; } = string.Empty;       // UUID used in the invite link
    public InvitationStatus Status { get; private set; }
    public DateTime CreatedAt { get; private set; }
    public DateTime ExpiresAt { get; private set; }

    private GroupInvitation() { }

    public static GroupInvitation Create(Guid groupId, Guid invitedByUserId, string invitedEmail)
    {
        if (groupId == Guid.Empty)
            throw new ArgumentException("GroupId must be provided.");
        if (invitedByUserId == Guid.Empty)
            throw new ArgumentException("InvitedByUserId must be provided.");
        if (string.IsNullOrWhiteSpace(invitedEmail))
            throw new ArgumentException("Email is required.");

        return new GroupInvitation
        {
            Id = Guid.NewGuid(),
            GroupId = groupId,
            InvitedByUserId = invitedByUserId,
            InvitedEmail = invitedEmail.Trim().ToLowerInvariant(),
            Token = Guid.NewGuid().ToString("N"),   // 32-char hex token
            Status = InvitationStatus.Pending,
            CreatedAt = DateTime.UtcNow,
            ExpiresAt = DateTime.UtcNow.AddDays(7)
        };
    }

    public bool IsValid() => Status == InvitationStatus.Pending && ExpiresAt > DateTime.UtcNow;

    public void Accept() => Status = InvitationStatus.Accepted;
    public void Expire() => Status = InvitationStatus.Expired;
}