namespace StudentWorkload.Domain.Modules.CourseModules.Entities;

public class CourseModule
{
    public Guid Id { get; private set; }
    public Guid UserId { get; private set; }
    public Guid? SubjectId { get; private set; }
    public string Name { get; private set; } = null!;
    public string? Description { get; private set; }
    public string ColorTag { get; private set; } = null!;
    public decimal TargetHoursPerWeek { get; private set; }
    public string Semester { get; private set; } = null!;
    // ── NEW: AI-extracted fields ──────────────────────────────────
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
        decimal targetHoursPerWeek,
        string? description = null,
        string colorTag = "Blue",
        Guid? subjectId = null,
        string? stepByStepGuidance = null,      // NEW
        string? submissionGuidelines = null)    // NEW
    {
        ArgumentException.ThrowIfNullOrEmpty(name, nameof(name));
        ArgumentException.ThrowIfNullOrEmpty(semester, nameof(semester));
        if (targetHoursPerWeek < 0 || targetHoursPerWeek > 168)
            throw new ArgumentOutOfRangeException(nameof(targetHoursPerWeek),
                "Target hours must be between 0 and 168.");

        return new CourseModule
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            SubjectId = subjectId,
            Name = name.Trim(),
            Semester = semester.Trim(),
            TargetHoursPerWeek = targetHoursPerWeek,
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
        decimal targetHoursPerWeek,
        string? description,
        string colorTag,
        string? stepByStepGuidance = null,      // NEW
        string? submissionGuidelines = null)    // NEW
    {
        ArgumentException.ThrowIfNullOrEmpty(name, nameof(name));
        ArgumentException.ThrowIfNullOrEmpty(semester, nameof(semester));
        if (targetHoursPerWeek < 0 || targetHoursPerWeek > 168)
            throw new ArgumentOutOfRangeException(nameof(targetHoursPerWeek),
                "Target hours must be between 0 and 168.");

        Name = name.Trim();
        Semester = semester.Trim();
        TargetHoursPerWeek = targetHoursPerWeek;
        Description = description?.Trim();
        ColorTag = string.IsNullOrWhiteSpace(colorTag) ? "Blue" : colorTag.Trim();
        StepByStepGuidance = stepByStepGuidance;
        SubmissionGuidelines = submissionGuidelines?.Trim();
        UpdatedAt = DateTime.UtcNow;
    }
}