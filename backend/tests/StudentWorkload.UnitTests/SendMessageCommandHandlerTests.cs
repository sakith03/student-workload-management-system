using Moq;
using FluentAssertions;
using System.Net;
using System.Net.Http;
using System.Threading;
using System.Threading.Tasks;
using StudentWorkload.Application.Modules.Chatbot.Commands.SendMessage;
using StudentWorkload.Domain.Modules.Chatbot.Entities;
using StudentWorkload.Domain.Modules.Chatbot.Repositories;

namespace StudentWorkload.UnitTests;

public class SendMessageCommandHandlerTests
{
    private readonly Mock<IChatSessionRepository> _mockSessionRepo;
    private readonly Mock<IChatMessageRepository> _mockMessageRepo;
    private readonly string _apiKey = "test-api-key";

    public SendMessageCommandHandlerTests()
    {
        _mockSessionRepo = new Mock<IChatSessionRepository>();
        _mockMessageRepo = new Mock<IChatMessageRepository>();
    }

    [Fact]
    public async Task HandleAsync_WhenSessionNotFound_ReturnsNotFoundError()
    {
        var httpClient = new HttpClient(new FakeHttpMessageHandler((request, ct) =>
            Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK))));
        var handler = new SendMessageCommandHandler(_mockSessionRepo.Object, _mockMessageRepo.Object, httpClient, _apiKey);
        var sessionId = Guid.NewGuid();
        var command = new SendMessageCommand(sessionId, "Hello");

        _mockSessionRepo.Setup(r => r.GetByIdAsync(sessionId, It.IsAny<CancellationToken>()))
                        .ReturnsAsync((ChatSession?)null);

        var result = await handler.HandleAsync(command);

        result.IsSuccess.Should().BeFalse();
        result.AiResponse.Should().BeNull();
        result.Timestamp.Should().BeNull();
        result.Error.Should().Be("Chat session not found.");

        _mockMessageRepo.Verify(r => r.AddAsync(It.IsAny<ChatMessage>(), It.IsAny<CancellationToken>()), Times.Never);
        _mockMessageRepo.Verify(r => r.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task HandleAsync_WhenSessionInactive_ReturnsInactiveError()
    {
        var httpClient = new HttpClient(new FakeHttpMessageHandler((request, ct) =>
            Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK))));
        var handler = new SendMessageCommandHandler(_mockSessionRepo.Object, _mockMessageRepo.Object, httpClient, _apiKey);
        var sessionId = Guid.NewGuid();
        var command = new SendMessageCommand(sessionId, "Hello");
        var session = ChatSession.Create(Guid.NewGuid(), Guid.NewGuid(), "TestModule");
        session.Deactivate();

        _mockSessionRepo.Setup(r => r.GetByIdAsync(sessionId, It.IsAny<CancellationToken>()))
                        .ReturnsAsync(session);

        var result = await handler.HandleAsync(command);

        result.IsSuccess.Should().BeFalse();
        result.AiResponse.Should().BeNull();
        result.Timestamp.Should().BeNull();
        result.Error.Should().Be("Chat session is no longer active.");

        _mockMessageRepo.Verify(r => r.AddAsync(It.IsAny<ChatMessage>(), It.IsAny<CancellationToken>()), Times.Never);
        _mockMessageRepo.Verify(r => r.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task HandleAsync_WhenGeminiReturnsErrorStatus_ReturnsAiFailure()
    {
        var httpClient = new HttpClient(new FakeHttpMessageHandler((request, ct) =>
            Task.FromResult(new HttpResponseMessage(HttpStatusCode.InternalServerError))));
        var handler = new SendMessageCommandHandler(_mockSessionRepo.Object, _mockMessageRepo.Object, httpClient, _apiKey);
        var sessionId = Guid.NewGuid();
        var command = new SendMessageCommand(sessionId, "Hello");
        var session = ChatSession.Create(Guid.NewGuid(), Guid.NewGuid(), "TestModule");

        _mockSessionRepo.Setup(r => r.GetByIdAsync(sessionId, It.IsAny<CancellationToken>()))
                        .ReturnsAsync(session);
        _mockMessageRepo.Setup(r => r.AddAsync(It.IsAny<ChatMessage>(), It.IsAny<CancellationToken>()))
                        .Returns(Task.CompletedTask);
        _mockMessageRepo.Setup(r => r.SaveChangesAsync(It.IsAny<CancellationToken>()))
                        .Returns(Task.CompletedTask);

        var result = await handler.HandleAsync(command);

        result.IsSuccess.Should().BeFalse();
        result.AiResponse.Should().BeNull();
        result.Timestamp.Should().BeNull();
        result.Error.Should().Be("Failed to get response from AI. Please try again.");

        _mockMessageRepo.Verify(r => r.AddAsync(It.Is<ChatMessage>(m => m.Sender == "user" && m.MessageText == "Hello"), It.IsAny<CancellationToken>()), Times.Once);
        _mockMessageRepo.Verify(r => r.AddAsync(It.Is<ChatMessage>(m => m.Sender == "ai"), It.IsAny<CancellationToken>()), Times.Never);
        _mockMessageRepo.Verify(r => r.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task HandleAsync_WhenGeminiReturnsSuccess_SavesUserAndAiMessages()
    {
        var jsonResponse = "{\n  \"candidates\": [\n    {\n      \"content\": {\n        \"parts\": [\n          { \"text\": \"Hello from AI\" }\n        ]\n      }\n    }\n  ]\n}";

        var httpClient = new HttpClient(new FakeHttpMessageHandler((request, ct) =>
            Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent(jsonResponse)
            })));

        var handler = new SendMessageCommandHandler(_mockSessionRepo.Object, _mockMessageRepo.Object, httpClient, _apiKey);
        var sessionId = Guid.NewGuid();
        var command = new SendMessageCommand(sessionId, "Hello");
        var session = ChatSession.Create(Guid.NewGuid(), Guid.NewGuid(), "TestModule");

        _mockSessionRepo.Setup(r => r.GetByIdAsync(sessionId, It.IsAny<CancellationToken>()))
                        .ReturnsAsync(session);
        _mockMessageRepo.Setup(r => r.AddAsync(It.IsAny<ChatMessage>(), It.IsAny<CancellationToken>()))
                        .Returns(Task.CompletedTask);
        _mockMessageRepo.Setup(r => r.SaveChangesAsync(It.IsAny<CancellationToken>()))
                        .Returns(Task.CompletedTask);

        var result = await handler.HandleAsync(command);

        result.IsSuccess.Should().BeTrue();
        result.AiResponse.Should().Be("Hello from AI");
        result.Timestamp.Should().NotBeNull();
        result.Error.Should().BeNull();

        _mockMessageRepo.Verify(r => r.AddAsync(It.Is<ChatMessage>(m => m.Sender == "user" && m.MessageText == "Hello"), It.IsAny<CancellationToken>()), Times.Once);
        _mockMessageRepo.Verify(r => r.AddAsync(It.Is<ChatMessage>(m => m.Sender == "ai" && m.MessageText == "Hello from AI"), It.IsAny<CancellationToken>()), Times.Once);
        _mockMessageRepo.Verify(r => r.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Exactly(2));
    }

    private class FakeHttpMessageHandler : HttpMessageHandler
    {
        private readonly Func<HttpRequestMessage, CancellationToken, Task<HttpResponseMessage>> _handler;

        public FakeHttpMessageHandler(Func<HttpRequestMessage, CancellationToken, Task<HttpResponseMessage>> handler)
            => _handler = handler;

        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
            => _handler(request, cancellationToken);
    }
}
