// FILE PATH:
// backend/src/StudentWorkload.Infrastructure/Services/EmailService.cs

namespace StudentWorkload.Infrastructure.Services;

using System.Net;
using System.Net.Mail;
using Microsoft.Extensions.Configuration;
using StudentWorkload.Application.Common.Interfaces;

public class EmailService : IEmailService
{
    private readonly IConfiguration _config;

    public EmailService(IConfiguration config)
    {
        _config = config;
    }

    public async Task SendInvitationEmailAsync(
        string toEmail,
        string groupName,
        string inviterName,
        string inviteLink,
        CancellationToken ct = default)
    {
        var emailSettings = _config.GetSection("EmailSettings");
        var host = emailSettings["Host"] ?? throw new Exception("EmailSettings:Host not configured");
        var port = int.Parse(emailSettings["Port"] ?? "587");
        var username = emailSettings["Username"] ?? throw new Exception("EmailSettings:Username not configured");
        var password = emailSettings["Password"] ?? throw new Exception("EmailSettings:Password not configured");
        var fromAddress = emailSettings["From"] ?? username;
        var enableSsl = bool.Parse(emailSettings["EnableSsl"] ?? "true");

        var subject = $"{inviterName} invited you to join \"{groupName}\" on LoadMate";

        var body = BuildEmailBody(inviterName, groupName, inviteLink);

        using var client = new SmtpClient(host, port)
        {
            Credentials = new NetworkCredential(username, password),
            EnableSsl = enableSsl
        };

        var mail = new MailMessage
        {
            From = new MailAddress(fromAddress, "LoadMate"),
            Subject = subject,
            Body = body,
            IsBodyHtml = true
        };
        mail.To.Add(toEmail);

        await client.SendMailAsync(mail, ct);
    }

    private static string BuildEmailBody(string inviterName, string groupName, string inviteLink)
    {
        // Build HTML manually to avoid C# interpolation conflicts with < > in HTML tags
        var sb = new System.Text.StringBuilder();
        sb.Append("<!DOCTYPE html>");
        sb.Append("<html><head><meta charset=\"UTF-8\">");
        sb.Append("<style>");
        sb.Append("body{font-family:'Segoe UI',Arial,sans-serif;background:#f0f4ff;margin:0;padding:0;}");
        sb.Append(".wrapper{max-width:520px;margin:40px auto;background:#fff;border-radius:16px;box-shadow:0 8px 32px rgba(26,58,110,0.10);overflow:hidden;}");
        sb.Append(".header{background:linear-gradient(135deg,#0f2654 0%,#1e4d96 100%);padding:36px 40px 28px;text-align:center;}");
        sb.Append(".logo{font-size:1.6rem;font-weight:700;color:#fff;letter-spacing:-0.03em;}");
        sb.Append(".logo-sub{font-size:0.8rem;color:rgba(255,255,255,0.55);margin-top:2px;}");
        sb.Append(".body{padding:36px 40px;}");
        sb.Append(".greeting{font-size:1.05rem;color:#0f172a;margin-bottom:16px;}");
        sb.Append(".message{color:#475569;font-size:0.92rem;line-height:1.65;margin-bottom:28px;}");
        sb.Append(".btn{display:block;width:fit-content;margin:0 auto 28px;padding:14px 36px;background:linear-gradient(135deg,#1a3a6e,#2563eb);color:#fff;text-decoration:none;border-radius:10px;font-weight:600;font-size:0.95rem;}");
        sb.Append(".note{font-size:0.8rem;color:#94a3b8;text-align:center;margin-top:8px;}");
        sb.Append(".footer{background:#f8faff;padding:18px 40px;text-align:center;font-size:0.78rem;color:#94a3b8;border-top:1px solid #e2e8f0;}");
        sb.Append("</style></head><body>");
        sb.Append("<div class=\"wrapper\">");
        sb.Append("<div class=\"header\">");
        sb.Append("<div class=\"logo\">LoadMate</div>");
        sb.Append("<div class=\"logo-sub\">Student Workload Management System</div>");
        sb.Append("</div>");
        sb.Append("<div class=\"body\">");
        sb.Append("<p class=\"greeting\">You've been invited! &#127881;</p>");
        sb.Append("<p class=\"message\">");
        sb.Append("<strong>" + System.Net.WebUtility.HtmlEncode(inviterName) + "</strong> has invited you to join the workspace ");
        sb.Append("<strong>&ldquo;" + System.Net.WebUtility.HtmlEncode(groupName) + "&rdquo;</strong> on LoadMate.<br><br>");
        sb.Append("Click the button below to accept your invitation and get started. ");
        sb.Append("This link is valid for <strong>7 days</strong>.");
        sb.Append("</p>");
        sb.Append("<a href=\"" + inviteLink + "\" class=\"btn\">Accept Invitation</a>");
        sb.Append("<p class=\"note\">Or copy this link: " + System.Net.WebUtility.HtmlEncode(inviteLink) + "</p>");
        sb.Append("</div>");
        sb.Append("<div class=\"footer\">If you didn't expect this invitation, you can safely ignore this email.</div>");
        sb.Append("</div>");
        sb.Append("</body></html>");
        return sb.ToString();
    }
}