using FluentAssertions;
using StudentWorkload.Domain.Modules.Chatbot.Entities;

namespace StudentWorkload.UnitTests;

public class ChatSessionTests
{
    [Fact]
    public void Create_WithValidData_CreatesSession()
    {
        // Arrange
        var groupId = Guid.NewGuid();
        var userId = Guid.NewGuid();
        var moduleName = "TestModule";

        // Act
        var session = ChatSession.Create(groupId, userId, moduleName);

        // Assert
        session.Id.Should().NotBeEmpty();
        session.GroupId.Should().Be(groupId);
        session.UserId.Should().Be(userId);
        session.ModuleName.Should().Be(moduleName);
        session.CreatedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(1));
        session.IsActive.Should().BeTrue();
    }

    [Fact]
    public void Create_WithEmptyGroupId_ThrowsArgumentException()
    {
        // Act
        var act = () => ChatSession.Create(Guid.Empty, Guid.NewGuid(), "Module");

        // Assert
        act.Should().Throw<ArgumentException>()
           .WithMessage("GroupId is required.");
    }

    [Fact]
    public void Create_WithEmptyUserId_ThrowsArgumentException()
    {
        // Act
        var act = () => ChatSession.Create(Guid.NewGuid(), Guid.Empty, "Module");

        // Assert
        act.Should().Throw<ArgumentException>()
           .WithMessage("UserId is required.");
    }

    [Fact]
    public void Create_WithEmptyModuleName_ThrowsArgumentException()
    {
        // Act
        var act = () => ChatSession.Create(Guid.NewGuid(), Guid.NewGuid(), "");

        // Assert
        act.Should().Throw<ArgumentException>()
           .WithMessage("Module name is required.");
    }

    [Fact]
    public void Create_WithWhitespaceModuleName_ThrowsArgumentException()
    {
        // Act
        var act = () => ChatSession.Create(Guid.NewGuid(), Guid.NewGuid(), "   ");

        // Assert
        act.Should().Throw<ArgumentException>()
           .WithMessage("Module name is required.");
    }

    [Fact]
    public void Create_TrimsModuleName()
    {
        // Act
        var session = ChatSession.Create(Guid.NewGuid(), Guid.NewGuid(), "  Module  ");

        // Assert
        session.ModuleName.Should().Be("Module");
    }

    [Fact]
    public void Deactivate_SetsIsActiveToFalse()
    {
        // Arrange
        var session = ChatSession.Create(Guid.NewGuid(), Guid.NewGuid(), "Module");

        // Act
        session.Deactivate();

        // Assert
        session.IsActive.Should().BeFalse();
    }
}