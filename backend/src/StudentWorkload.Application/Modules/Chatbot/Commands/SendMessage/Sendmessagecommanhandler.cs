namespace StudentWorkload.Application.Modules.Chatbot.Commands.SendMessage;

using System.Net.Http.Json;
using System.Text.Json;
using StudentWorkload.Domain.Modules.Chatbot.Entities;
using StudentWorkload.Domain.Modules.Chatbot.Repositories;

public class SendMessageCommandHandler
{
    private readonly IChatSessionRepository _sessionRepo;
    private readonly IChatMessageRepository _messageRepo;
    private readonly HttpClient _httpClient;
    private readonly string _geminiApiKey;

    public SendMessageCommandHandler(
        IChatSessionRepository sessionRepo,
        IChatMessageRepository messageRepo,
        HttpClient httpClient,
        string geminiApiKey)
    {
        _sessionRepo = sessionRepo;
        _messageRepo = messageRepo;
        _httpClient = httpClient;
        _geminiApiKey = geminiApiKey;
    }

    public async Task<SendMessageResult> HandleAsync(
        SendMessageCommand command,
        CancellationToken ct = default)
    {
        // 1. Validate session exists
        var session = await _sessionRepo.GetByIdAsync(command.SessionId, ct);
        if (session is null)
            return new SendMessageResult(false, null, null, "Chat session not found.");

        if (!session.IsActive)
            return new SendMessageResult(false, null, null, "Chat session is no longer active.");

        // 2. Save user message to DB
        var userMsg = ChatMessage.Create(command.SessionId, "user", command.UserMessage);
        await _messageRepo.AddAsync(userMsg, ct);
        await _messageRepo.SaveChangesAsync(ct);

        // 3. Call Gemini API directly
        var aiResponseText = await CallGeminiAsync(session.ModuleName, command.UserMessage, ct);
        if (aiResponseText is null)
            return new SendMessageResult(false, null, null, "Failed to get response from AI. Please try again.");

        // 4. Save AI response to DB
        var aiMsg = ChatMessage.Create(command.SessionId, "ai", aiResponseText);
        await _messageRepo.AddAsync(aiMsg, ct);
        await _messageRepo.SaveChangesAsync(ct);

        return new SendMessageResult(true, aiResponseText, aiMsg.SentAt);
    }

    private async Task<string?> CallGeminiAsync(
        string moduleName,
        string userMessage,
        CancellationToken ct)
    {
        var url = $"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={_geminiApiKey}";

        var prompt = $"You are a helpful academic assistant for the '{moduleName}' module. " +
                     $"Answer the following question clearly and concisely, keeping the response relevant to the module. " +
                     $"Question: {userMessage}";

        var requestBody = new
        {
            contents = new[]
            {
                new
                {
                    parts = new[] { new { text = prompt } }
                }
            }
        };

        try
        {
            var response = await _httpClient.PostAsJsonAsync(url, requestBody, ct);
            if (!response.IsSuccessStatusCode) return null;

            var json = await response.Content.ReadAsStringAsync(ct);
            using var doc = JsonDocument.Parse(json);

            // Gemini response path: candidates[0].content.parts[0].text
            return doc.RootElement
                .GetProperty("candidates")[0]
                .GetProperty("content")
                .GetProperty("parts")[0]
                .GetProperty("text")
                .GetString();
        }
        catch
        {
            return null;
        }
    }
}