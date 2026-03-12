namespace StudentWorkload.Domain.Modules.Groups.Repositories;
using StudentWorkload.Domain.Modules.Groups.Entities;
 
public interface IGroupRepository
{
    Task<Group?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<Group?> GetByInviteCodeAsync(string inviteCode, CancellationToken ct = default);
    Task<IEnumerable<Group>> GetBySubjectIdAsync(Guid subjectId, CancellationToken ct = default);
    Task<IEnumerable<Group>> GetByCreatedUserIdAsync(Guid userId, CancellationToken ct = default);
    Task<bool> IsUserMemberAsync(Guid groupId, Guid userId, CancellationToken ct = default);
    Task AddAsync(Group group, CancellationToken ct = default);
    Task AddMemberAsync(GroupMember member, CancellationToken ct = default);
    Task<IEnumerable<GroupMember>> GetMembersAsync(Guid groupId, CancellationToken ct = default);
    Task SaveChangesAsync(CancellationToken ct = default);
}
