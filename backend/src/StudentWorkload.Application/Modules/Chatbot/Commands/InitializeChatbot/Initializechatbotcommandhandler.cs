namespace StudentWorkload.Application.Modules.Chatbot.Commands.InitializeChatbot;

using StudentWorkload.Domain.Modules.Chatbot.Entities;
using StudentWorkload.Domain.Modules.Chatbot.Repositories;

public class InitializeChatbotCommandHandler
{
    private readonly IChatSessionRepository _sessionRepo;

    public InitializeChatbotCommandHandler(IChatSessionRepository sessionRepo)
        => _sessionRepo = sessionRepo;

    public async Task<InitializeChatbotResult> HandleAsync(
        InitializeChatbotCommand command,
        CancellationToken ct = default)
    {
        // If a session already exists for this group, return it (don't create duplicate)
        var existing = await _sessionRepo.GetByGroupIdAsync(command.GroupId, ct);
        if (existing is not null)
            return new InitializeChatbotResult(true, existing.Id);

        try
        {
            var session = ChatSession.Create(command.GroupId, command.UserId, command.ModuleName);
            await _sessionRepo.AddAsync(session, ct);
            await _sessionRepo.SaveChangesAsync(ct);
            return new InitializeChatbotResult(true, session.Id);
        }
        catch (ArgumentException ex)
        {
            return new InitializeChatbotResult(false, Guid.Empty, ex.Message);
        }
    }
}