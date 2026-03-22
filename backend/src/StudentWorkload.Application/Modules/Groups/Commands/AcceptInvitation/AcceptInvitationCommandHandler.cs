// FILE PATH:
// backend/src/StudentWorkload.Application/Modules/Groups/Commands/AcceptInvitation/AcceptInvitationCommandHandler.cs

namespace StudentWorkload.Application.Modules.Groups.Commands.AcceptInvitation;

using StudentWorkload.Domain.Modules.Academic.Entities;
using StudentWorkload.Domain.Modules.Academic.Repositories;
using StudentWorkload.Domain.Modules.Groups.Entities;
using StudentWorkload.Domain.Modules.Groups.Repositories;
using StudentWorkload.Domain.Modules.Subjects.Entities;
using StudentWorkload.Domain.Modules.Subjects.Repositories;

public class AcceptInvitationCommandHandler
{
    private readonly IGroupInvitationRepository _invitationRepo;
    private readonly IGroupRepository _groupRepo;
    private readonly ISubjectRepository _subjectRepo;
    private readonly IAcademicProfileRepository _profileRepo;

    public AcceptInvitationCommandHandler(
        IGroupInvitationRepository invitationRepo,
        IGroupRepository groupRepo,
        ISubjectRepository subjectRepo,
        IAcademicProfileRepository profileRepo)
    {
        _invitationRepo = invitationRepo;
        _groupRepo = groupRepo;
        _subjectRepo = subjectRepo;
        _profileRepo = profileRepo;
    }

    public async Task<AcceptInvitationResult> HandleAsync(
        AcceptInvitationCommand cmd,
        CancellationToken ct = default)
    {
        // ── 1. Validate the invitation token ───────────────────────────────
        // The token is a 32-char hex UUID stored in GroupInvitations.Token.
        var invitation = await _invitationRepo.GetByTokenAsync(cmd.Token, ct);

        if (invitation is null)
            return new AcceptInvitationResult(false, Error: "Invitation not found.");

        // IsValid() checks Status == Pending AND ExpiresAt > UtcNow
        if (!invitation.IsValid())
            return new AcceptInvitationResult(false, Error: "Invitation has expired or has already been used.");

        // ── 2. Load the group the invitation points to ─────────────────────
        var group = await _groupRepo.GetByIdAsync(invitation.GroupId, ct);
        if (group is null)
            return new AcceptInvitationResult(false, Error: "The group no longer exists.");

        // ── 3. Short-circuit: user is already a member ─────────────────────
        // This can happen if they clicked the email link twice, or if we
        // retried the request. We still mark the invite accepted and return
        // success so the frontend can redirect them to the workspace.
        var alreadyMember = await _groupRepo.IsUserMemberAsync(invitation.GroupId, cmd.UserId, ct);
        if (alreadyMember)
        {
            invitation.Accept();
            await _invitationRepo.SaveChangesAsync(ct);
            return new AcceptInvitationResult(true, invitation.GroupId);
        }

        // ── 4. Capacity check ──────────────────────────────────────────────
        var currentMembers = (await _groupRepo.GetMembersAsync(invitation.GroupId, ct)).ToList();
        if (currentMembers.Count >= group.MaxMembers)
            return new AcceptInvitationResult(false, Error: "This group is already at full capacity.");

        // ── 5. Resolve the source subject ──────────────────────────────────
        // Every group is linked to a Subject (the module it was created for).
        // We look that subject up so we can clone it for the invited user.
        var sourceSubject = await _subjectRepo.GetByIdAsync(group.SubjectId, ct);
        if (sourceSubject is null)
            return new AcceptInvitationResult(false, Error: "The subject linked to this group no longer exists.");

        // ── 6. Ensure the invited user has this subject in their account ───
        // We match by module code (e.g. "CSP6001"), NOT by subject ID,
        // because every user owns their own copy of the Subject record.
        var userSubjects = await _subjectRepo.GetByUserIdAsync(cmd.UserId, ct);
        var alreadyHasSubject = userSubjects.Any(s => s.Code == sourceSubject.Code);

        if (!alreadyHasSubject)
        {
            // ── 6a. Get or create the user's academic profile ──────────────
            // New users who registered via an invite link haven't gone through
            // onboarding yet, so they won't have a profile. We create a
            // placeholder (Year 1, Semester 1) — they can update it later in
            // Settings. Existing users who skipped adding this subject simply
            // reuse their existing profile.
            var profile = await _profileRepo.GetByUserIdAsync(cmd.UserId, ct);
            if (profile is null)
            {
                profile = AcademicProfile.Create(cmd.UserId, academicYear: 1, semester: 1);
                await _profileRepo.AddAsync(profile, ct);
                await _profileRepo.SaveChangesAsync(ct);
            }

            // ── 6b. Clone the subject for the invited user ─────────────────
            // Subject.Create() enforces all domain rules (code uppercase, etc.)
            // We deliberately copy code, name, creditHours, and color so the
            // invited user's workspace card looks identical to the inviter's.
            var clonedSubject = Subject.Create(
                userId:           cmd.UserId,
                academicProfileId: profile.Id,
                code:             sourceSubject.Code,
                name:             sourceSubject.Name,
                creditHours:      sourceSubject.CreditHours,
                color:            sourceSubject.Color
            );

            await _subjectRepo.AddAsync(clonedSubject, ct);
            await _subjectRepo.SaveChangesAsync(ct);
        }

        // ── 7. Add the user to the group as a Member ───────────────────────
        var member = GroupMember.Create(invitation.GroupId, cmd.UserId, GroupRole.Member);
        await _groupRepo.AddMemberAsync(member, ct);

        // ── 8. Mark the invitation as accepted ────────────────────────────
        // This sets Status = Accepted. IsValid() will now return false,
        // preventing the same link from being used again.
        invitation.Accept();

        await _groupRepo.SaveChangesAsync(ct);
        await _invitationRepo.SaveChangesAsync(ct);

        return new AcceptInvitationResult(true, invitation.GroupId);
    }
}