namespace StudentWorkload.Application.Modules.CourseModules.Services;

using StudentWorkload.Application.Modules.CourseModules.DTOs;

public interface ICourseModuleService
{
    Task<IEnumerable<CourseModuleDto>> GetModulesAsync(Guid userId, Guid? subjectId = null, CancellationToken cancellationToken = default);
    Task<CourseModuleDto?> GetModuleAsync(Guid id, Guid userId, CancellationToken cancellationToken = default);
    Task<CourseModuleDto> CreateModuleAsync(Guid userId, CreateCourseModuleDto dto, CancellationToken cancellationToken = default);
    Task<bool> UpdateModuleAsync(Guid id, Guid userId, UpdateCourseModuleDto dto, CancellationToken cancellationToken = default);
    Task<bool> DeleteModuleAsync(Guid id, Guid userId, CancellationToken cancellationToken = default);
}
