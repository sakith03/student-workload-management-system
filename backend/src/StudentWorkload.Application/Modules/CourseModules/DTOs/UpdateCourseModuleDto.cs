using System.ComponentModel.DataAnnotations;

namespace StudentWorkload.Application.Modules.CourseModules.DTOs;

public class UpdateCourseModuleDto
{
    [Required]
    [MaxLength(120)]
    public string Name { get; set; } = string.Empty;

    public string? Description { get; set; }

    public string ColorTag { get; set; } = "Blue";

    public DateTime? DeadlineDate { get; set; }

    [Required]
    public string Semester { get; set; } = string.Empty;

    public Guid? SubjectId { get; set; }

    public List<string>? StepByStepGuidance { get; set; }
    public string? SubmissionGuidelines { get; set; }
}