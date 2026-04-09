namespace StudentWorkload.Domain.Modules.Groups.Repositories;

using StudentWorkload.Domain.Modules.Groups.Entities;

public interface IGroupWhiteboardStateRepository
{
    Task<GroupWhiteboardState?> GetByGroupIdAsync(Guid groupId, CancellationToken ct = default);
    Task AddAsync(GroupWhiteboardState state, CancellationToken ct = default);
    Task SaveChangesAsync(CancellationToken ct = default);
}
