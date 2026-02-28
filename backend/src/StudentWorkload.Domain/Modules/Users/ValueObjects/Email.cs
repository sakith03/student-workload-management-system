namespace StudentWorkload.Domain.Modules.Users.ValueObjects;
 
using System.Text.RegularExpressions;
 
public sealed class Email
{
    public string Value { get; }
 
    private Email(string value) => Value = value;
 
    public static Email Create(string email)
    {
        if (string.IsNullOrWhiteSpace(email))
            throw new ArgumentException("Email cannot be empty.");
 
        email = email.Trim().ToLowerInvariant();
 
        if (!Regex.IsMatch(email, @"^[^@\s]+@[^@\s]+\.[^@\s]+$"))
            throw new ArgumentException($"'{email}' is not a valid email address.");
 
        return new Email(email);
    }
 
    // Value equality — two emails with same value are equal
    public override bool Equals(object? obj) =>
        obj is Email other && Value == other.Value;
 
    public override int GetHashCode() => Value.GetHashCode();
    public override string ToString() => Value;
 
    // Implicit conversion to string for convenience
    public static implicit operator string(Email email) => email.Value;
}
