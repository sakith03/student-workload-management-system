using FluentAssertions;
using Moq;
using StudentWorkload.Application.Modules.Academic.Commands.AddSubject;
using StudentWorkload.Domain.Modules.Subjects.Entities;
using StudentWorkload.Domain.Modules.Subjects.Repositories;
using Xunit;

namespace StudentWorkload.UnitTests.Modules.Subjects;

public class AddSubjectCommandHandlerTests
{
    private readonly Mock<ISubjectRepository> _repoMock;
    private readonly AddSubjectCommandHandler _handler;
    private readonly Guid _userId = Guid.NewGuid();
    private readonly Guid _profileId = Guid.NewGuid();

    public AddSubjectCommandHandlerTests()
    {
        _repoMock = new Mock<ISubjectRepository>();
        _handler = new AddSubjectCommandHandler(_repoMock.Object);
    }

    // ── Happy Path ───────────────────────────────────────────────

    [Fact]
    public async Task HandleAsync_ValidCommand_ReturnsSuccessWithSubjectDetails()
    {
        var command = new AddSubjectCommand(
            _userId, _profileId,
            Code: "CSP6001",
            Name: "Cloud Systems Programming",
            CreditHours: 3,
            Color: "#3b82f6");

        var result = await _handler.HandleAsync(command);

        result.IsSuccess.Should().BeTrue();
        result.SubjectId.Should().NotBeNull();
        result.Code.Should().Be("CSP6001");
        result.Name.Should().Be("Cloud Systems Programming");
        result.Color.Should().Be("#3b82f6");
    }

    [Fact]
    public async Task HandleAsync_ValidCommand_CallsRepositoryOnce()
    {
        var command = new AddSubjectCommand(_userId, _profileId, "DSA5002", "Data Structures", 3, null);

        await _handler.HandleAsync(command);

        _repoMock.Verify(r => r.AddAsync(It.IsAny<Subject>(), default), Times.Once);
        _repoMock.Verify(r => r.SaveChangesAsync(default), Times.Once);
    }

    [Fact]
    public async Task HandleAsync_NoColorProvided_StillSucceeds()
    {
        // Color is optional — entity auto-assigns one
        var command = new AddSubjectCommand(_userId, _profileId, "SE6001", "Software Engineering", 3, null);

        var result = await _handler.HandleAsync(command);

        result.IsSuccess.Should().BeTrue();
        result.Color.Should().NotBeNullOrEmpty(); // auto-assigned
    }

    [Fact]
    public async Task HandleAsync_CodeIsNormalisedToUpperCase()
    {
        // Lowercase code should be uppercased by entity
        var command = new AddSubjectCommand(_userId, _profileId, "csp6001", "Cloud Systems", 3, null);

        var result = await _handler.HandleAsync(command);

        result.Code.Should().Be("CSP6001");
    }

    [Theory]
    [InlineData(1)]
    [InlineData(3)]
    [InlineData(6)]
    public async Task HandleAsync_ValidCreditHours_Succeeds(int credits)
    {
        var command = new AddSubjectCommand(_userId, _profileId, "TST0001", "Test Subject", credits, null);
        var result = await _handler.HandleAsync(command);
        result.IsSuccess.Should().BeTrue();
    }

    // ── Validation ───────────────────────────────────────────────

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData(null)]
    public async Task HandleAsync_EmptyCode_ThrowsArgumentException(string? emptyCode)
    {
        var command = new AddSubjectCommand(_userId, _profileId, emptyCode!, "Valid Name", 3, null);

        await FluentActions.Invoking(() => _handler.HandleAsync(command))
            .Should().ThrowAsync<ArgumentException>()
            .WithMessage("*code*");
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData(null)]
    public async Task HandleAsync_EmptyName_ThrowsArgumentException(string? emptyName)
    {
        var command = new AddSubjectCommand(_userId, _profileId, "TST0001", emptyName!, 3, null);

        await FluentActions.Invoking(() => _handler.HandleAsync(command))
            .Should().ThrowAsync<ArgumentException>()
            .WithMessage("*name*");
    }

    [Theory]
    [InlineData(0)]   // below minimum
    [InlineData(7)]   // above maximum
    [InlineData(-1)]  // negative
    public async Task HandleAsync_InvalidCreditHours_ThrowsArgumentException(int invalid)
    {
        var command = new AddSubjectCommand(_userId, _profileId, "TST0001", "Test Subject", invalid, null);

        await FluentActions.Invoking(() => _handler.HandleAsync(command))
            .Should().ThrowAsync<ArgumentException>()
            .WithMessage("*redit*");
    }
}

// ── Subject Entity Tests ─────────────────────────────────────────

public class SubjectEntityTests
{
    private readonly Guid _userId = Guid.NewGuid();
    private readonly Guid _profileId = Guid.NewGuid();

    [Fact]
    public void Create_ValidInputs_ReturnsSubjectWithCorrectValues()
    {
        var subject = Subject.Create(_userId, _profileId, "CSP6001", "Cloud Systems", 3, "#3b82f6");

        subject.UserId.Should().Be(_userId);
        subject.AcademicProfileId.Should().Be(_profileId);
        subject.Code.Should().Be("CSP6001");
        subject.Name.Should().Be("Cloud Systems");
        subject.CreditHours.Should().Be(3);
        subject.Color.Should().Be("#3b82f6");
        subject.IsActive.Should().BeTrue();
        subject.Id.Should().NotBe(Guid.Empty);
    }

    [Fact]
    public void Create_TrimsWhitespaceFromNameAndCode()
    {
        var subject = Subject.Create(_userId, _profileId, "  csp6001  ", "  Cloud Systems  ", 3, null);

        subject.Code.Should().Be("CSP6001");
        subject.Name.Should().Be("Cloud Systems");
    }

    [Fact]
    public void Create_NullColor_AssignsDefaultColor()
    {
        var subject = Subject.Create(_userId, _profileId, "TST001", "Test", 3, null);

        subject.Color.Should().NotBeNullOrEmpty();
        subject.Color.Should().StartWith("#");
    }

    [Fact]
    public void Create_TwoSubjects_HaveDifferentIds()
    {
        var s1 = Subject.Create(_userId, _profileId, "S001", "Subject 1", 3, null);
        var s2 = Subject.Create(_userId, _profileId, "S002", "Subject 2", 3, null);

        s1.Id.Should().NotBe(s2.Id);
    }

    [Fact]
    public void Create_CreatedAtIsSetToNow()
    {
        var before = DateTime.UtcNow;
        var subject = Subject.Create(_userId, _profileId, "TST001", "Test", 3, null);
        var after = DateTime.UtcNow;

        subject.CreatedAt.Should().BeOnOrAfter(before).And.BeOnOrBefore(after);
    }
}