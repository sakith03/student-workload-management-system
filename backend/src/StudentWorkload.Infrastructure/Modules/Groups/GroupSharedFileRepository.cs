namespace StudentWorkload.Infrastructure.Modules.Groups;

using Microsoft.EntityFrameworkCore;
using StudentWorkload.Domain.Modules.Groups.Entities;
using StudentWorkload.Domain.Modules.Groups.Repositories;
using StudentWorkload.Infrastructure.Data;

public class GroupSharedFileRepository : IGroupSharedFileRepository
{
    private readonly AppDbContext _db;

    public GroupSharedFileRepository(AppDbContext db) => _db = db;

    public async Task<IEnumerable<GroupSharedFile>> GetByGroupIdAsync(Guid groupId, CancellationToken ct = default)
    {
        return await _db.GroupSharedFiles
            .Where(f => f.GroupId == groupId)
            .OrderByDescending(f => f.UploadedAt)
            .ToListAsync(ct);
    }

    public async Task<GroupSharedFile?> GetByIdAsync(Guid fileId, CancellationToken ct = default)
        => await _db.GroupSharedFiles.FirstOrDefaultAsync(f => f.Id == fileId, ct);

    public async Task AddAsync(GroupSharedFile file, CancellationToken ct = default)
        => await _db.GroupSharedFiles.AddAsync(file, ct);

    public async Task SaveChangesAsync(CancellationToken ct = default)
        => await _db.SaveChangesAsync(ct);
}
