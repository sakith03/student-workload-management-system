namespace StudentWorkload.Domain.Modules.Groups.Repositories;

using StudentWorkload.Domain.Modules.Groups.Entities;

public interface IGroupSharedFileRepository
{
    Task<IEnumerable<GroupSharedFile>> GetByGroupIdAsync(Guid groupId, CancellationToken ct = default);
    Task<GroupSharedFile?> GetByIdAsync(Guid fileId, CancellationToken ct = default);
    Task AddAsync(GroupSharedFile file, CancellationToken ct = default);
    Task SaveChangesAsync(CancellationToken ct = default);
}
