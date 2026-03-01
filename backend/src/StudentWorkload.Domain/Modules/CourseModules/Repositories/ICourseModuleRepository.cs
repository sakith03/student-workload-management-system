namespace StudentWorkload.Domain.Modules.CourseModules.Repositories;

using StudentWorkload.Domain.Modules.CourseModules.Entities;

public interface ICourseModuleRepository
{
    Task<IEnumerable<CourseModule>> GetByUserIdAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<CourseModule?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task AddAsync(CourseModule module, CancellationToken cancellationToken = default);
    Task UpdateAsync(CourseModule module, CancellationToken cancellationToken = default);
    Task DeleteAsync(CourseModule module, CancellationToken cancellationToken = default);
}
