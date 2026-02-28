using Moq;
using FluentAssertions;
using StudentWorkload.Application.Modules.Users.Commands.RegisterUser;
using StudentWorkload.Domain.Modules.Users.Repositories;
using StudentWorkload.Domain.Modules.Users.Entities;
 
namespace StudentWorkload.UnitTests;
 
public class RegisterUserCommandHandlerTests
{
    private readonly Mock<IUserRepository> _mockRepo;
    private readonly RegisterUserCommandHandler _handler;
 
    public RegisterUserCommandHandlerTests()
    {
        _mockRepo = new Mock<IUserRepository>();
        _handler = new RegisterUserCommandHandler(_mockRepo.Object);
    }
 
    [Fact]
    public async Task HandleAsync_ValidCommand_ReturnsSuccess()
    {
        // Arrange
        var command = new RegisterUserCommand(
            "test@example.com", "Password123!", "John", "Doe", "Student");
 
        _mockRepo.Setup(r => r.ExistsByEmailAsync(command.Email, default))
            .ReturnsAsync(false);
        _mockRepo.Setup(r => r.AddAsync(It.IsAny<User>(), default))
            .Returns(Task.CompletedTask);
        _mockRepo.Setup(r => r.SaveChangesAsync(default))
            .Returns(Task.CompletedTask);
 
        // Act
        var result = await _handler.HandleAsync(command);
 
        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Email.Should().Be("test@example.com");
        result.UserId.Should().NotBeNull();
    }
 
    [Fact]
    public async Task HandleAsync_DuplicateEmail_ReturnsFailure()
    {
        // Arrange
        var command = new RegisterUserCommand(
            "existing@example.com", "Password123!", "Jane", "Doe");
 
        _mockRepo.Setup(r => r.ExistsByEmailAsync(command.Email, default))
            .ReturnsAsync(true); // Email already exists
 
        // Act
        var result = await _handler.HandleAsync(command);
 
        // Assert
        result.IsSuccess.Should().BeFalse();
        result.ErrorMessage.Should().Contain("already registered");
        _mockRepo.Verify(r => r.AddAsync(It.IsAny<User>(), default), Times.Never);
    }
 
    [Fact]
    public void Email_InvalidFormat_ThrowsArgumentException()
    {
        // Arrange & Act & Assert
        var act = () => StudentWorkload.Domain.Modules.Users.ValueObjects.Email.Create("not-an-email");
        act.Should().Throw<ArgumentException>().WithMessage("*valid email*");
    }
}
