// FILE PATH:
// backend/src/StudentWorkload.Infrastructure/Modules/Groups/GroupInvitationRepository.cs

namespace StudentWorkload.Infrastructure.Modules.Groups;

using Microsoft.EntityFrameworkCore;
using StudentWorkload.Domain.Modules.Groups.Entities;
using StudentWorkload.Domain.Modules.Groups.Repositories;
using StudentWorkload.Infrastructure.Data;

public class GroupInvitationRepository : IGroupInvitationRepository
{
    private readonly AppDbContext _context;
    public GroupInvitationRepository(AppDbContext context) => _context = context;

    public async Task<GroupInvitation?> GetByTokenAsync(string token, CancellationToken ct = default)
        => await _context.GroupInvitations
            .FirstOrDefaultAsync(i => i.Token == token, ct);

    public async Task<bool> HasPendingInvitationAsync(Guid groupId, string email, CancellationToken ct = default)
        => await _context.GroupInvitations
            .AnyAsync(i =>
                i.GroupId == groupId &&
                i.InvitedEmail == email.ToLowerInvariant() &&
                i.Status == InvitationStatus.Pending &&
                i.ExpiresAt > DateTime.UtcNow, ct);

    public async Task AddAsync(GroupInvitation invitation, CancellationToken ct = default)
        => await _context.GroupInvitations.AddAsync(invitation, ct);

    public async Task SaveChangesAsync(CancellationToken ct = default)
        => await _context.SaveChangesAsync(ct);

    // fetches all invitations for a group that are still pending and not expired
    public async Task<IEnumerable<GroupInvitation>> GetPendingByGroupIdAsync(
        Guid groupId,
        CancellationToken ct = default)
        => await _context.GroupInvitations
            .Where(i =>
                i.GroupId == groupId &&
                i.Status == InvitationStatus.Pending &&
                i.ExpiresAt > DateTime.UtcNow)
            .OrderByDescending(i => i.CreatedAt) // most recent invite first
            .ToListAsync(ct);
}