using FluentAssertions;
using Moq;
using StudentWorkload.Application.Modules.Groups.Commands.CreateGroup;
using StudentWorkload.Domain.Modules.Groups.Entities;
using StudentWorkload.Domain.Modules.Groups.Repositories;
using Xunit;

namespace StudentWorkload.UnitTests.Modules.Groups;

public class CreateGroupCommandHandlerTests
{
    private readonly Mock<IGroupRepository> _repoMock;
    private readonly CreateGroupCommandHandler _handler;
    private readonly Guid _subjectId = Guid.NewGuid();
    private readonly Guid _userId = Guid.NewGuid();

    public CreateGroupCommandHandlerTests()
    {
        _repoMock = new Mock<IGroupRepository>();
        _handler = new CreateGroupCommandHandler(_repoMock.Object);
    }

    // ── Happy Path ───────────────────────────────────────────────

    [Fact]
    public async Task HandleAsync_ValidCommand_ReturnsSuccessWithGroupIdAndInviteCode()
    {
        var command = new CreateGroupCommand(_subjectId, _userId, "Team Alpha", "Our group", 6);

        var result = await _handler.HandleAsync(command);

        result.IsSuccess.Should().BeTrue();
        result.GroupId.Should().NotBeNull();
        result.InviteCode.Should().NotBeNullOrEmpty();
        result.Error.Should().BeNull();
    }

    [Fact]
    public async Task HandleAsync_ValidCommand_CallsRepositoryOnce()
    {
        var command = new CreateGroupCommand(_subjectId, _userId, "Team Beta", "Description", 4);

        await _handler.HandleAsync(command);

        _repoMock.Verify(r => r.AddAsync(It.IsAny<Group>(), default), Times.Once);
        _repoMock.Verify(r => r.SaveChangesAsync(default), Times.Once);
    }

    [Fact]
    public async Task HandleAsync_GeneratedInviteCode_IsSixCharacters()
    {
        var command = new CreateGroupCommand(_subjectId, _userId, "Team Gamma", "", 6);

        var result = await _handler.HandleAsync(command);

        result.InviteCode.Should().HaveLength(6);
    }

    [Fact]
    public async Task HandleAsync_TwoGroups_HaveDifferentInviteCodes()
    {
        var cmd1 = new CreateGroupCommand(_subjectId, _userId, "Team A", "", 6);
        var cmd2 = new CreateGroupCommand(_subjectId, _userId, "Team B", "", 6);

        var r1 = await _handler.HandleAsync(cmd1);
        var r2 = await _handler.HandleAsync(cmd2);

        // Codes should almost certainly be different (probabilistic but valid test)
        // Run enough times it's statistically guaranteed
        r1.InviteCode.Should().NotBe(r2.InviteCode);
    }

    [Theory]
    [InlineData(2)]
    [InlineData(5)]
    [InlineData(10)]
    public async Task HandleAsync_ValidMaxMembers_Succeeds(int maxMembers)
    {
        var command = new CreateGroupCommand(_subjectId, _userId, "Team", "", maxMembers);
        var result = await _handler.HandleAsync(command);
        result.IsSuccess.Should().BeTrue();
    }

    // ── Validation ───────────────────────────────────────────────

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData(null)]
    public async Task HandleAsync_EmptyGroupName_ThrowsArgumentException(string? emptyName)
    {
        var command = new CreateGroupCommand(_subjectId, _userId, emptyName!, "desc", 6);

        await FluentActions.Invoking(() => _handler.HandleAsync(command))
            .Should().ThrowAsync<ArgumentException>()
            .WithMessage("*name*");
    }

    [Theory]
    [InlineData(1)]   // below minimum
    [InlineData(11)]  // above maximum
    [InlineData(0)]   // zero
    public async Task HandleAsync_InvalidMaxMembers_ThrowsArgumentException(int invalid)
    {
        var command = new CreateGroupCommand(_subjectId, _userId, "Team", "desc", invalid);

        await FluentActions.Invoking(() => _handler.HandleAsync(command))
            .Should().ThrowAsync<ArgumentException>()
            .WithMessage("*embers*");
    }
}

// ── Group Entity Tests ───────────────────────────────────────────

public class GroupEntityTests
{
    private readonly Guid _subjectId = Guid.NewGuid();
    private readonly Guid _userId = Guid.NewGuid();

    [Fact]
    public void Create_ValidInputs_ReturnsGroupWithCorrectValues()
    {
        var group = Group.Create(_subjectId, _userId, "Team Alpha", "Working on project", 6);

        group.SubjectId.Should().Be(_subjectId);
        group.CreatedByUserId.Should().Be(_userId);
        group.Name.Should().Be("Team Alpha");
        group.Description.Should().Be("Working on project");
        group.MaxMembers.Should().Be(6);
        group.IsActive.Should().BeTrue();
        group.Id.Should().NotBe(Guid.Empty);
    }

    [Fact]
    public void Create_GeneratesNonEmptyInviteCode()
    {
        var group = Group.Create(_subjectId, _userId, "Team", "", 6);

        group.InviteCode.Should().NotBeNullOrEmpty();
        group.InviteCode.Should().HaveLength(6);
    }

    [Fact]
    public void Create_InviteCodeIsAlphanumericUpperCase()
    {
        var group = Group.Create(_subjectId, _userId, "Team", "", 6);

        group.InviteCode.Should().MatchRegex("^[A-Z0-9]{6}$");
    }

    [Fact]
    public void Create_NullDescription_SetsEmptyString()
    {
        var group = Group.Create(_subjectId, _userId, "Team", null!, 6);

        group.Description.Should().Be(string.Empty);
    }

    [Fact]
    public void Create_TrimsWhitespaceFromName()
    {
        var group = Group.Create(_subjectId, _userId, "  Team Alpha  ", "", 6);

        group.Name.Should().Be("Team Alpha");
    }

    [Fact]
    public void Create_TwoGroups_HaveDifferentIds()
    {
        var g1 = Group.Create(_subjectId, _userId, "Team A", "", 6);
        var g2 = Group.Create(_subjectId, _userId, "Team B", "", 6);

        g1.Id.Should().NotBe(g2.Id);
    }

    [Fact]
    public void Create_CreatedAtIsSetToNow()
    {
        var before = DateTime.UtcNow;
        var group = Group.Create(_subjectId, _userId, "Team", "", 6);
        var after = DateTime.UtcNow;

        group.CreatedAt.Should().BeOnOrAfter(before).And.BeOnOrBefore(after);
    }

    [Theory]
    [InlineData("")]
    [InlineData(null)]
    public void Create_EmptyName_ThrowsArgumentException(string? name)
    {
        var act = () => Group.Create(_subjectId, _userId, name!, "", 6);
        act.Should().Throw<ArgumentException>().WithMessage("*name*");
    }

    [Theory]
    [InlineData(1)]
    [InlineData(11)]
    public void Create_InvalidMaxMembers_ThrowsArgumentException(int invalid)
    {
        var act = () => Group.Create(_subjectId, _userId, "Team", "", invalid);
        act.Should().Throw<ArgumentException>().WithMessage("*embers*");
    }

    [Fact]
    public void UpdateDetails_ChangesNameDescriptionAndMaxMembers()
    {
        var group = Group.Create(_subjectId, _userId, "Old", "d", 6);
        var newSubject = Guid.NewGuid();

        group.UpdateDetails("New Name", "New desc", 8);
        group.ChangeSubject(newSubject);

        group.Name.Should().Be("New Name");
        group.Description.Should().Be("New desc");
        group.MaxMembers.Should().Be(8);
        group.SubjectId.Should().Be(newSubject);
    }

    [Fact]
    public void Deactivate_SetsInactive()
    {
        var group = Group.Create(_subjectId, _userId, "Team", "", 6);
        group.Deactivate();
        group.IsActive.Should().BeFalse();
    }

    [Fact]
    public void UpdateDetails_InvalidMaxMembers_Throws()
    {
        var group = Group.Create(_subjectId, _userId, "Team", "", 6);
        var act = () => group.UpdateDetails("Team", "", 1);
        act.Should().Throw<ArgumentException>();
    }
}
