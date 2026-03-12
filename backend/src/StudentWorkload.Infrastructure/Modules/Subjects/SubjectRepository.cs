namespace StudentWorkload.Infrastructure.Modules.Subjects;
 
using Microsoft.EntityFrameworkCore;
using StudentWorkload.Domain.Modules.Subjects.Entities;
using StudentWorkload.Domain.Modules.Subjects.Repositories;
using StudentWorkload.Infrastructure.Data;
 
public class SubjectRepository : ISubjectRepository
{
    private readonly AppDbContext _context;
    public SubjectRepository(AppDbContext context) => _context = context;
 
    public async Task<IEnumerable<Subject>> GetByUserIdAsync(Guid userId, CancellationToken ct = default)
        => await _context.Subjects
            .Where(s => s.UserId == userId && s.IsActive)
            .OrderBy(s => s.Code)
            .ToListAsync(ct);
 
    public async Task<Subject?> GetByIdAsync(Guid id, CancellationToken ct = default)
        => await _context.Subjects.FindAsync(new object[] { id }, ct);
 
    public async Task AddAsync(Subject subject, CancellationToken ct = default)
        => await _context.Subjects.AddAsync(subject, ct);
 
    public async Task SaveChangesAsync(CancellationToken ct = default)
        => await _context.SaveChangesAsync(ct);
}
