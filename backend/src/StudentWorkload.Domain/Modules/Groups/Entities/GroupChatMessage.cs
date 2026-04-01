namespace StudentWorkload.Domain.Modules.Groups.Entities;

public class GroupChatMessage
{
    public Guid Id { get; private set; }
    public Guid GroupId { get; private set; }
    public Guid SenderUserId { get; private set; }
    public string SenderName { get; private set; } = string.Empty;
    public string MessageText { get; private set; } = string.Empty;
    public DateTime SentAt { get; private set; }

    private GroupChatMessage() { }

    public static GroupChatMessage Create(Guid groupId, Guid senderUserId, string senderName, string messageText)
    {
        if (groupId == Guid.Empty)
            throw new ArgumentException("GroupId is required.", nameof(groupId));
        if (senderUserId == Guid.Empty)
            throw new ArgumentException("SenderUserId is required.", nameof(senderUserId));
        if (string.IsNullOrWhiteSpace(senderName))
            throw new ArgumentException("Sender name is required.", nameof(senderName));
        if (string.IsNullOrWhiteSpace(messageText))
            throw new ArgumentException("Message text cannot be empty.", nameof(messageText));

        return new GroupChatMessage
        {
            Id = Guid.NewGuid(),
            GroupId = groupId,
            SenderUserId = senderUserId,
            SenderName = senderName.Trim(),
            MessageText = messageText.Trim(),
            SentAt = DateTime.UtcNow
        };
    }
}
