namespace StudentWorkload.Infrastructure.Modules.Academic;
 
using Microsoft.EntityFrameworkCore;
using StudentWorkload.Domain.Modules.Academic.Entities;
using StudentWorkload.Domain.Modules.Academic.Repositories;
using StudentWorkload.Infrastructure.Data;
 
public class AcademicProfileRepository : IAcademicProfileRepository
{
    private readonly AppDbContext _context;
    public AcademicProfileRepository(AppDbContext context) => _context = context;
 
    public async Task<AcademicProfile?> GetByUserIdAsync(Guid userId, CancellationToken ct = default)
        => await _context.AcademicProfiles.FirstOrDefaultAsync(a => a.UserId == userId, ct);
 
    public async Task AddAsync(AcademicProfile profile, CancellationToken ct = default)
        => await _context.AcademicProfiles.AddAsync(profile, ct);
 
    public async Task SaveChangesAsync(CancellationToken ct = default)
        => await _context.SaveChangesAsync(ct);
}
