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
    public string? SubmissionGuidelines { get; private set; }
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
        SubmissionGuidelines = submissionGuidelines?.Trim();
        UpdatedAt = DateTime.UtcNow;
    }
}