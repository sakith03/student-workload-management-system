using Moq;
using FluentAssertions;
using StudentWorkload.Application.Modules.CourseModules.DTOs;
using StudentWorkload.Application.Modules.CourseModules.Services;
using StudentWorkload.Domain.Modules.CourseModules.Entities;
using StudentWorkload.Domain.Modules.CourseModules.Repositories;

namespace StudentWorkload.UnitTests;

// ╔═══════════════════════════════════════════════════════════════════════════╗
// ║  CourseModuleServiceTests                                                 ║
// ║  Updated for the current schema:                                          ║
// ║   • DeadlineDate (DateTime?) replaces TargetHoursPerWeek                 ║
// ║   • StepByStepGuidance / StepCompletions / IsCompleted added             ║
// ║   • PatchCompletionsAsync and CompleteGoalAsync covered                  ║
// ╚═══════════════════════════════════════════════════════════════════════════╝

public class CourseModuleServiceTests
{
    // ── Test fixture ─────────────────────────────────────────────────────────
    private readonly Mock<ICourseModuleRepository> _mockRepo;
    private readonly CourseModuleService _service;
    private readonly Guid _userId = Guid.NewGuid();

    public CourseModuleServiceTests()
    {
        _mockRepo = new Mock<ICourseModuleRepository>();
        _service  = new CourseModuleService(_mockRepo.Object);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    /// <summary>Creates a minimal valid module owned by <see cref="_userId"/>.</summary>
    private CourseModule MakeModule(
        string name     = "Test Module",
        string semester = "Y3S1",
        DateTime? deadline = null,
        string colorTag    = "Blue",
        string? description = null,
        Guid? ownerId = null)
        => CourseModule.Create(
            ownerId ?? _userId,
            name,
            semester,
            deadline,
            description,
            colorTag);

    // =========================================================================
    //  GetModulesAsync
    // =========================================================================

    [Fact]
    public async Task GetModulesAsync_UserHasModules_ReturnsAllModulesOrderedByCreatedAtDesc()
    {
        // Arrange — create two modules; "Networks" is created after "Algorithms"
        var older = MakeModule("Algorithms");
        var newer = MakeModule("Networks");

        _mockRepo.Setup(r => r.GetByUserIdAsync(_userId, default))
            .ReturnsAsync(new[] { older, newer });

        // Act
        var result = (await _service.GetModulesAsync(_userId)).ToList();

        // Assert
        result.Should().HaveCount(2);
        // OrderByDescending(CreatedAt) → newer first
        result.Select(m => m.Name).Should().ContainInOrder("Networks", "Algorithms");
    }

    [Fact]
    public async Task GetModulesAsync_UserHasNoModules_ReturnsEmptyCollection()
    {
        _mockRepo.Setup(r => r.GetByUserIdAsync(_userId, default))
            .ReturnsAsync(Enumerable.Empty<CourseModule>());

        var result = await _service.GetModulesAsync(_userId);

        result.Should().BeEmpty();
    }

    [Fact]
    public async Task GetModulesAsync_WithSubjectIdFilter_ReturnsOnlyMatchingModules()
    {
        var subjectId  = Guid.NewGuid();
        var matching   = CourseModule.Create(_userId, "Filtered",     "Y3S1", null, null, "Blue",  subjectId);
        var notMatching = CourseModule.Create(_userId, "Not Filtered", "Y3S1", null, null, "Green", null);

        _mockRepo.Setup(r => r.GetByUserIdAsync(_userId, default))
            .ReturnsAsync(new[] { matching, notMatching });

        var result = (await _service.GetModulesAsync(_userId, subjectId)).ToList();

        result.Should().HaveCount(1);
        result[0].Name.Should().Be("Filtered");
    }

    // =========================================================================
    //  GetModuleAsync
    // =========================================================================

    [Fact]
    public async Task GetModuleAsync_ExistingModuleOwnedByUser_ReturnsCorrectDto()
    {
        var deadline = new DateTime(2026, 12, 31, 0, 0, 0, DateTimeKind.Utc);
        var module   = MakeModule("Data Structures", "Y2S2", deadline, "Purple", "Core CS module");

        _mockRepo.Setup(r => r.GetByIdAsync(module.Id, default))
            .ReturnsAsync(module);

        var result = await _service.GetModuleAsync(module.Id, _userId);

        result.Should().NotBeNull();
        result!.Id.Should().Be(module.Id);
        result.Name.Should().Be("Data Structures");
        result.Semester.Should().Be("Y2S2");
        result.DeadlineDate.Should().Be(deadline);
        result.ColorTag.Should().Be("Purple");
        result.Description.Should().Be("Core CS module");
        result.IsCompleted.Should().BeFalse();
    }

    [Fact]
    public async Task GetModuleAsync_ModuleNotFound_ReturnsNull()
    {
        _mockRepo.Setup(r => r.GetByIdAsync(It.IsAny<Guid>(), default))
            .ReturnsAsync((CourseModule?)null);

        var result = await _service.GetModuleAsync(Guid.NewGuid(), _userId);

        result.Should().BeNull();
    }

    [Fact]
    public async Task GetModuleAsync_ModuleOwnedByDifferentUser_ReturnsNull()
    {
        var anotherUser = Guid.NewGuid();
        var module      = MakeModule(ownerId: anotherUser);

        _mockRepo.Setup(r => r.GetByIdAsync(module.Id, default))
            .ReturnsAsync(module);

        // _userId requests a module that belongs to anotherUser
        var result = await _service.GetModuleAsync(module.Id, _userId);

        result.Should().BeNull();
    }

    // =========================================================================
    //  CreateModuleAsync  — basic goals (no steps / AI goals)
    // =========================================================================

    [Fact]
    public async Task CreateModuleAsync_ValidDto_PersistsModuleAndReturnsDto()
    {
        var deadline = new DateTime(2026, 11, 20, 0, 0, 0, DateTimeKind.Utc);
        var dto = new CreateCourseModuleDto
        {
            Name         = "Software Engineering",
            Semester     = "Y3S1",
            DeadlineDate = deadline,
            Description  = "SE concepts",
            ColorTag     = "Blue"
        };

        _mockRepo.Setup(r => r.AddAsync(It.IsAny<CourseModule>(), default))
            .Returns(Task.CompletedTask);

        var result = await _service.CreateModuleAsync(_userId, dto);

        result.Should().NotBeNull();
        result.Id.Should().NotBeEmpty();
        result.Name.Should().Be("Software Engineering");
        result.Semester.Should().Be("Y3S1");
        result.DeadlineDate.Should().Be(deadline);
        result.Description.Should().Be("SE concepts");
        result.ColorTag.Should().Be("Blue");
        result.IsCompleted.Should().BeFalse();
        result.StepCompletions.Should().BeNullOrEmpty();
        result.CreatedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(5));

        _mockRepo.Verify(r => r.AddAsync(It.IsAny<CourseModule>(), default), Times.Once);
    }

    [Fact]
    public async Task CreateModuleAsync_NoDeadlineOrDescription_UsesDefaults()
    {
        var dto = new CreateCourseModuleDto
        {
            Name     = "Mathematics",
            Semester = "Y1S1"
            // DeadlineDate = null (optional), ColorTag = "Blue" (default)
        };

        _mockRepo.Setup(r => r.AddAsync(It.IsAny<CourseModule>(), default))
            .Returns(Task.CompletedTask);

        var result = await _service.CreateModuleAsync(_userId, dto);

        result.Description.Should().BeNull();
        result.DeadlineDate.Should().BeNull();
        result.ColorTag.Should().Be("Blue");
    }

    // =========================================================================
    //  CreateModuleAsync  — manual goal (with steps)
    // =========================================================================

    [Fact]
    public async Task CreateModuleAsync_WithManualSteps_PersistsStepsAndResetsCompletions()
    {
        var steps = new List<string>
        {
            "Read chapter 1",
            "Complete exercises",
            "Submit report"
        };
        var deadline = new DateTime(2026, 10, 1, 0, 0, 0, DateTimeKind.Utc);

        var dto = new CreateCourseModuleDto
        {
            Name               = "Lab Assignment 1",
            Semester           = "Y3S1",
            DeadlineDate       = deadline,
            ColorTag           = "Green",
            StepByStepGuidance = steps
        };

        _mockRepo.Setup(r => r.AddAsync(It.IsAny<CourseModule>(), default))
            .Returns(Task.CompletedTask);

        var result = await _service.CreateModuleAsync(_userId, dto);

        result.StepByStepGuidance.Should().NotBeNull();
        result.StepByStepGuidance.Should().HaveCount(3);
        result.StepByStepGuidance.Should().BeEquivalentTo(steps, o => o.WithStrictOrdering());

        // Completions always reset to null on creation — never inherit from DTO
        result.StepCompletions.Should().BeNullOrEmpty();
        result.IsCompleted.Should().BeFalse();
    }

    [Fact]
    public async Task CreateModuleAsync_WithEmptyStepList_StoresNullSteps()
    {
        var dto = new CreateCourseModuleDto
        {
            Name               = "Goal With No Steps",
            Semester           = "Y3S1",
            StepByStepGuidance = new List<string>()   // empty list
        };

        _mockRepo.Setup(r => r.AddAsync(It.IsAny<CourseModule>(), default))
            .Returns(Task.CompletedTask);

        var result = await _service.CreateModuleAsync(_userId, dto);

        // Empty list → serializer treats it as null → DTO should be null
        result.StepByStepGuidance.Should().BeNullOrEmpty();
    }

    // =========================================================================
    //  Domain Entity — CourseModule.Create validation
    // =========================================================================

    [Fact]
    public void Create_EmptyName_ThrowsArgumentException()
    {
        var act = () => CourseModule.Create(_userId, "", "Y3S1");

        act.Should().Throw<ArgumentException>()
            .WithParameterName("name");
    }

    [Fact]
    public void Create_EmptySemester_ThrowsArgumentException()
    {
        var act = () => CourseModule.Create(_userId, "Math", "");

        act.Should().Throw<ArgumentException>()
            .WithParameterName("semester");
    }

    [Fact]
    public void Create_WithFutureDeadline_DoesNotThrow()
    {
        var futureDate = DateTime.UtcNow.AddDays(30);
        var act = () => CourseModule.Create(_userId, "Math", "Y3S1", futureDate);

        act.Should().NotThrow();
    }

    [Fact]
    public void Create_WithNullDeadline_DoesNotThrow()
    {
        var act = () => CourseModule.Create(_userId, "Math", "Y3S1", null);

        act.Should().NotThrow();
    }

    // =========================================================================
    //  UpdateModuleAsync
    // =========================================================================

    [Fact]
    public async Task UpdateModuleAsync_ExistingModuleOwnedByUser_UpdatesAndReturnsTrue()
    {
        var module  = MakeModule("Old Name", "Y1S1", null, "Gray");
        var newDeadline = new DateTime(2026, 8, 15, 0, 0, 0, DateTimeKind.Utc);
        var dto = new UpdateCourseModuleDto
        {
            Name         = "New Name",
            Semester     = "Y2S2",
            DeadlineDate = newDeadline,
            Description  = "Updated description",
            ColorTag     = "Green"
        };

        _mockRepo.Setup(r => r.GetByIdAsync(module.Id, default)).ReturnsAsync(module);
        _mockRepo.Setup(r => r.UpdateAsync(module, default)).Returns(Task.CompletedTask);

        var success = await _service.UpdateModuleAsync(module.Id, _userId, dto);

        success.Should().BeTrue();
        _mockRepo.Verify(r => r.UpdateAsync(It.IsAny<CourseModule>(), default), Times.Once);
    }

    [Fact]
    public async Task UpdateModuleAsync_WithNewSteps_ReplacesStepGuidance()
    {
        var module = MakeModule();
        var newSteps = new List<string> { "Step A", "Step B" };
        var dto = new UpdateCourseModuleDto
        {
            Name               = module.Name,
            Semester           = module.Semester,
            ColorTag           = module.ColorTag,
            StepByStepGuidance = newSteps
        };

        _mockRepo.Setup(r => r.GetByIdAsync(module.Id, default)).ReturnsAsync(module);
        _mockRepo.Setup(r => r.UpdateAsync(module, default)).Returns(Task.CompletedTask);

        var success = await _service.UpdateModuleAsync(module.Id, _userId, dto);

        success.Should().BeTrue();
        _mockRepo.Verify(r => r.UpdateAsync(It.IsAny<CourseModule>(), default), Times.Once);
    }

    [Fact]
    public async Task UpdateModuleAsync_ModuleNotFound_ReturnsFalse()
    {
        _mockRepo.Setup(r => r.GetByIdAsync(It.IsAny<Guid>(), default))
            .ReturnsAsync((CourseModule?)null);

        var dto = new UpdateCourseModuleDto { Name = "X", Semester = "Y1S1", ColorTag = "Blue" };

        var success = await _service.UpdateModuleAsync(Guid.NewGuid(), _userId, dto);

        success.Should().BeFalse();
        _mockRepo.Verify(r => r.UpdateAsync(It.IsAny<CourseModule>(), default), Times.Never);
    }

    [Fact]
    public async Task UpdateModuleAsync_ModuleOwnedByDifferentUser_ReturnsFalse()
    {
        var anotherUser = Guid.NewGuid();
        var module      = MakeModule(ownerId: anotherUser);
        var dto         = new UpdateCourseModuleDto { Name = "Hacked", Semester = "Y1S1", ColorTag = "Red" };

        _mockRepo.Setup(r => r.GetByIdAsync(module.Id, default)).ReturnsAsync(module);

        var success = await _service.UpdateModuleAsync(module.Id, _userId, dto);

        success.Should().BeFalse();
        _mockRepo.Verify(r => r.UpdateAsync(It.IsAny<CourseModule>(), default), Times.Never);
    }

    // =========================================================================
    //  DeleteModuleAsync
    // =========================================================================

    [Fact]
    public async Task DeleteModuleAsync_ExistingModuleOwnedByUser_DeletesAndReturnsTrue()
    {
        var module = MakeModule("To Delete");

        _mockRepo.Setup(r => r.GetByIdAsync(module.Id, default)).ReturnsAsync(module);
        _mockRepo.Setup(r => r.DeleteAsync(module, default)).Returns(Task.CompletedTask);

        var success = await _service.DeleteModuleAsync(module.Id, _userId);

        success.Should().BeTrue();
        _mockRepo.Verify(r => r.DeleteAsync(It.IsAny<CourseModule>(), default), Times.Once);
    }

    [Fact]
    public async Task DeleteModuleAsync_ModuleNotFound_ReturnsFalse()
    {
        _mockRepo.Setup(r => r.GetByIdAsync(It.IsAny<Guid>(), default))
            .ReturnsAsync((CourseModule?)null);

        var success = await _service.DeleteModuleAsync(Guid.NewGuid(), _userId);

        success.Should().BeFalse();
        _mockRepo.Verify(r => r.DeleteAsync(It.IsAny<CourseModule>(), default), Times.Never);
    }

    [Fact]
    public async Task DeleteModuleAsync_ModuleOwnedByDifferentUser_ReturnsFalse()
    {
        var anotherUser = Guid.NewGuid();
        var module      = MakeModule(ownerId: anotherUser);

        _mockRepo.Setup(r => r.GetByIdAsync(module.Id, default)).ReturnsAsync(module);

        var success = await _service.DeleteModuleAsync(module.Id, _userId);

        success.Should().BeFalse();
        _mockRepo.Verify(r => r.DeleteAsync(It.IsAny<CourseModule>(), default), Times.Never);
    }

    // =========================================================================
    //  PatchCompletionsAsync
    // =========================================================================

    [Fact]
    public async Task PatchCompletionsAsync_ActiveGoal_UpdatesCompletionsAndReturnsTrueNotClosed()
    {
        var futureDeadline = DateTime.UtcNow.AddDays(10);
        var module = MakeModule(deadline: futureDeadline);
        var completions = new List<bool> { true, false, true };

        _mockRepo.Setup(r => r.GetByIdAsync(module.Id, default)).ReturnsAsync(module);
        _mockRepo.Setup(r => r.UpdateAsync(module, default)).Returns(Task.CompletedTask);

        var (found, closed) = await _service.PatchCompletionsAsync(module.Id, _userId, completions);

        found.Should().BeTrue();
        closed.Should().BeFalse();
        _mockRepo.Verify(r => r.UpdateAsync(It.IsAny<CourseModule>(), default), Times.Once);
    }

    [Fact]
    public async Task PatchCompletionsAsync_GoalWithPassedDeadline_ReturnsTrueAndClosed()
    {
        // A goal whose deadline passed yesterday → UpdateCompletions throws → service returns closed=true
        var pastDeadline = DateTime.UtcNow.AddDays(-1);
        var module       = MakeModule(deadline: pastDeadline);
        var completions  = new List<bool> { true };

        _mockRepo.Setup(r => r.GetByIdAsync(module.Id, default)).ReturnsAsync(module);

        var (found, closed) = await _service.PatchCompletionsAsync(module.Id, _userId, completions);

        found.Should().BeTrue();
        closed.Should().BeTrue();
        // No DB write should occur — entity threw before Update was called
        _mockRepo.Verify(r => r.UpdateAsync(It.IsAny<CourseModule>(), default), Times.Never);
    }

    [Fact]
    public async Task PatchCompletionsAsync_ModuleNotFound_ReturnsFalseAndNotClosed()
    {
        _mockRepo.Setup(r => r.GetByIdAsync(It.IsAny<Guid>(), default))
            .ReturnsAsync((CourseModule?)null);

        var (found, closed) = await _service.PatchCompletionsAsync(Guid.NewGuid(), _userId, new List<bool> { true });

        found.Should().BeFalse();
        closed.Should().BeFalse();
    }

    [Fact]
    public async Task PatchCompletionsAsync_ModuleOwnedByDifferentUser_ReturnsFalse()
    {
        var anotherUser = Guid.NewGuid();
        var module      = MakeModule(ownerId: anotherUser);

        _mockRepo.Setup(r => r.GetByIdAsync(module.Id, default)).ReturnsAsync(module);

        var (found, closed) = await _service.PatchCompletionsAsync(module.Id, _userId, new List<bool>());

        found.Should().BeFalse();
        closed.Should().BeFalse();
    }

    // =========================================================================
    //  CompleteGoalAsync
    // =========================================================================

    [Fact]
    public async Task CompleteGoalAsync_ActiveGoalWithFutureDeadline_MarksCompletedAndReturnsFalseAlreadyDone()
    {
        var futureDeadline = DateTime.UtcNow.AddDays(5);
        var module = MakeModule(deadline: futureDeadline);

        _mockRepo.Setup(r => r.GetByIdAsync(module.Id, default)).ReturnsAsync(module);
        _mockRepo.Setup(r => r.UpdateAsync(module, default)).Returns(Task.CompletedTask);

        var (found, alreadyDone) = await _service.CompleteGoalAsync(module.Id, _userId);

        found.Should().BeTrue();
        alreadyDone.Should().BeFalse();
        _mockRepo.Verify(r => r.UpdateAsync(It.IsAny<CourseModule>(), default), Times.Once);
    }

    [Fact]
    public async Task CompleteGoalAsync_GoalWithPassedDeadline_ReturnsTrueAndAlreadyDone()
    {
        var pastDeadline = DateTime.UtcNow.AddDays(-1);
        var module       = MakeModule(deadline: pastDeadline);

        _mockRepo.Setup(r => r.GetByIdAsync(module.Id, default)).ReturnsAsync(module);

        var (found, alreadyDone) = await _service.CompleteGoalAsync(module.Id, _userId);

        found.Should().BeTrue();
        alreadyDone.Should().BeTrue();
        _mockRepo.Verify(r => r.UpdateAsync(It.IsAny<CourseModule>(), default), Times.Never);
    }

    [Fact]
    public async Task CompleteGoalAsync_AlreadyCompletedGoal_ReturnsTrueAndAlreadyDone()
    {
        var module = MakeModule(deadline: DateTime.UtcNow.AddDays(10));

        _mockRepo.Setup(r => r.GetByIdAsync(module.Id, default)).ReturnsAsync(module);
        _mockRepo.Setup(r => r.UpdateAsync(module, default)).Returns(Task.CompletedTask);

        // First completion — succeeds
        await _service.CompleteGoalAsync(module.Id, _userId);

        // Reset + re-setup so the already-completed module is returned
        _mockRepo.Reset();
        _mockRepo.Setup(r => r.GetByIdAsync(module.Id, default)).ReturnsAsync(module);

        // Second completion attempt — entity's Complete() throws
        var (found, alreadyDone) = await _service.CompleteGoalAsync(module.Id, _userId);

        found.Should().BeTrue();
        alreadyDone.Should().BeTrue();
    }

    [Fact]
    public async Task CompleteGoalAsync_ModuleNotFound_ReturnsFalse()
    {
        _mockRepo.Setup(r => r.GetByIdAsync(It.IsAny<Guid>(), default))
            .ReturnsAsync((CourseModule?)null);

        var (found, alreadyDone) = await _service.CompleteGoalAsync(Guid.NewGuid(), _userId);

        found.Should().BeFalse();
        alreadyDone.Should().BeFalse();
    }

    [Fact]
    public async Task CompleteGoalAsync_ModuleOwnedByDifferentUser_ReturnsFalse()
    {
        var anotherUser = Guid.NewGuid();
        var module      = MakeModule(ownerId: anotherUser, deadline: DateTime.UtcNow.AddDays(5));

        _mockRepo.Setup(r => r.GetByIdAsync(module.Id, default)).ReturnsAsync(module);

        var (found, alreadyDone) = await _service.CompleteGoalAsync(module.Id, _userId);

        found.Should().BeFalse();
        alreadyDone.Should().BeFalse();
        _mockRepo.Verify(r => r.UpdateAsync(It.IsAny<CourseModule>(), default), Times.Never);
    }

    // =========================================================================
    //  Domain Entity — Update method
    // =========================================================================

    [Fact]
    public void Update_ValidFields_UpdatesPropertiesAndSetsUpdatedAt()
    {
        var module      = MakeModule("Old", "Y1S1", null, "Gray");
        var newDeadline = new DateTime(2027, 3, 1, 0, 0, 0, DateTimeKind.Utc);

        module.Update("New Name", "Y3S1", newDeadline, "Updated desc", "Purple");

        module.Name.Should().Be("New Name");
        module.Semester.Should().Be("Y3S1");
        module.DeadlineDate.Should().Be(newDeadline);
        module.Description.Should().Be("Updated desc");
        module.ColorTag.Should().Be("Purple");
        module.UpdatedAt.Should().NotBeNull();
        module.UpdatedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(5));
    }

    [Fact]
    public void Update_NameWithLeadingTrailingWhitespace_TrimsSaved()
    {
        var module = MakeModule("Original");

        module.Update("  Trimmed Name  ", "Y3S1", null, null, "Blue");

        module.Name.Should().Be("Trimmed Name");
    }

    [Fact]
    public void Update_EmptyColorTag_DefaultsToBlue()
    {
        var module = MakeModule();

        module.Update("Module", "Y1S1", null, null, "   ");

        module.ColorTag.Should().Be("Blue");
    }

    [Fact]
    public void Update_ClearingDeadline_SetsDeadlineDateToNull()
    {
        var deadline = DateTime.UtcNow.AddDays(7);
        var module   = MakeModule(deadline: deadline);

        module.Update(module.Name, module.Semester, null, null, "Blue");

        module.DeadlineDate.Should().BeNull();
    }

    // =========================================================================
    //  Domain Entity — UpdateCompletions
    // =========================================================================

    [Fact]
    public void UpdateCompletions_BeforeDeadline_Succeeds()
    {
        var module = MakeModule(deadline: DateTime.UtcNow.AddDays(5));

        var act = () => module.UpdateCompletions("[true,false]");

        act.Should().NotThrow();
        module.UpdatedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(5));
    }

    [Fact]
    public void UpdateCompletions_AfterDeadline_ThrowsInvalidOperationException()
    {
        var module = MakeModule(deadline: DateTime.UtcNow.AddDays(-1));

        var act = () => module.UpdateCompletions("[true]");

        act.Should().Throw<InvalidOperationException>()
            .WithMessage("*closed*");
    }

    [Fact]
    public void UpdateCompletions_NoDeadlineSet_AlwaysSucceeds()
    {
        var module = MakeModule(deadline: null);

        var act = () => module.UpdateCompletions("[false,true,true]");

        act.Should().NotThrow();
    }

    // =========================================================================
    //  Domain Entity — Complete
    // =========================================================================

    [Fact]
    public void Complete_BeforeDeadline_SetsIsCompletedTrueAndUpdatedAt()
    {
        var module = MakeModule(deadline: DateTime.UtcNow.AddDays(3));

        module.Complete();

        module.IsCompleted.Should().BeTrue();
        module.UpdatedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(5));
    }

    [Fact]
    public void Complete_AfterDeadline_ThrowsInvalidOperationException()
    {
        var module = MakeModule(deadline: DateTime.UtcNow.AddDays(-1));

        var act = () => module.Complete();

        act.Should().Throw<InvalidOperationException>()
            .WithMessage("*closed*");
    }

    [Fact]
    public void Complete_NoDeadline_SetsIsCompletedTrue()
    {
        var module = MakeModule(deadline: null);

        module.Complete();

        module.IsCompleted.Should().BeTrue();
    }

    [Fact]
    public void Complete_AlreadyCompleted_ThrowsInvalidOperationException()
    {
        var module = MakeModule(deadline: DateTime.UtcNow.AddDays(10));
        module.Complete();  // first call succeeds

        var act = () => module.Complete();  // second call should throw

        act.Should().Throw<InvalidOperationException>()
            .WithMessage("*already completed*");
    }
}
