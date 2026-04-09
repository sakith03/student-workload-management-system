namespace StudentWorkload.Domain.Modules.Groups.Entities;

public class GroupSharedFile
{
    public Guid Id { get; private set; }
    public Guid GroupId { get; private set; }
    public Guid UploadedByUserId { get; private set; }
    public string OriginalFileName { get; private set; } = string.Empty;
    public string StoredFileName { get; private set; } = string.Empty;
    public string ContentType { get; private set; } = "application/octet-stream";
    public long SizeBytes { get; private set; }
    public DateTime UploadedAt { get; private set; }

    private GroupSharedFile() { }

    public static GroupSharedFile Create(
        Guid groupId,
        Guid uploadedByUserId,
        string originalFileName,
        string storedFileName,
        string contentType,
        long sizeBytes)
    {
        if (groupId == Guid.Empty)
            throw new ArgumentException("GroupId is required.", nameof(groupId));
        if (uploadedByUserId == Guid.Empty)
            throw new ArgumentException("UploadedByUserId is required.", nameof(uploadedByUserId));
        if (string.IsNullOrWhiteSpace(originalFileName))
            throw new ArgumentException("Original file name is required.", nameof(originalFileName));
        if (string.IsNullOrWhiteSpace(storedFileName))
            throw new ArgumentException("Stored file name is required.", nameof(storedFileName));
        if (sizeBytes < 0)
            throw new ArgumentException("File size cannot be negative.", nameof(sizeBytes));

        return new GroupSharedFile
        {
            Id = Guid.NewGuid(),
            GroupId = groupId,
            UploadedByUserId = uploadedByUserId,
            OriginalFileName = originalFileName.Trim(),
            StoredFileName = storedFileName.Trim(),
            ContentType = string.IsNullOrWhiteSpace(contentType) ? "application/octet-stream" : contentType.Trim(),
            SizeBytes = sizeBytes,
            UploadedAt = DateTime.UtcNow
        };
    }
}
