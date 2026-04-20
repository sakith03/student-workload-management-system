using Moq;
using FluentAssertions;
using StudentWorkload.Application.Modules.Chatbot.Queries.GetChatHistory;
using StudentWorkload.Domain.Modules.Chatbot.Entities;
using StudentWorkload.Domain.Modules.Chatbot.Repositories;

namespace StudentWorkload.UnitTests;

public class GetChatHistoryQueryHandlerTests
{
    private readonly Mock<IChatMessageRepository> _mockRepo;
    private readonly GetChatHistoryQueryHandler _handler;

    public GetChatHistoryQueryHandlerTests()
    {
        _mockRepo = new Mock<IChatMessageRepository>();
        _handler = new GetChatHistoryQueryHandler(_mockRepo.Object);
    }

    [Fact]
    public async Task HandleAsync_ReturnsMappedMessages()
    {
        // Arrange
        var sessionId = Guid.NewGuid();
        var messages = new List<ChatMessage>
        {
            ChatMessage.Create(sessionId, "user", "Hello"),
            ChatMessage.Create(sessionId, "ai", "Hi there!")
        };

        _mockRepo.Setup(r => r.GetBySessionIdAsync(sessionId, It.IsAny<CancellationToken>()))
                 .ReturnsAsync(messages);

        // Act
        var result = await _handler.HandleAsync(sessionId);

        // Assert
        result.Should().HaveCount(2);
        var first = result.First();
        first.Sender.Should().Be("user");
        first.MessageText.Should().Be("Hello");
        first.SentAt.Should().Be(messages[0].SentAt);

        var second = result.Last();
        second.Sender.Should().Be("ai");
        second.MessageText.Should().Be("Hi there!");
        second.SentAt.Should().Be(messages[1].SentAt);
    }

    [Fact]
    public async Task HandleAsync_WhenNoMessages_ReturnsEmpty()
    {
        // Arrange
        var sessionId = Guid.NewGuid();
        _mockRepo.Setup(r => r.GetBySessionIdAsync(sessionId, It.IsAny<CancellationToken>()))
                 .ReturnsAsync(new List<ChatMessage>());

        // Act
        var result = await _handler.HandleAsync(sessionId);

        // Assert
        result.Should().BeEmpty();
    }
}