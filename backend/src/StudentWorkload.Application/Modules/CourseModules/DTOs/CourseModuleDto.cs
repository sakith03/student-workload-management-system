namespace StudentWorkload.Application.Modules.CourseModules.DTOs;

public class CourseModuleDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string ColorTag { get; set; } = string.Empty;
    public DateTime? DeadlineDate { get; set; }
    public string Semester { get; set; } = string.Empty;
    public Guid? SubjectId { get; set; }
    public List<string>? StepByStepGuidance { get; set; }
    public List<bool>? StepCompletions { get; set; }
    public string? SubmissionGuidelines { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}