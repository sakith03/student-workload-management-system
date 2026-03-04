using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using StudentWorkload.Application.Common.Interfaces;
using StudentWorkload.Application.Modules.CourseModules.Services;
using StudentWorkload.Domain.Modules.Academic.Repositories;
using StudentWorkload.Domain.Modules.CourseModules.Repositories;
using StudentWorkload.Domain.Modules.Groups.Repositories;
using StudentWorkload.Domain.Modules.Subjects.Repositories;
using StudentWorkload.Domain.Modules.Users.Repositories;
using StudentWorkload.Infrastructure.Data;
using StudentWorkload.Infrastructure.Modules.Academic;
using StudentWorkload.Infrastructure.Modules.CourseModules;
using StudentWorkload.Infrastructure.Modules.Groups;
using StudentWorkload.Infrastructure.Modules.Subjects;
using StudentWorkload.Infrastructure.Modules.Users;
using StudentWorkload.Infrastructure.Services;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// ─── Database Configuration ─────────────────────────
var connectionString =
    Environment.GetEnvironmentVariable("ConnectionStrings__DefaultConnection")
    ?? builder.Configuration.GetConnectionString("DefaultConnection")
    ?? throw new Exception("ConnectionStrings:DefaultConnection not set");

builder.Services.AddDbContext<AppDbContext>(options =>
{
    options.UseSqlServer(connectionString,
        sqlOptions => sqlOptions.EnableRetryOnFailure(
            maxRetryCount: 5,
            maxRetryDelay: TimeSpan.FromSeconds(30),
            errorNumbersToAdd: null));
});

// ─── Dependency Injection ────────────────────────
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<ICourseModuleRepository, CourseModuleRepository>();
builder.Services.AddScoped<ICourseModuleService, CourseModuleService>();
builder.Services.AddScoped<IAcademicProfileRepository, AcademicProfileRepository>();
builder.Services.AddScoped<ISubjectRepository, SubjectRepository>();
builder.Services.AddScoped<IGroupRepository, GroupRepository>();
builder.Services.AddScoped<IGroupInvitationRepository, GroupInvitationRepository>();
builder.Services.AddScoped<IEmailService, EmailService>();
builder.Services.AddScoped<IJwtService, JwtService>();

// ─── JWT Authentication ──────────────────────────
var jwtSection = builder.Configuration.GetSection("JwtSettings");
var jwtSecretKey = jwtSection["Secret"] ?? throw new Exception("JwtSettings:Secret not configured");

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtSection["Issuer"],
            ValidAudience = jwtSection["Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(jwtSecretKey)
            )
        };
    });

builder.Services.AddAuthorization();
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// ─── CORS ─────────────────────────
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
        policy.WithOrigins(
            "http://localhost:5173",
            "http://localhost:3000",
            "https://frontend-loadmate-h5h2gghtascvcnay.centralindia-01.azurewebsites.net" // ✅ your Azure frontend
        )
        .AllowAnyHeader()
        .AllowAnyMethod());
});

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("AllowFrontend");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

// ─── Auto Migrate ─────────────────────────
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    try
    {
        db.Database.Migrate();
    }
    catch (Exception ex)
    {
        var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
        logger.LogError(ex, "Migration failed — app will still start");
    }
}

app.Run();