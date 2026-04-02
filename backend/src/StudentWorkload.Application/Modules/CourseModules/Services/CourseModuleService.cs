namespace StudentWorkload.Application.Modules.CourseModules.Services;

using System.Text.Json;
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

    public async Task<IEnumerable<CourseModuleDto>> GetModulesAsync(
        Guid userId, Guid? subjectId = null,
        CancellationToken cancellationToken = default)
    {
        var modules = await _repository.GetByUserIdAsync(userId, cancellationToken);
        if (subjectId.HasValue)
            modules = modules.Where(m => m.SubjectId == subjectId.Value);
        return modules.Select(MapToDto).OrderByDescending(m => m.CreatedAt);
    }

    public async Task<CourseModuleDto?> GetModuleAsync(
        Guid id, Guid userId,
        CancellationToken cancellationToken = default)
    {
        var module = await _repository.GetByIdAsync(id, cancellationToken);
        if (module == null || module.UserId != userId) return null;
        return MapToDto(module);
    }

    public async Task<CourseModuleDto> CreateModuleAsync(
        Guid userId, CreateCourseModuleDto dto,
        CancellationToken cancellationToken = default)
    {
        // Serialize the steps list to JSON for DB storage
        var stepsJson = SerializeSteps(dto.StepByStepGuidance);

        var module = CourseModule.Create(
            userId:                 userId,
            name:                   dto.Name,
            semester:               dto.Semester,
            targetHoursPerWeek:     dto.TargetHoursPerWeek,
            description:            dto.Description,
            colorTag:               dto.ColorTag,
            subjectId:              dto.SubjectId,
            stepByStepGuidance:     stepsJson,
            submissionGuidelines:   dto.SubmissionGuidelines
        );

        await _repository.AddAsync(module, cancellationToken);
        return MapToDto(module);
    }

    public async Task<bool> UpdateModuleAsync(
        Guid id, Guid userId, UpdateCourseModuleDto dto,
        CancellationToken cancellationToken = default)
    {
        var module = await _repository.GetByIdAsync(id, cancellationToken);
        if (module == null || module.UserId != userId) return false;

        var stepsJson = SerializeSteps(dto.StepByStepGuidance);

        module.Update(
            name:                   dto.Name,
            semester:               dto.Semester,
            targetHoursPerWeek:     dto.TargetHoursPerWeek,
            description:            dto.Description,
            colorTag:               dto.ColorTag,
            stepByStepGuidance:     stepsJson,
            submissionGuidelines:   dto.SubmissionGuidelines
        );

        await _repository.UpdateAsync(module, cancellationToken);
        return true;
    }

    public async Task<bool> DeleteModuleAsync(
        Guid id, Guid userId,
        CancellationToken cancellationToken = default)
    {
        var module = await _repository.GetByIdAsync(id, cancellationToken);
        if (module == null || module.UserId != userId) return false;
        await _repository.DeleteAsync(module, cancellationToken);
        return true;
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private static string? SerializeSteps(List<string>? steps)
    {
        if (steps == null || steps.Count == 0) return null;
        return JsonSerializer.Serialize(steps);
    }

    private static List<string>? DeserializeSteps(string? json)
    {
        if (string.IsNullOrWhiteSpace(json)) return null;
        try { return JsonSerializer.Deserialize<List<string>>(json); }
        catch { return null; }
    }

    private static CourseModuleDto MapToDto(CourseModule module)
    {
        return new CourseModuleDto
        {
            Id                   = module.Id,
            Name                 = module.Name,
            Description          = module.Description,
            ColorTag             = module.ColorTag,
            TargetHoursPerWeek   = module.TargetHoursPerWeek,
            Semester             = module.Semester,
            SubjectId            = module.SubjectId,
            StepByStepGuidance   = DeserializeSteps(module.StepByStepGuidance),
            SubmissionGuidelines = module.SubmissionGuidelines,
            CreatedAt            = module.CreatedAt,
            UpdatedAt            = module.UpdatedAt
        };
    }
}