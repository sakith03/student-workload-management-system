namespace StudentWorkload.Infrastructure.Modules.CourseModules;

using Microsoft.EntityFrameworkCore;
using StudentWorkload.Domain.Modules.CourseModules.Entities;
using StudentWorkload.Domain.Modules.CourseModules.Repositories;
using StudentWorkload.Infrastructure.Data;

public class CourseModuleRepository : ICourseModuleRepository
{
    private readonly AppDbContext _context;

    public CourseModuleRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<CourseModule>> GetByUserIdAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        return await _context.CourseModules
            .Where(m => m.UserId == userId)
            .ToListAsync(cancellationToken);
    }

    public async Task<CourseModule?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _context.CourseModules
            .FirstOrDefaultAsync(m => m.Id == id, cancellationToken);
    }

    public async Task AddAsync(CourseModule module, CancellationToken cancellationToken = default)
    {
        await _context.CourseModules.AddAsync(module, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task UpdateAsync(CourseModule module, CancellationToken cancellationToken = default)
    {
        _context.CourseModules.Update(module);
        await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task DeleteAsync(CourseModule module, CancellationToken cancellationToken = default)
    {
        _context.CourseModules.Remove(module);
        await _context.SaveChangesAsync(cancellationToken);
    }
}
