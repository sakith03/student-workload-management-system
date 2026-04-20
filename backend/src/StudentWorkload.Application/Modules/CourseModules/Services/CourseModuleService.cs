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
        var stepsJson = SerializeSteps(dto.StepByStepGuidance);

        var module = CourseModule.Create(
            userId:                 userId,
            name:                   dto.Name,
            semester:               dto.Semester,
            deadlineDate:           dto.DeadlineDate,
            description:            dto.Description,
            colorTag:               dto.ColorTag,
            subjectId:              dto.SubjectId,
            stepByStepGuidance:     stepsJson,
            stepCompletions:        null,   // always reset completions on create
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

        var stepsJson       = SerializeSteps(dto.StepByStepGuidance);
        var completionsJson = SerializeCompletions(dto.StepCompletions);

        module.Update(
            name:                   dto.Name,
            semester:               dto.Semester,
            deadlineDate:           dto.DeadlineDate,
            description:            dto.Description,
            colorTag:               dto.ColorTag,
            stepByStepGuidance:     stepsJson,
            stepCompletions:        completionsJson,
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

    /// <summary>
    /// Lightweight patch — updates only the step completion booleans.
    /// Returns (found: false, _) if the goal doesn't exist or belongs to another user.
    /// Returns (found: true, closed: true) if the deadline has passed (goal is locked).
    /// </summary>
    public async Task<(bool found, bool closed)> PatchCompletionsAsync(
        Guid id, Guid userId, List<bool> completions,
        CancellationToken cancellationToken = default)
    {
        var module = await _repository.GetByIdAsync(id, cancellationToken);
        if (module == null || module.UserId != userId) return (false, false);

        try
        {
            var completionsJson = SerializeCompletions(completions);
            module.UpdateCompletions(completionsJson);
            await _repository.UpdateAsync(module, cancellationToken);
            return (true, false);
        }
        catch (InvalidOperationException)
        {
            // Deadline has passed — goal is closed
            return (true, true);
        }
    }

    /// <summary>
    /// Permanently marks the goal as completed. Returns (found:false) if not found/unauthorized;
    /// (found:true, alreadyDone:true) if deadline passed or already completed.
    /// </summary>
    public async Task<(bool found, bool alreadyDone)> CompleteGoalAsync(
        Guid id, Guid userId,
        CancellationToken cancellationToken = default)
    {
        var module = await _repository.GetByIdAsync(id, cancellationToken);
        if (module == null || module.UserId != userId) return (false, false);

        try
        {
            module.Complete();
            await _repository.UpdateAsync(module, cancellationToken);
            return (true, false);
        }
        catch (InvalidOperationException)
        {
            return (true, true);
        }
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private static string? SerializeSteps(List<string>? steps)
    {
        if (steps == null || steps.Count == 0) return null;
        return JsonSerializer.Serialize(steps);
    }

    private static string? SerializeCompletions(List<bool>? completions)
    {
        if (completions == null || completions.Count == 0) return null;
        return JsonSerializer.Serialize(completions);
    }

    private static List<string>? DeserializeSteps(string? json)
    {
        if (string.IsNullOrWhiteSpace(json)) return null;
        try { return JsonSerializer.Deserialize<List<string>>(json); }
        catch { return null; }
    }

    private static List<bool>? DeserializeCompletions(string? json)
    {
        if (string.IsNullOrWhiteSpace(json)) return null;
        try { return JsonSerializer.Deserialize<List<bool>>(json); }
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
            DeadlineDate         = module.DeadlineDate,
            Semester             = module.Semester,
            SubjectId            = module.SubjectId,
            StepByStepGuidance   = DeserializeSteps(module.StepByStepGuidance),
            StepCompletions      = DeserializeCompletions(module.StepCompletions),
            SubmissionGuidelines = module.SubmissionGuidelines,
            IsCompleted          = module.IsCompleted,
            CreatedAt            = module.CreatedAt,
            UpdatedAt            = module.UpdatedAt
        };
    }
}