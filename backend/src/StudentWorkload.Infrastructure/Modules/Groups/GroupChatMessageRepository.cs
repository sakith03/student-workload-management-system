namespace StudentWorkload.Infrastructure.Modules.Groups;

using Microsoft.EntityFrameworkCore;
using StudentWorkload.Domain.Modules.Groups.Entities;
using StudentWorkload.Domain.Modules.Groups.Repositories;
using StudentWorkload.Infrastructure.Data;

public class GroupChatMessageRepository : IGroupChatMessageRepository
{
    private readonly AppDbContext _db;

    public GroupChatMessageRepository(AppDbContext db) => _db = db;

    public async Task<IEnumerable<GroupChatMessage>> GetByGroupIdAsync(Guid groupId, CancellationToken ct = default)
    {
        return await _db.GroupChatMessages
            .Where(m => m.GroupId == groupId)
            .OrderBy(m => m.SentAt)
            .ToListAsync(ct);
    }

    public async Task AddAsync(GroupChatMessage message, CancellationToken ct = default)
    {
        await _db.GroupChatMessages.AddAsync(message, ct);
    }

    public async Task SaveChangesAsync(CancellationToken ct = default)
    {
        await _db.SaveChangesAsync(ct);
    }
}
