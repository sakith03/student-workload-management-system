using FluentAssertions;
using Moq;
using StudentWorkload.Application.Modules.Academic.Commands.SetupProfile;
using StudentWorkload.Domain.Modules.Academic.Entities;
using StudentWorkload.Domain.Modules.Academic.Repositories;
using Xunit;

namespace StudentWorkload.UnitTests.Modules.Academic;

public class SetupAcademicProfileCommandHandlerTests
{
    private readonly Mock<IAcademicProfileRepository> _repoMock;
    private readonly SetupAcademicProfileCommandHandler _handler;
    private readonly Guid _userId = Guid.NewGuid();

    public SetupAcademicProfileCommandHandlerTests()
    {
        _repoMock = new Mock<IAcademicProfileRepository>();
        _handler = new SetupAcademicProfileCommandHandler(_repoMock.Object);
    }

    // ── Happy Path ───────────────────────────────────────────────

    [Fact]
    public async Task HandleAsync_NewUser_CreatesProfileSuccessfully()
    {
        // Arrange — no existing profile
        _repoMock.Setup(r => r.GetByUserIdAsync(_userId, default))
                 .ReturnsAsync((AcademicProfile?)null);

        var command = new SetupAcademicProfileCommand(_userId, AcademicYear: 2, Semester: 1);

        // Act
        var result = await _handler.HandleAsync(command);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.ProfileId.Should().NotBeEmpty();
        result.Error.Should().BeNull();

        // Verify AddAsync was called once (new profile)
        _repoMock.Verify(r => r.AddAsync(It.IsAny<AcademicProfile>(), default), Times.Once);
        _repoMock.Verify(r => r.SaveChangesAsync(default), Times.Once);
    }

    [Fact]
    public async Task HandleAsync_ExistingProfile_UpdatesInsteadOfCreating()
    {
        // Arrange — profile already exists
        var existingProfile = AcademicProfile.Create(_userId, academicYear: 1, semester: 1);
        _repoMock.Setup(r => r.GetByUserIdAsync(_userId, default))
                 .ReturnsAsync(existingProfile);

        var command = new SetupAcademicProfileCommand(_userId, AcademicYear: 2, Semester: 2);

        // Act
        var result = await _handler.HandleAsync(command);

        // Assert
        result.IsSuccess.Should().BeTrue();

        // AddAsync should NOT be called — it's an update, not a create
        _repoMock.Verify(r => r.AddAsync(It.IsAny<AcademicProfile>(), default), Times.Never);
        _repoMock.Verify(r => r.SaveChangesAsync(default), Times.Once);
    }

    [Theory]
    [InlineData(1, 1)]
    [InlineData(1, 2)]
    [InlineData(4, 1)]
    [InlineData(4, 2)]
    public async Task HandleAsync_ValidYearAndSemester_Succeeds(int year, int semester)
    {
        _repoMock.Setup(r => r.GetByUserIdAsync(_userId, default))
                 .ReturnsAsync((AcademicProfile?)null);

        var command = new SetupAcademicProfileCommand(_userId, year, semester);
        var result = await _handler.HandleAsync(command);

        result.IsSuccess.Should().BeTrue();
    }

    // ── Validation ───────────────────────────────────────────────

    [Theory]
    [InlineData(0)]   // below minimum
    [InlineData(7)]   // above maximum
    [InlineData(-1)]  // negative
    public async Task HandleAsync_InvalidAcademicYear_ReturnsFailureResult(int invalidYear)
    {
        _repoMock.Setup(r => r.GetByUserIdAsync(_userId, default))
                 .ReturnsAsync((AcademicProfile?)null);

        var command = new SetupAcademicProfileCommand(_userId, invalidYear, Semester: 1);

        var result = await _handler.HandleAsync(command);

        result.IsSuccess.Should().BeFalse();
        result.Error.Should().Contain("year");
    }

    [Theory]
    [InlineData(0)]   // below minimum
    [InlineData(3)]   // above maximum
    [InlineData(-1)]  // negative
    public async Task HandleAsync_InvalidSemester_ReturnsFailureResult(int invalidSemester)
    {
        _repoMock.Setup(r => r.GetByUserIdAsync(_userId, default))
                 .ReturnsAsync((AcademicProfile?)null);

        var command = new SetupAcademicProfileCommand(_userId, AcademicYear: 1, invalidSemester);

        var result = await _handler.HandleAsync(command);

        result.IsSuccess.Should().BeFalse();
        result.Error.Should().Contain("Semester");
    }
}

// ── AcademicProfile Entity Tests ─────────────────────────────────

public class AcademicProfileEntityTests
{
    [Fact]
    public void Create_ValidInputs_ReturnsProfileWithCorrectValues()
    {
        var userId = Guid.NewGuid();

        var profile = AcademicProfile.Create(userId, academicYear: 3, semester: 2);

        profile.UserId.Should().Be(userId);
        profile.AcademicYear.Should().Be(3);
        profile.Semester.Should().Be(2);
        profile.IsSetupComplete.Should().BeTrue();
        profile.Id.Should().NotBe(Guid.Empty);
        profile.UpdatedAt.Should().BeCloseTo(DateTime.UtcNow, precision: TimeSpan.FromSeconds(5));
    }

    [Fact]
    public void Create_GeneratesUniqueIds()
    {
        var userId = Guid.NewGuid();
        var p1 = AcademicProfile.Create(userId, 1, 1);
        var p2 = AcademicProfile.Create(userId, 1, 1);

        p1.Id.Should().NotBe(p2.Id);
    }

    [Fact]
    public void Update_ValidInputs_ChangesYearAndSemester()
    {
        var profile = AcademicProfile.Create(Guid.NewGuid(), academicYear: 1, semester: 1);

        profile.Update(academicYear: 3, semester: 2);

        profile.AcademicYear.Should().Be(3);
        profile.Semester.Should().Be(2);
    }

    [Fact]
    public void Update_InvalidYear_ThrowsArgumentException()
    {
        var profile = AcademicProfile.Create(Guid.NewGuid(), 1, 1);

        var act = () => profile.Update(academicYear: 99, semester: 1);

        act.Should().Throw<ArgumentException>();
    }
}

