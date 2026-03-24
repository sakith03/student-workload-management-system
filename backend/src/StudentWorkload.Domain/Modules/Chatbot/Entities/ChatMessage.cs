namespace StudentWorkload.Domain.Modules.Chatbot.Entities;

public class ChatMessage
{
    public Guid Id { get; private set; }
    public Guid SessionId { get; private set; }  // FK to ChatSession
    public string Sender { get; private set; } = string.Empty;  // "user" or "ai"
    public string MessageText { get; private set; } = string.Empty;
    public DateTime SentAt { get; private set; }

    private ChatMessage() { }

    public static ChatMessage Create(Guid sessionId, string sender, string messageText)
    {
        if (sessionId == Guid.Empty)
            throw new ArgumentException("SessionId is required.");
        if (sender != "user" && sender != "ai")
            throw new ArgumentException("Sender must be 'user' or 'ai'.");
        if (string.IsNullOrWhiteSpace(messageText))
            throw new ArgumentException("Message text cannot be empty.");

        return new ChatMessage
        {
            Id = Guid.NewGuid(),
            SessionId = sessionId,
            Sender = sender,
            MessageText = messageText.Trim(),
            SentAt = DateTime.UtcNow
        };
    }
}