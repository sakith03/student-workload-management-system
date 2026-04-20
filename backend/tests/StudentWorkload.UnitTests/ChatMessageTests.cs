using FluentAssertions;
using StudentWorkload.Domain.Modules.Chatbot.Entities;

namespace StudentWorkload.UnitTests;

public class ChatMessageTests
{
    [Fact]
    public void Create_WithValidData_CreatesMessage()
    {
        // Arrange
        var sessionId = Guid.NewGuid();
        var sender = "user";
        var messageText = "Hello world";

        // Act
        var message = ChatMessage.Create(sessionId, sender, messageText);

        // Assert
        message.Id.Should().NotBeEmpty();
        message.SessionId.Should().Be(sessionId);
        message.Sender.Should().Be(sender);
        message.MessageText.Should().Be(messageText);
        message.SentAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(1));
    }

    [Fact]
    public void Create_WithEmptySessionId_ThrowsArgumentException()
    {
        // Act
        var act = () => ChatMessage.Create(Guid.Empty, "user", "Hello");

        // Assert
        act.Should().Throw<ArgumentException>()
           .WithMessage("SessionId is required.");
    }

    [Fact]
    public void Create_WithInvalidSender_ThrowsArgumentException()
    {
        // Act
        var act = () => ChatMessage.Create(Guid.NewGuid(), "invalid", "Hello");

        // Assert
        act.Should().Throw<ArgumentException>()
           .WithMessage("Sender must be 'user' or 'ai'.");
    }

    [Fact]
    public void Create_WithEmptyMessageText_ThrowsArgumentException()
    {
        // Act
        var act = () => ChatMessage.Create(Guid.NewGuid(), "user", "");

        // Assert
        act.Should().Throw<ArgumentException>()
           .WithMessage("Message text cannot be empty.");
    }

    [Fact]
    public void Create_WithWhitespaceMessageText_ThrowsArgumentException()
    {
        // Act
        var act = () => ChatMessage.Create(Guid.NewGuid(), "user", "   ");

        // Assert
        act.Should().Throw<ArgumentException>()
           .WithMessage("Message text cannot be empty.");
    }

    [Fact]
    public void Create_TrimsMessageText()
    {
        // Act
        var message = ChatMessage.Create(Guid.NewGuid(), "user", "  Hello  ");

        // Assert
        message.MessageText.Should().Be("Hello");
    }
}