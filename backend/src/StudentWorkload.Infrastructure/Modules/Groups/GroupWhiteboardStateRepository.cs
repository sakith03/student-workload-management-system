namespace StudentWorkload.Infrastructure.Modules.Groups;

using Microsoft.EntityFrameworkCore;
using StudentWorkload.Domain.Modules.Groups.Entities;
using StudentWorkload.Domain.Modules.Groups.Repositories;
using StudentWorkload.Infrastructure.Data;

public class GroupWhiteboardStateRepository : IGroupWhiteboardStateRepository
{
    private readonly AppDbContext _db;

    public GroupWhiteboardStateRepository(AppDbContext db) => _db = db;

    public async Task<GroupWhiteboardState?> GetByGroupIdAsync(Guid groupId, CancellationToken ct = default)
        => await _db.GroupWhiteboardStates.FirstOrDefaultAsync(s => s.GroupId == groupId, ct);

    public async Task AddAsync(GroupWhiteboardState state, CancellationToken ct = default)
        => await _db.GroupWhiteboardStates.AddAsync(state, ct);

    public async Task SaveChangesAsync(CancellationToken ct = default)
        => await _db.SaveChangesAsync(ct);
}
