using Moq;
using FluentAssertions;
using StudentWorkload.Application.Modules.Chatbot.Commands.InitializeChatbot;
using StudentWorkload.Domain.Modules.Chatbot.Entities;
using StudentWorkload.Domain.Modules.Chatbot.Repositories;

namespace StudentWorkload.UnitTests;

public class InitializeChatbotCommandHandlerTests
{
    private readonly Mock<IChatSessionRepository> _mockRepo;
    private readonly InitializeChatbotCommandHandler _handler;

    public InitializeChatbotCommandHandlerTests()
    {
        _mockRepo = new Mock<IChatSessionRepository>();
        _handler = new InitializeChatbotCommandHandler(_mockRepo.Object);
    }

    [Fact]
    public async Task HandleAsync_WhenSessionExists_ReturnsExistingSession()
    {
        // Arrange
        var groupId = Guid.NewGuid();
        var userId = Guid.NewGuid();
        var moduleName = "TestModule";
        var command = new InitializeChatbotCommand(groupId, userId, moduleName);
        var existingSession = ChatSession.Create(groupId, userId, moduleName);

        _mockRepo.Setup(r => r.GetByGroupIdAsync(groupId, It.IsAny<CancellationToken>()))
                 .ReturnsAsync(existingSession);

        // Act
        var result = await _handler.HandleAsync(command);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.SessionId.Should().Be(existingSession.Id);
        result.Error.Should().BeNull();
        _mockRepo.Verify(r => r.AddAsync(It.IsAny<ChatSession>(), It.IsAny<CancellationToken>()), Times.Never);
        _mockRepo.Verify(r => r.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task HandleAsync_WhenNoSessionExists_CreatesNewSession()
    {
        // Arrange
        var groupId = Guid.NewGuid();
        var userId = Guid.NewGuid();
        var moduleName = "TestModule";
        var command = new InitializeChatbotCommand(groupId, userId, moduleName);

        _mockRepo.Setup(r => r.GetByGroupIdAsync(groupId, It.IsAny<CancellationToken>()))
                 .ReturnsAsync((ChatSession?)null);
        _mockRepo.Setup(r => r.AddAsync(It.IsAny<ChatSession>(), It.IsAny<CancellationToken>()))
                 .Returns(Task.CompletedTask);
        _mockRepo.Setup(r => r.SaveChangesAsync(It.IsAny<CancellationToken>()))
                 .Returns(Task.CompletedTask);

        // Act
        var result = await _handler.HandleAsync(command);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.SessionId.Should().NotBeEmpty();
        result.Error.Should().BeNull();
        _mockRepo.Verify(r => r.AddAsync(It.Is<ChatSession>(s =>
            s.GroupId == groupId &&
            s.UserId == userId &&
            s.ModuleName == moduleName &&
            s.IsActive == true), It.IsAny<CancellationToken>()), Times.Once);
        _mockRepo.Verify(r => r.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task HandleAsync_WhenCreationFails_ReturnsError()
    {
        // Arrange
        var groupId = Guid.Empty; // Invalid
        var userId = Guid.NewGuid();
        var moduleName = "TestModule";
        var command = new InitializeChatbotCommand(groupId, userId, moduleName);

        _mockRepo.Setup(r => r.GetByGroupIdAsync(groupId, It.IsAny<CancellationToken>()))
                 .ReturnsAsync((ChatSession?)null);

        // Act
        var result = await _handler.HandleAsync(command);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.SessionId.Should().Be(Guid.Empty);
        result.Error.Should().Be("GroupId is required.");
        _mockRepo.Verify(r => r.AddAsync(It.IsAny<ChatSession>(), It.IsAny<CancellationToken>()), Times.Never);
        _mockRepo.Verify(r => r.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Never);
    }
}