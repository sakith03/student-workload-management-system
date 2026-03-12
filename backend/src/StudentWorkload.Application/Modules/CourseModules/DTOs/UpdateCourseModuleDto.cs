using System.ComponentModel.DataAnnotations;

namespace StudentWorkload.Application.Modules.CourseModules.DTOs;

public class UpdateCourseModuleDto
{
    [Required]
    [MaxLength(120)]
    public string Name { get; set; } = string.Empty;

    public string? Description { get; set; }

    public string ColorTag { get; set; } = "Blue";

    [Required]
    [Range(0, 168)]
    public decimal TargetHoursPerWeek { get; set; }

    [Required]
    public string Semester { get; set; } = string.Empty;

    public Guid? SubjectId { get; set; }
}
