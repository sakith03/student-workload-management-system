namespace StudentWorkload.Domain.Modules.Academic.Entities;
 
public class AcademicProfile
{
    public Guid Id { get; private set; }
    public Guid UserId { get; private set; }       // FK to User
    public int AcademicYear { get; private set; }  // e.g. 1, 2, 3
    public int Semester { get; private set; }      // 1 or 2
    public DateTime UpdatedAt { get; private set; }
    public bool IsSetupComplete { get; private set; }
 
    private AcademicProfile() { }
 
    public static AcademicProfile Create(Guid userId, int academicYear, int semester)
    {
        if (academicYear < 1 || academicYear > 6)
            throw new ArgumentException("Academic year must be between 1 and 6.");
        if (semester < 1 || semester > 2)
            throw new ArgumentException("Semester must be 1 or 2.");
 
        return new AcademicProfile
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            AcademicYear = academicYear,
            Semester = semester,
            UpdatedAt = DateTime.UtcNow,
            IsSetupComplete = true
        };
    }
 
    public void Update(int academicYear, int semester)
    {
        if (academicYear < 1 || academicYear > 6)
            throw new ArgumentException("Academic year must be between 1 and 6.");
        if (semester < 1 || semester > 2)
            throw new ArgumentException("Semester must be 1 or 2.");
 
        AcademicYear = academicYear;
        Semester = semester;
        UpdatedAt = DateTime.UtcNow;
    }
}
