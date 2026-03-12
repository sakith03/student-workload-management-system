namespace StudentWorkload.Infrastructure.Modules.Groups;
 
using Microsoft.EntityFrameworkCore;
using StudentWorkload.Domain.Modules.Groups.Entities;
using StudentWorkload.Domain.Modules.Groups.Repositories;
using StudentWorkload.Infrastructure.Data;
 
public class GroupRepository : IGroupRepository
{
    private readonly AppDbContext _context;
    public GroupRepository(AppDbContext context) => _context = context;
 
    public async Task<Group?> GetByIdAsync(Guid id, CancellationToken ct = default)
        => await _context.Groups.FindAsync(new object[] { id }, ct);
 
    public async Task<IEnumerable<Group>> GetBySubjectIdAsync(Guid subjectId, CancellationToken ct = default)
        => await _context.Groups
            .Where(g => g.SubjectId == subjectId && g.IsActive)
            .ToListAsync(ct);
 
    public async Task<IEnumerable<Group>> GetByCreatedUserIdAsync(Guid userId, CancellationToken ct = default)
        => await _context.Groups
            .Where(g => g.CreatedByUserId == userId && g.IsActive)
            .ToListAsync(ct);

    public async Task<Group?> GetByInviteCodeAsync(string inviteCode, CancellationToken ct = default)
        => await _context.Groups
            .FirstOrDefaultAsync(g => g.InviteCode == inviteCode && g.IsActive, ct);

    public async Task<bool> IsUserMemberAsync(Guid groupId, Guid userId, CancellationToken ct = default)
        => await _context.GroupMembers
            .AnyAsync(gm => gm.GroupId == groupId && gm.UserId == userId, ct);

    public async Task<IEnumerable<GroupMember>> GetMembersAsync(Guid groupId, CancellationToken ct = default)
        => await _context.GroupMembers
            .Where(gm => gm.GroupId == groupId)
            .ToListAsync(ct);

    public async Task AddMemberAsync(GroupMember member, CancellationToken ct = default)
        => await _context.GroupMembers.AddAsync(member, ct);
 
    public async Task AddAsync(Group group, CancellationToken ct = default)
        => await _context.Groups.AddAsync(group, ct);
 
    public async Task SaveChangesAsync(CancellationToken ct = default)
        => await _context.SaveChangesAsync(ct);
}
