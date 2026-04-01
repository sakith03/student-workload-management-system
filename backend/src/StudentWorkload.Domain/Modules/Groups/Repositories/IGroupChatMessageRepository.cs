namespace StudentWorkload.Domain.Modules.Groups.Repositories;

using StudentWorkload.Domain.Modules.Groups.Entities;

public interface IGroupChatMessageRepository
{
    Task<IEnumerable<GroupChatMessage>> GetByGroupIdAsync(Guid groupId, CancellationToken ct = default);
    Task AddAsync(GroupChatMessage message, CancellationToken ct = default);
    Task SaveChangesAsync(CancellationToken ct = default);
}
