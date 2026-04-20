using Moq;
using FluentAssertions;
using StudentWorkload.Application.Modules.Groups.Commands.AcceptInvitation;
using StudentWorkload.Domain.Modules.Academic.Entities;
using StudentWorkload.Domain.Modules.Academic.Repositories;
using StudentWorkload.Domain.Modules.Groups.Entities;
using StudentWorkload.Domain.Modules.Groups.Repositories;
using StudentWorkload.Domain.Modules.Subjects.Entities;
using StudentWorkload.Domain.Modules.Subjects.Repositories;

namespace StudentWorkload.UnitTests;

public class AcceptInvitationCommandHandlerTests
{
    private readonly Mock<IGroupInvitationRepository> _mockInvitationRepo;
    private readonly Mock<IGroupRepository> _mockGroupRepo;
    private readonly Mock<ISubjectRepository> _mockSubjectRepo;
    private readonly Mock<IAcademicProfileRepository> _mockProfileRepo;
    private readonly AcceptInvitationCommandHandler _handler;

    public AcceptInvitationCommandHandlerTests()
    {
        _mockInvitationRepo = new Mock<IGroupInvitationRepository>();
        _mockGroupRepo = new Mock<IGroupRepository>();
        _mockSubjectRepo = new Mock<ISubjectRepository>();
        _mockProfileRepo = new Mock<IAcademicProfileRepository>();
        _handler = new AcceptInvitationCommandHandler(
            _mockInvitationRepo.Object,
            _mockGroupRepo.Object,
            _mockSubjectRepo.Object,
            _mockProfileRepo.Object);
    }

    [Fact]
    public async Task HandleAsync_WhenInvitationNotFound_ReturnsError()
    {
        // Arrange
        var command = new AcceptInvitationCommand("invalid-token", Guid.NewGuid());

        _mockInvitationRepo.Setup(r => r.GetByTokenAsync(command.Token, It.IsAny<CancellationToken>()))
                           .ReturnsAsync((GroupInvitation?)null);

        // Act
        var result = await _handler.HandleAsync(command);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.GroupId.Should().BeNull();
        result.Error.Should().Be("Invitation not found.");
    }

    [Fact]
    public async Task HandleAsync_WhenInvitationInvalid_ReturnsError()
    {
        // Arrange
        var command = new AcceptInvitationCommand("expired-token", Guid.NewGuid());
        var invitation = GroupInvitation.Create(Guid.NewGuid(), Guid.NewGuid(), "test@example.com");
        invitation.Accept(); // Make it invalid

        _mockInvitationRepo.Setup(r => r.GetByTokenAsync(command.Token, It.IsAny<CancellationToken>()))
                           .ReturnsAsync(invitation);

        // Act
        var result = await _handler.HandleAsync(command);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.GroupId.Should().BeNull();
        result.Error.Should().Be("Invitation has expired or has already been used.");
    }

    [Fact]
    public async Task HandleAsync_WhenGroupNotFound_ReturnsError()
    {
        // Arrange
        var command = new AcceptInvitationCommand("valid-token", Guid.NewGuid());
        var invitation = GroupInvitation.Create(Guid.NewGuid(), Guid.NewGuid(), "test@example.com");

        _mockInvitationRepo.Setup(r => r.GetByTokenAsync(command.Token, It.IsAny<CancellationToken>()))
                           .ReturnsAsync(invitation);
        _mockGroupRepo.Setup(r => r.GetByIdAsync(invitation.GroupId, It.IsAny<CancellationToken>()))
                      .ReturnsAsync((Group?)null);

        // Act
        var result = await _handler.HandleAsync(command);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.GroupId.Should().BeNull();
        result.Error.Should().Be("The group no longer exists.");
    }

    [Fact]
    public async Task HandleAsync_WhenUserAlreadyMember_ReturnsSuccess()
    {
        // Arrange
        var command = new AcceptInvitationCommand("valid-token", Guid.NewGuid());
        var invitation = GroupInvitation.Create(Guid.NewGuid(), Guid.NewGuid(), "test@example.com");
        var group = Group.Create(invitation.GroupId, Guid.NewGuid(), "Test Group", "Description", 5);

        _mockInvitationRepo.Setup(r => r.GetByTokenAsync(command.Token, It.IsAny<CancellationToken>()))
                           .ReturnsAsync(invitation);
        _mockGroupRepo.Setup(r => r.GetByIdAsync(invitation.GroupId, It.IsAny<CancellationToken>()))
                      .ReturnsAsync(group);
        _mockGroupRepo.Setup(r => r.IsUserMemberAsync(invitation.GroupId, command.UserId, It.IsAny<CancellationToken>()))
                      .ReturnsAsync(true);
        _mockInvitationRepo.Setup(r => r.SaveChangesAsync(It.IsAny<CancellationToken>()))
                           .Returns(Task.CompletedTask);

        // Act
        var result = await _handler.HandleAsync(command);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.GroupId.Should().Be(invitation.GroupId);
        result.Error.Should().BeNull();
        _mockInvitationRepo.Verify(r => r.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task HandleAsync_WhenGroupAtCapacity_ReturnsError()
    {
        // Arrange
        var command = new AcceptInvitationCommand("valid-token", Guid.NewGuid());
        var invitation = GroupInvitation.Create(Guid.NewGuid(), Guid.NewGuid(), "test@example.com");
        var group = Group.Create(invitation.GroupId, Guid.NewGuid(), "Test Group", "Description", 2);
        var members = new List<GroupMember>
        {
            GroupMember.Create(invitation.GroupId, Guid.NewGuid(), GroupRole.Owner),
            GroupMember.Create(invitation.GroupId, Guid.NewGuid(), GroupRole.Member)
        };

        _mockInvitationRepo.Setup(r => r.GetByTokenAsync(command.Token, It.IsAny<CancellationToken>()))
                           .ReturnsAsync(invitation);
        _mockGroupRepo.Setup(r => r.GetByIdAsync(invitation.GroupId, It.IsAny<CancellationToken>()))
                      .ReturnsAsync(group);
        _mockGroupRepo.Setup(r => r.IsUserMemberAsync(invitation.GroupId, command.UserId, It.IsAny<CancellationToken>()))
                      .ReturnsAsync(false);
        _mockGroupRepo.Setup(r => r.GetMembersAsync(invitation.GroupId, It.IsAny<CancellationToken>()))
                      .ReturnsAsync(members);

        // Act
        var result = await _handler.HandleAsync(command);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.GroupId.Should().BeNull();
        result.Error.Should().Be("This group is already at full capacity.");
    }

    [Fact]
    public async Task HandleAsync_WhenSubjectNotFound_ReturnsError()
    {
        // Arrange
        var command = new AcceptInvitationCommand("valid-token", Guid.NewGuid());
        var invitation = GroupInvitation.Create(Guid.NewGuid(), Guid.NewGuid(), "test@example.com");
        var group = Group.Create(invitation.GroupId, Guid.NewGuid(), "Test Group", "Description", 5);

        _mockInvitationRepo.Setup(r => r.GetByTokenAsync(command.Token, It.IsAny<CancellationToken>()))
                           .ReturnsAsync(invitation);
        _mockGroupRepo.Setup(r => r.GetByIdAsync(invitation.GroupId, It.IsAny<CancellationToken>()))
                      .ReturnsAsync(group);
        _mockGroupRepo.Setup(r => r.IsUserMemberAsync(invitation.GroupId, command.UserId, It.IsAny<CancellationToken>()))
                      .ReturnsAsync(false);
        _mockGroupRepo.Setup(r => r.GetMembersAsync(invitation.GroupId, It.IsAny<CancellationToken>()))
                      .ReturnsAsync(new List<GroupMember>());
        _mockSubjectRepo.Setup(r => r.GetByIdAsync(group.SubjectId, It.IsAny<CancellationToken>()))
                        .ReturnsAsync((Subject?)null);

        // Act
        var result = await _handler.HandleAsync(command);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.GroupId.Should().BeNull();
        result.Error.Should().Be("The subject linked to this group no longer exists.");
    }

    [Fact]
    public async Task HandleAsync_WhenSuccessful_AddsUserToGroup()
    {
        // Arrange
        var command = new AcceptInvitationCommand("valid-token", Guid.NewGuid());
        var invitation = GroupInvitation.Create(Guid.NewGuid(), Guid.NewGuid(), "test@example.com");
        var group = Group.Create(invitation.GroupId, Guid.NewGuid(), "Test Group", "Description", 5);
        var subject = Subject.Create(command.UserId, Guid.NewGuid(), "CSP6001", "Computer Science", 3, "Blue");
        var profile = AcademicProfile.Create(command.UserId, 1, 1);

        _mockInvitationRepo.Setup(r => r.GetByTokenAsync(command.Token, It.IsAny<CancellationToken>()))
                           .ReturnsAsync(invitation);
        _mockGroupRepo.Setup(r => r.GetByIdAsync(invitation.GroupId, It.IsAny<CancellationToken>()))
                      .ReturnsAsync(group);
        _mockGroupRepo.Setup(r => r.IsUserMemberAsync(invitation.GroupId, command.UserId, It.IsAny<CancellationToken>()))
                      .ReturnsAsync(false);
        _mockGroupRepo.Setup(r => r.GetMembersAsync(invitation.GroupId, It.IsAny<CancellationToken>()))
                      .ReturnsAsync(new List<GroupMember>());
        _mockSubjectRepo.Setup(r => r.GetByIdAsync(group.SubjectId, It.IsAny<CancellationToken>()))
                        .ReturnsAsync(subject);
        _mockSubjectRepo.Setup(r => r.GetByUserIdAsync(command.UserId, It.IsAny<CancellationToken>()))
                        .ReturnsAsync(new List<Subject>());
        _mockProfileRepo.Setup(r => r.GetByUserIdAsync(command.UserId, It.IsAny<CancellationToken>()))
                        .ReturnsAsync(profile);
        _mockGroupRepo.Setup(r => r.AddMemberAsync(It.IsAny<GroupMember>(), It.IsAny<CancellationToken>()))
                      .Returns(Task.CompletedTask);
        _mockGroupRepo.Setup(r => r.SaveChangesAsync(It.IsAny<CancellationToken>()))
                      .Returns(Task.CompletedTask);
        _mockInvitationRepo.Setup(r => r.SaveChangesAsync(It.IsAny<CancellationToken>()))
                           .Returns(Task.CompletedTask);

        // Act
        var result = await _handler.HandleAsync(command);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.GroupId.Should().Be(invitation.GroupId);
        result.Error.Should().BeNull();
        _mockGroupRepo.Verify(r => r.AddMemberAsync(It.Is<GroupMember>(m =>
            m.GroupId == invitation.GroupId &&
            m.UserId == command.UserId &&
            m.Role == GroupRole.Member), It.IsAny<CancellationToken>()), Times.Once);
        _mockInvitationRepo.Verify(r => r.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
        _mockGroupRepo.Verify(r => r.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }
}