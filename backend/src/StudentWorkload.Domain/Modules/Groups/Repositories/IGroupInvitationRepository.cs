// FILE PATH:
// backend/src/StudentWorkload.Domain/Modules/Groups/Repositories/IGroupInvitationRepository.cs

namespace StudentWorkload.Domain.Modules.Groups.Repositories;

using StudentWorkload.Domain.Modules.Groups.Entities;

public interface IGroupInvitationRepository
{
    Task<GroupInvitation?> GetByTokenAsync(string token, CancellationToken ct = default);
    Task<bool> HasPendingInvitationAsync(Guid groupId, string email, CancellationToken ct = default);
    Task AddAsync(GroupInvitation invitation, CancellationToken ct = default);
    Task SaveChangesAsync(CancellationToken ct = default);
}