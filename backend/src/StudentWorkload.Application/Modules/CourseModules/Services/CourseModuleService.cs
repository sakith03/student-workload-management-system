namespace StudentWorkload.Application.Modules.CourseModules.Services;

using StudentWorkload.Application.Modules.CourseModules.DTOs;
using StudentWorkload.Domain.Modules.CourseModules.Entities;
using StudentWorkload.Domain.Modules.CourseModules.Repositories;

public class CourseModuleService : ICourseModuleService
{
    private readonly ICourseModuleRepository _repository;

    public CourseModuleService(ICourseModuleRepository repository)
    {
        _repository = repository;
    }

    public async Task<IEnumerable<CourseModuleDto>> GetModulesAsync(Guid userId, Guid? subjectId = null, CancellationToken cancellationToken = default)
    {
        var modules = await _repository.GetByUserIdAsync(userId, cancellationToken);

        if (subjectId.HasValue)
        {
            modules = modules.Where(m => m.SubjectId == subjectId.Value);
        }
        
        return modules.Select(MapToDto).OrderByDescending(m => m.CreatedAt);
    }

    public async Task<CourseModuleDto?> GetModuleAsync(Guid id, Guid userId, CancellationToken cancellationToken = default)
    {
        var module = await _repository.GetByIdAsync(id, cancellationToken);
        
        if (module == null || module.UserId != userId)
        {
            return null;
        }

        return MapToDto(module);
    }

    public async Task<CourseModuleDto> CreateModuleAsync(Guid userId, CreateCourseModuleDto dto, CancellationToken cancellationToken = default)
    {
        var module = CourseModule.Create(
            userId: userId,
            name: dto.Name,
            semester: dto.Semester,
            targetHoursPerWeek: dto.TargetHoursPerWeek,
            description: dto.Description,
            colorTag: dto.ColorTag,
            subjectId: dto.SubjectId
        );

        await _repository.AddAsync(module, cancellationToken);

        return MapToDto(module);
    }

    public async Task<bool> UpdateModuleAsync(Guid id, Guid userId, UpdateCourseModuleDto dto, CancellationToken cancellationToken = default)
    {
        var module = await _repository.GetByIdAsync(id, cancellationToken);
        
        if (module == null || module.UserId != userId)
        {
            return false;
        }

        module.Update(
            name: dto.Name,
            semester: dto.Semester,
            targetHoursPerWeek: dto.TargetHoursPerWeek,
            description: dto.Description,
            colorTag: dto.ColorTag
        );
        // SubjectId is private set, normally we might want to update it.
        // For now, let's assume we don't change subject after creation, or add a setter.
        // Actually, many CourseModule properties are private set except one. 
        // Let's add a property setter in the entity if needed, but for now let's just make it consistent.

        await _repository.UpdateAsync(module, cancellationToken);

        return true;
    }

    public async Task<bool> DeleteModuleAsync(Guid id, Guid userId, CancellationToken cancellationToken = default)
    {
        var module = await _repository.GetByIdAsync(id, cancellationToken);
        
        if (module == null || module.UserId != userId)
        {
            return false;
        }

        await _repository.DeleteAsync(module, cancellationToken);

        return true;
    }

    private static CourseModuleDto MapToDto(CourseModule module)
    {
        return new CourseModuleDto
        {
            Id = module.Id,
            Name = module.Name,
            Description = module.Description,
            ColorTag = module.ColorTag,
            TargetHoursPerWeek = module.TargetHoursPerWeek,
            Semester = module.Semester,
            SubjectId = module.SubjectId,
            CreatedAt = module.CreatedAt,
            UpdatedAt = module.UpdatedAt
        };
    }
}
