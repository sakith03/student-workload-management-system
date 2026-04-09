namespace StudentWorkload.Domain.Modules.CourseModules.Entities;

public class CourseModule
{
    public Guid Id { get; private set; }
    public Guid UserId { get; private set; }
    public Guid? SubjectId { get; private set; }
    public string Name { get; private set; } = null!;
    public string? Description { get; private set; }
    public string ColorTag { get; private set; } = null!;
    public DateTime? DeadlineDate { get; private set; }
    public string Semester { get; private set; } = null!;
    // ── AI-extracted fields ──────────────────────────────────────
    public string? StepByStepGuidance { get; private set; }    // stored as JSON array string
    public string? StepCompletions { get; private set; }       // stored as JSON bool array string
    public string? SubmissionGuidelines { get; private set; }
    public bool IsCompleted { get; private set; }
    // ─────────────────────────────────────────────────────────────
    public DateTime CreatedAt { get; private set; }
    public DateTime? UpdatedAt { get; private set; }

    private CourseModule() { }

    public static CourseModule Create(
        Guid userId,
        string name,
        string semester,
        DateTime? deadlineDate = null,
        string? description = null,
        string colorTag = "Blue",
        Guid? subjectId = null,
        string? stepByStepGuidance = null,
        string? stepCompletions = null,
        string? submissionGuidelines = null)
    {
        ArgumentException.ThrowIfNullOrEmpty(name, nameof(name));
        ArgumentException.ThrowIfNullOrEmpty(semester, nameof(semester));

        return new CourseModule
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            SubjectId = subjectId,
            Name = name.Trim(),
            Semester = semester.Trim(),
            DeadlineDate = deadlineDate,
            Description = description?.Trim(),
            ColorTag = string.IsNullOrWhiteSpace(colorTag) ? "Blue" : colorTag.Trim(),
            StepByStepGuidance = stepByStepGuidance,
            StepCompletions = stepCompletions,
            SubmissionGuidelines = submissionGuidelines?.Trim(),
            CreatedAt = DateTime.UtcNow
        };
    }

    public void Update(
        string name,
        string semester,
        DateTime? deadlineDate,
        string? description,
        string colorTag,
        string? stepByStepGuidance = null,
        string? stepCompletions = null,
        string? submissionGuidelines = null)
    {
        ArgumentException.ThrowIfNullOrEmpty(name, nameof(name));
        ArgumentException.ThrowIfNullOrEmpty(semester, nameof(semester));

        Name = name.Trim();
        Semester = semester.Trim();
        DeadlineDate = deadlineDate;
        Description = description?.Trim();
        ColorTag = string.IsNullOrWhiteSpace(colorTag) ? "Blue" : colorTag.Trim();
        StepByStepGuidance = stepByStepGuidance;
        StepCompletions = stepCompletions;
        SubmissionGuidelines = submissionGuidelines?.Trim();
        UpdatedAt = DateTime.UtcNow;
    }

    /// <summary>
    /// Lightweight update — only persists the step completion booleans.
    /// Raises an exception if the goal's deadline has already passed.
    /// </summary>
    public void UpdateCompletions(string? completionsJson)
    {
        if (DeadlineDate.HasValue && DeadlineDate.Value.ToUniversalTime() < DateTime.UtcNow)
            throw new InvalidOperationException("Goal is closed — deadline has passed.");

        StepCompletions = completionsJson;
        UpdatedAt = DateTime.UtcNow;
    }

    /// <summary>
    /// Permanently marks the goal as completed. Once completed, no further edits are allowed.
    /// </summary>
    public void Complete()
    {
        if (IsCompleted)
            throw new InvalidOperationException("Goal is already completed.");

        if (DeadlineDate.HasValue && DeadlineDate.Value.ToUniversalTime() < DateTime.UtcNow)
            throw new InvalidOperationException("Goal is closed — deadline has passed.");

        IsCompleted = true;
        UpdatedAt   = DateTime.UtcNow;
    }
}