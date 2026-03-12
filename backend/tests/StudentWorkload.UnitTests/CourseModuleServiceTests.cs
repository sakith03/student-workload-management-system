using Moq;
using FluentAssertions;
using StudentWorkload.Application.Modules.CourseModules.DTOs;
using StudentWorkload.Application.Modules.CourseModules.Services;
using StudentWorkload.Domain.Modules.CourseModules.Entities;
using StudentWorkload.Domain.Modules.CourseModules.Repositories;

namespace StudentWorkload.UnitTests;

public class CourseModuleServiceTests
{
    private readonly Mock<ICourseModuleRepository> _mockRepo;
    private readonly CourseModuleService _service;
    private readonly Guid _userId = Guid.NewGuid();

    public CourseModuleServiceTests()
    {
        _mockRepo = new Mock<ICourseModuleRepository>();
        _service = new CourseModuleService(_mockRepo.Object);
    }

    // ──────────────────────────────────────────────────────────
    //  GetModulesAsync
    // ──────────────────────────────────────────────────────────

    [Fact]
    public async Task GetModulesAsync_UserHasModules_ReturnsAllModulesDtoOrderedByCreatedAtDesc()
    {
        // Arrange
        var older = CourseModule.Create(_userId, "Algorithms", "Y3S1", 8, null, "Blue");
        var newer = CourseModule.Create(_userId, "Networks",   "Y3S1", 4, null, "Green");

        _mockRepo.Setup(r => r.GetByUserIdAsync(_userId, default))
            .ReturnsAsync(new[] { older, newer });

        // Act
        var result = (await _service.GetModulesAsync(_userId)).ToList();

        // Assert
        result.Should().HaveCount(2);
        // newest CreatedAt first (both created ~same time, but newer was created after older)
        result.Select(m => m.Name).Should().ContainInOrder("Networks", "Algorithms");
    }

    [Fact]
    public async Task GetModulesAsync_UserHasNoModules_ReturnsEmptyList()
    {
        // Arrange
        _mockRepo.Setup(r => r.GetByUserIdAsync(_userId, default))
            .ReturnsAsync(Enumerable.Empty<CourseModule>());

        // Act
        var result = await _service.GetModulesAsync(_userId);

        // Assert
        result.Should().BeEmpty();
    }

    // ──────────────────────────────────────────────────────────
    //  GetModuleAsync
    // ──────────────────────────────────────────────────────────

    [Fact]
    public async Task GetModuleAsync_ExistingModuleOwnedByUser_ReturnsDto()
    {
        // Arrange
        var module = CourseModule.Create(_userId, "Data Structures", "Y2S2", 6, "Core CS module", "Purple");
        _mockRepo.Setup(r => r.GetByIdAsync(module.Id, default))
            .ReturnsAsync(module);

        // Act
        var result = await _service.GetModuleAsync(module.Id, _userId);

        // Assert
        result.Should().NotBeNull();
        result!.Id.Should().Be(module.Id);
        result.Name.Should().Be("Data Structures");
        result.Semester.Should().Be("Y2S2");
        result.TargetHoursPerWeek.Should().Be(6);
        result.ColorTag.Should().Be("Purple");
        result.Description.Should().Be("Core CS module");
    }

    [Fact]
    public async Task GetModuleAsync_ModuleNotFound_ReturnsNull()
    {
        // Arrange
        _mockRepo.Setup(r => r.GetByIdAsync(It.IsAny<Guid>(), default))
            .ReturnsAsync((CourseModule?)null);

        // Act
        var result = await _service.GetModuleAsync(Guid.NewGuid(), _userId);

        // Assert
        result.Should().BeNull();
    }

    [Fact]
    public async Task GetModuleAsync_ModuleOwnedByDifferentUser_ReturnsNull()
    {
        // Arrange
        var anotherUserId = Guid.NewGuid();
        var module = CourseModule.Create(anotherUserId, "Security", "Y3S2", 5, null, "Red");
        _mockRepo.Setup(r => r.GetByIdAsync(module.Id, default))
            .ReturnsAsync(module);

        // Act — requesting as _userId, but module belongs to anotherUserId
        var result = await _service.GetModuleAsync(module.Id, _userId);

        // Assert
        result.Should().BeNull();
    }

    // ──────────────────────────────────────────────────────────
    //  CreateModuleAsync
    // ──────────────────────────────────────────────────────────

    [Fact]
    public async Task CreateModuleAsync_ValidDto_PersistsModuleAndReturnsDto()
    {
        // Arrange
        var dto = new CreateCourseModuleDto
        {
            Name = "Software Engineering",
            Semester = "Y3S1",
            TargetHoursPerWeek = 10,
            Description = "SE concepts",
            ColorTag = "Blue"
        };

        _mockRepo.Setup(r => r.AddAsync(It.IsAny<CourseModule>(), default))
            .Returns(Task.CompletedTask);

        // Act
        var result = await _service.CreateModuleAsync(_userId, dto);

        // Assert
        result.Should().NotBeNull();
        result.Id.Should().NotBeEmpty();
        result.Name.Should().Be("Software Engineering");
        result.Semester.Should().Be("Y3S1");
        result.TargetHoursPerWeek.Should().Be(10);
        result.Description.Should().Be("SE concepts");
        result.ColorTag.Should().Be("Blue");
        result.CreatedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(5));

        _mockRepo.Verify(r => r.AddAsync(It.IsAny<CourseModule>(), default), Times.Once);
    }

    [Fact]
    public async Task CreateModuleAsync_NoDescriptionOrColorTag_UsesDefaults()
    {
        // Arrange
        var dto = new CreateCourseModuleDto
        {
            Name = "Mathematics",
            Semester = "Y1S1",
            TargetHoursPerWeek = 4
            // Description = null, ColorTag = "Blue" (default)
        };

        _mockRepo.Setup(r => r.AddAsync(It.IsAny<CourseModule>(), default))
            .Returns(Task.CompletedTask);

        // Act
        var result = await _service.CreateModuleAsync(_userId, dto);

        // Assert
        result.Description.Should().BeNull();
        result.ColorTag.Should().Be("Blue");
    }

    [Fact]
    public void CreateModuleAsync_EmptyName_ThrowsArgumentException()
    {
        // Arrange & Act
        var act = () => CourseModule.Create(_userId, "", "Y3S1", 5);

        // Assert
        act.Should().Throw<ArgumentException>()
            .WithParameterName("name");
    }

    [Fact]
    public void CreateModuleAsync_EmptySemester_ThrowsArgumentException()
    {
        // Arrange & Act
        var act = () => CourseModule.Create(_userId, "Math", "", 5);

        // Assert
        act.Should().Throw<ArgumentException>()
            .WithParameterName("semester");
    }

    [Theory]
    [InlineData(-1)]
    [InlineData(169)]
    [InlineData(200)]
    public void CreateModuleAsync_InvalidTargetHours_ThrowsArgumentOutOfRangeException(decimal hours)
    {
        // Arrange & Act
        var act = () => CourseModule.Create(_userId, "Math", "Y3S1", hours);

        // Assert
        act.Should().Throw<ArgumentOutOfRangeException>()
            .WithParameterName("targetHoursPerWeek");
    }

    [Theory]
    [InlineData(0)]
    [InlineData(10)]
    [InlineData(168)]
    public void CreateModuleAsync_ValidBoundaryTargetHours_DoesNotThrow(decimal hours)
    {
        // Arrange & Act
        var act = () => CourseModule.Create(_userId, "Math", "Y3S1", hours);

        // Assert
        act.Should().NotThrow();
    }

    // ──────────────────────────────────────────────────────────
    //  UpdateModuleAsync
    // ──────────────────────────────────────────────────────────

    [Fact]
    public async Task UpdateModuleAsync_ExistingModuleOwnedByUser_UpdatesAndReturnsTrue()
    {
        // Arrange
        var module = CourseModule.Create(_userId, "Old Name", "Y1S1", 3, null, "Gray");
        var dto = new UpdateCourseModuleDto
        {
            Name = "New Name",
            Semester = "Y2S2",
            TargetHoursPerWeek = 7,
            Description = "Updated description",
            ColorTag = "Green"
        };

        _mockRepo.Setup(r => r.GetByIdAsync(module.Id, default))
            .ReturnsAsync(module);
        _mockRepo.Setup(r => r.UpdateAsync(module, default))
            .Returns(Task.CompletedTask);

        // Act
        var success = await _service.UpdateModuleAsync(module.Id, _userId, dto);

        // Assert
        success.Should().BeTrue();
        _mockRepo.Verify(r => r.UpdateAsync(It.IsAny<CourseModule>(), default), Times.Once);
    }

    [Fact]
    public async Task UpdateModuleAsync_ModuleNotFound_ReturnsFalse()
    {
        // Arrange
        _mockRepo.Setup(r => r.GetByIdAsync(It.IsAny<Guid>(), default))
            .ReturnsAsync((CourseModule?)null);

        var dto = new UpdateCourseModuleDto
            { Name = "X", Semester = "Y1S1", TargetHoursPerWeek = 5, ColorTag = "Blue" };

        // Act
        var success = await _service.UpdateModuleAsync(Guid.NewGuid(), _userId, dto);

        // Assert
        success.Should().BeFalse();
        _mockRepo.Verify(r => r.UpdateAsync(It.IsAny<CourseModule>(), default), Times.Never);
    }

    [Fact]
    public async Task UpdateModuleAsync_ModuleOwnedByDifferentUser_ReturnsFalse()
    {
        // Arrange
        var anotherUserId = Guid.NewGuid();
        var module = CourseModule.Create(anotherUserId, "Networking", "Y3S1", 4);

        _mockRepo.Setup(r => r.GetByIdAsync(module.Id, default))
            .ReturnsAsync(module);

        var dto = new UpdateCourseModuleDto
            { Name = "Hacked Name", Semester = "Y1S1", TargetHoursPerWeek = 5, ColorTag = "Red" };

        // Act — _userId tries to update a module owned by anotherUserId
        var success = await _service.UpdateModuleAsync(module.Id, _userId, dto);

        // Assert
        success.Should().BeFalse();
        _mockRepo.Verify(r => r.UpdateAsync(It.IsAny<CourseModule>(), default), Times.Never);
    }

    // ──────────────────────────────────────────────────────────
    //  DeleteModuleAsync
    // ──────────────────────────────────────────────────────────

    [Fact]
    public async Task DeleteModuleAsync_ExistingModuleOwnedByUser_DeletesAndReturnsTrue()
    {
        // Arrange
        var module = CourseModule.Create(_userId, "To Delete", "Y1S1", 2);

        _mockRepo.Setup(r => r.GetByIdAsync(module.Id, default))
            .ReturnsAsync(module);
        _mockRepo.Setup(r => r.DeleteAsync(module, default))
            .Returns(Task.CompletedTask);

        // Act
        var success = await _service.DeleteModuleAsync(module.Id, _userId);

        // Assert
        success.Should().BeTrue();
        _mockRepo.Verify(r => r.DeleteAsync(It.IsAny<CourseModule>(), default), Times.Once);
    }

    [Fact]
    public async Task DeleteModuleAsync_ModuleNotFound_ReturnsFalse()
    {
        // Arrange
        _mockRepo.Setup(r => r.GetByIdAsync(It.IsAny<Guid>(), default))
            .ReturnsAsync((CourseModule?)null);

        // Act
        var success = await _service.DeleteModuleAsync(Guid.NewGuid(), _userId);

        // Assert
        success.Should().BeFalse();
        _mockRepo.Verify(r => r.DeleteAsync(It.IsAny<CourseModule>(), default), Times.Never);
    }

    [Fact]
    public async Task DeleteModuleAsync_ModuleOwnedByDifferentUser_ReturnsFalse()
    {
        // Arrange
        var anotherUserId = Guid.NewGuid();
        var module = CourseModule.Create(anotherUserId, "Their Module", "Y3S1", 3);

        _mockRepo.Setup(r => r.GetByIdAsync(module.Id, default))
            .ReturnsAsync(module);

        // Act — _userId tries to delete another user's module
        var success = await _service.DeleteModuleAsync(module.Id, _userId);

        // Assert
        success.Should().BeFalse();
        _mockRepo.Verify(r => r.DeleteAsync(It.IsAny<CourseModule>(), default), Times.Never);
    }

    // ──────────────────────────────────────────────────────────
    //  Domain Entity — CourseModule.Update
    // ──────────────────────────────────────────────────────────

    [Fact]
    public void Update_ValidFields_UpdatesPropertiesAndSetsUpdatedAt()
    {
        // Arrange
        var module = CourseModule.Create(_userId, "Old", "Y1S1", 2, null, "Gray");

        // Act
        module.Update("New Name", "Y3S1", 9, "Updated desc", "Purple");

        // Assert
        module.Name.Should().Be("New Name");
        module.Semester.Should().Be("Y3S1");
        module.TargetHoursPerWeek.Should().Be(9);
        module.Description.Should().Be("Updated desc");
        module.ColorTag.Should().Be("Purple");
        module.UpdatedAt.Should().NotBeNull();
        module.UpdatedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(5));
    }

    [Fact]
    public void Update_NameWithWhitespace_TrimsName()
    {
        // Arrange
        var module = CourseModule.Create(_userId, "Original", "Y1S1", 2);

        // Act
        module.Update("  Trimmed Name  ", "Y3S1", 5, null, "Blue");

        // Assert
        module.Name.Should().Be("Trimmed Name");
    }

    [Fact]
    public void Update_EmptyColorTag_DefaultsToBlue()
    {
        // Arrange
        var module = CourseModule.Create(_userId, "Module", "Y1S1", 4);

        // Act
        module.Update("Module", "Y1S1", 4, null, "   ");

        // Assert
        module.ColorTag.Should().Be("Blue");
    }
}
