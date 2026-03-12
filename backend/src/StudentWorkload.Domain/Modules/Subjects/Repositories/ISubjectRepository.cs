namespace StudentWorkload.Domain.Modules.Subjects.Repositories;
using StudentWorkload.Domain.Modules.Subjects.Entities;
 
public interface ISubjectRepository
{
    Task<IEnumerable<Subject>> GetByUserIdAsync(Guid userId, CancellationToken ct = default);
    Task<Subject?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task AddAsync(Subject subject, CancellationToken ct = default);
    Task SaveChangesAsync(CancellationToken ct = default);
}
