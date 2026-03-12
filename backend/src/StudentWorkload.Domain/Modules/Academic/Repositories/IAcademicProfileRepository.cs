namespace StudentWorkload.Domain.Modules.Academic.Repositories;
using StudentWorkload.Domain.Modules.Academic.Entities;
 
public interface IAcademicProfileRepository
{
    Task<AcademicProfile?> GetByUserIdAsync(Guid userId, CancellationToken ct = default);
    Task AddAsync(AcademicProfile profile, CancellationToken ct = default);
    Task SaveChangesAsync(CancellationToken ct = default);
}
