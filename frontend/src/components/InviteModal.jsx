// FILE PATH:
// frontend/src/components/InviteModal.jsx

import { useState, useEffect } from 'react';
import { invitationsApi } from '../api/invitationsApi';
import { groupsApi } from '../api/groupsApi';
import { useAuth } from '../context/AuthContext';

// ─── InviteModal ──────────────────────────────────────────────────────────────
// Props:
//   groupId  — the group to manage
//   onClose  — callback to close the modal
//
// Behavior:
//   Owner view  → Send invite form + Members list + Pending Invitations list
//   Member view → Send invite form + Members list only
// ─────────────────────────────────────────────────────────────────────────────

export default function InviteModal({ groupId, onClose }) {
    const { user } = useAuth();

    // ── Send-invite form state ────────────────────────────────────────────────
    const [email, setEmail] = useState('');
    const [sendStatus, setSendStatus] = useState('idle'); // idle | loading | success | error
    const [sendMsg, setSendMsg] = useState('');

    // ── Team data state ───────────────────────────────────────────────────────
    const [members, setMembers] = useState([]);
    const [pendingInvitations, setPendingInvitations] = useState([]);
    const [isOwner, setIsOwner] = useState(false);
    const [loadingTeam, setLoadingTeam] = useState(true);

    // ── On open: fetch team data ──────────────────────────────────────────────
    useEffect(() => {
        fetchTeamData();
    }, [groupId]);

    const fetchTeamData = async () => {
        setLoadingTeam(true);
        try {
            // Step 1: Always fetch the member list (both owner & member can call this)
            const { data: membersData } = await groupsApi.getGroupMembers(groupId);
            const memberList = membersData.members || [];
            setMembers(memberList);

            // Step 2: Find out if the logged-in user is the group owner
            // We compare user.id (from JWT sub claim) with userId in the member record
            const myRecord = memberList.find(m => m.userId === user?.id);
            const iAmOwner = myRecord?.isOwner === true;
            setIsOwner(iAmOwner);

            // Step 3: Only owners can see pending invitations
            if (iAmOwner) {
                const { data: invData } = await groupsApi.getPendingInvitations(groupId);
                setPendingInvitations(invData.pendingInvitations || []);
            }
        } catch (err) {
            // Fail silently — the send-invite form still works
            console.error('Failed to load team data:', err);
        } finally {
            setLoadingTeam(false);
        }
    };

    // ── Handle invitation send ────────────────────────────────────────────────
    const handleSubmit = async (e) => {
        e.preventDefault();
        setSendStatus('loading');
        setSendMsg('');

        try {
            await invitationsApi.sendInvitation(groupId, email.trim());
            setSendStatus('success');
            setSendMsg(`Invitation sent to ${email.trim()}`);
            setEmail('');

            // Refresh the pending list immediately so owner sees the new invite
            if (isOwner) {
                const { data: invData } = await groupsApi.getPendingInvitations(groupId);
                setPendingInvitations(invData.pendingInvitations || []);
            }
        } catch (err) {
            setSendStatus('error');
            setSendMsg(err.response?.data?.message || 'Failed to send invitation.');
        }
    };

    // ── Avatar helpers ────────────────────────────────────────────────────────
    // Generates two-letter initials from first + last name
    const getInitials = (first = '', last = '') =>
        `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();

    // Picks a consistent color based on the first character of the name
    // Uses the same palette as the rest of the app
    const AVATAR_PALETTE = [
        { bg: '#dbeafe', color: '#1d4ed8' },  // blue
        { bg: '#ede9fe', color: '#6d28d9' },  // purple
        { bg: '#d1fae5', color: '#065f46' },  // green
        { bg: '#fce7f3', color: '#be185d' },  // pink
        { bg: '#ffedd5', color: '#c2410c' },  // orange
        { bg: '#cffafe', color: '#0e7490' },  // cyan
    ];
    const getAvatarColor = (name = '') =>
        AVATAR_PALETTE[(name.charCodeAt(0) || 0) % AVATAR_PALETTE.length];

    // ─────────────────────────────────────────────────────────────────────────
    return (
        <div style={S.overlay}>
            <div style={S.modal}>

                {/* ════ HEADER ════ */}
                <div style={S.header}>
                    <div>
                        <h3 style={S.headerTitle}>Invite to Workspace</h3>
                        <p style={S.headerSub}>Send an invitation link via email</p>
                    </div>
                    <button onClick={onClose} style={S.closeBtn} aria-label="Close">
                        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                            <path d="M4 4l10 10M14 4L4 14"
                                stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                        </svg>
                    </button>
                </div>

                {/* ════ SCROLLABLE BODY ════ */}
                <div style={S.body}>

                    {/* ── Invite Form ── */}
                    <form onSubmit={handleSubmit}>
                        <label style={S.label}>Email address</label>

                        {/* Inline layout: input + send button side by side */}
                        <div style={S.inputRow}>
                            <div style={S.inputWrap}>
                                <svg style={S.inputIcon} width="16" height="16"
                                    viewBox="0 0 18 18" fill="none">
                                    <rect x="1.5" y="3.5" width="15" height="11" rx="2"
                                        stroke="currentColor" strokeWidth="1.5" />
                                    <path d="M1.5 6.5L9 11L16.5 6.5"
                                        stroke="currentColor" strokeWidth="1.5" />
                                </svg>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    required
                                    placeholder="teammate@university.edu"
                                    style={S.input}
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={sendStatus === 'loading'}
                                style={{ ...S.sendBtn, opacity: sendStatus === 'loading' ? 0.7 : 1 }}
                            >
                                {sendStatus === 'loading'
                                    ? <span style={S.btnSpinner} />
                                    : <>
                                        {/* Paper plane icon */}
                                        <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                                            <path d="M14 2L2 6.5l5 2 2 5L14 2z"
                                                fill="white" stroke="white"
                                                strokeWidth="0.5" strokeLinejoin="round" />
                                        </svg>
                                        Send
                                    </>
                                }
                            </button>
                        </div>

                        {/* Feedback banner */}
                        {sendMsg && (
                            <div style={{
                                ...S.feedback,
                                background: sendStatus === 'success' ? '#f0fdf4' : '#fef2f2',
                                borderColor: sendStatus === 'success' ? '#bbf7d0' : '#fecaca',
                                color: sendStatus === 'success' ? '#15803d' : '#dc2626',
                            }}>
                                {sendStatus === 'success'
                                    ? <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                                        <path d="M2 7l3 3 7-7" stroke="currentColor"
                                            strokeWidth="1.6" strokeLinecap="round"
                                            strokeLinejoin="round" />
                                    </svg>
                                    : <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                                        <circle cx="7" cy="7" r="6"
                                            stroke="currentColor" strokeWidth="1.4" />
                                        <path d="M7 4v3M7 9.5v.5"
                                            stroke="currentColor" strokeWidth="1.5"
                                            strokeLinecap="round" />
                                    </svg>
                                }
                                {sendMsg}
                            </div>
                        )}
                    </form>

                    {/* ── Section Divider ── */}
                    <div style={S.divider}>
                        <div style={S.dividerLine} />
                        <span style={S.dividerLabel}>Team</span>
                        <div style={S.dividerLine} />
                    </div>

                    {/* ── Team Data ── */}
                    {loadingTeam ? (
                        <LoadingSkeleton />
                    ) : (
                        <>
                            {/* ── CURRENT MEMBERS ── */}
                            <section>
                                <div style={S.sectionHead}>
                                    {/* Group icon */}
                                    <svg width="13" height="13" viewBox="0 0 18 18" fill="none">
                                        <circle cx="7" cy="5.5" r="3"
                                            stroke="#1d4ed8" strokeWidth="1.5" />
                                        <path d="M2 16c0-2.761 2.239-5 5-5"
                                            stroke="#1d4ed8" strokeWidth="1.5"
                                            strokeLinecap="round" />
                                        <circle cx="13" cy="6" r="2.5"
                                            stroke="#1d4ed8" strokeWidth="1.3" />
                                        <path d="M11 16c0-2 .9-3.6 2-4.4"
                                            stroke="#1d4ed8" strokeWidth="1.3"
                                            strokeLinecap="round" />
                                    </svg>
                                    <span style={S.sectionTitle}>Members</span>
                                    <span style={S.blueChip}>{members.length}</span>
                                </div>

                                {members.length === 0
                                    ? <p style={S.emptyNote}>No members found.</p>
                                    : members.map(m => {
                                        const av = getAvatarColor(m.firstName);
                                        return (
                                            <div key={m.userId} style={S.memberRow}>
                                                {/* Initials avatar */}
                                                <div style={{
                                                    ...S.avatar,
                                                    background: av.bg,
                                                    color: av.color,
                                                }}>
                                                    {getInitials(m.firstName, m.lastName)}
                                                </div>

                                                {/* Name */}
                                                <span style={S.memberName}>
                                                    {m.firstName} {m.lastName}
                                                </span>

                                                {/* Role badge */}
                                                {m.isOwner
                                                    ? <span style={S.ownerBadge}>
                                                        {/* Star icon */}
                                                        <svg width="9" height="9"
                                                            viewBox="0 0 10 10" fill="none">
                                                            <path d="M5 1l1.2 2.5L9 3.8 7 5.7l.5 2.8L5 7.1 2.5 8.5 3 5.7 1 3.8l2.8-.3L5 1Z"
                                                                fill="#1d4ed8" />
                                                        </svg>
                                                        Owner
                                                    </span>
                                                    : <span style={S.memberBadge}>Member</span>
                                                }
                                            </div>
                                        );
                                    })
                                }
                            </section>

                            {/* ── PENDING INVITATIONS — owner only ── */}
                            {isOwner && (
                                <>
                                    <div style={S.thinDivider} />

                                    <section>
                                        <div style={S.sectionHead}>
                                            {/* Clock icon — signals "waiting" */}
                                            <svg width="13" height="13"
                                                viewBox="0 0 16 16" fill="none">
                                                <circle cx="8" cy="8" r="6"
                                                    stroke="#f59e0b" strokeWidth="1.5" />
                                                <path d="M8 5v3l2.5 1.5"
                                                    stroke="#f59e0b" strokeWidth="1.5"
                                                    strokeLinecap="round" />
                                            </svg>
                                            <span style={S.amberSectionTitle}>
                                                Pending Invitations
                                            </span>
                                            {pendingInvitations.length > 0 && (
                                                <span style={S.amberChip}>
                                                    {pendingInvitations.length}
                                                </span>
                                            )}
                                        </div>

                                        {pendingInvitations.length === 0
                                            ? <p style={S.emptyNote}>No pending invitations.</p>
                                            : pendingInvitations.map(inv => (
                                                <div key={inv.invitationId}
                                                    style={S.pendingRow}>
                                                    {/* Email icon in amber */}
                                                    <div style={S.pendingIconBox}>
                                                        <svg width="14" height="14"
                                                            viewBox="0 0 18 18" fill="none">
                                                            <rect x="1.5" y="3.5"
                                                                width="15" height="11" rx="2"
                                                                stroke="#f59e0b"
                                                                strokeWidth="1.5" />
                                                            <path d="M1.5 6.5L9 11L16.5 6.5"
                                                                stroke="#f59e0b"
                                                                strokeWidth="1.5" />
                                                        </svg>
                                                    </div>

                                                    {/* Email + meta */}
                                                    <div style={S.pendingInfo}>
                                                        <span style={S.pendingEmail}>
                                                            {inv.invitedEmail}
                                                        </span>
                                                        <span style={S.pendingMeta}>
                                                            Sent by {inv.invitedByName}
                                                            {' · '}
                                                            {inv.daysUntilExpiry > 0
                                                                ? `Expires in ${inv.daysUntilExpiry}d`
                                                                : 'Expires today'
                                                            }
                                                        </span>
                                                    </div>

                                                    {/* Status chip */}
                                                    <span style={S.awaitingBadge}>
                                                        Awaiting
                                                    </span>
                                                </div>
                                            ))
                                        }
                                    </section>
                                </>
                            )}
                        </>
                    )}
                </div>
            </div>

            <style>{`
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50%       { opacity: 0.4; }
                }
            `}</style>
        </div>
    );
}

// ─── Loading Skeleton ─────────────────────────────────────────────────────────
// Shows while team data is being fetched — matches the member row shape
function LoadingSkeleton() {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 4 }}>
            {[1, 2, 3].map(i => (
                <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '8px 10px',
                }}>
                    {/* Avatar skeleton */}
                    <div style={{
                        width: 32, height: 32, borderRadius: 10,
                        background: '#f1f5f9',
                        animation: 'pulse 1.4s ease infinite',
                        flexShrink: 0,
                    }} />
                    {/* Name skeleton — different widths for realism */}
                    <div style={{
                        height: 12, borderRadius: 6,
                        background: '#f1f5f9',
                        width: `${[55, 70, 60][i - 1]}%`,
                        animation: 'pulse 1.4s ease infinite',
                        animationDelay: `${i * 0.1}s`,
                    }} />
                </div>
            ))}
        </div>
    );
}

// ─── Inline Styles ────────────────────────────────────────────────────────────
// Follows the same pattern as the original InviteModal and the rest of the app.
// All colors come from the global CSS variables defined in dashboard.css / auth.css.
const S = {

    // ── Layout ──
    overlay: {
        position: 'fixed', inset: 0,
        background: 'rgba(15,23,42,0.45)',
        backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000, padding: '20px',
    },
    modal: {
        background: '#fff',
        borderRadius: 16,
        width: '100%', maxWidth: 460,
        maxHeight: '88vh',                  // prevents overflow on small screens
        display: 'flex', flexDirection: 'column',
        boxShadow: '0 24px 64px rgba(26,58,110,0.18)',
        border: '1px solid #e2e8f0',
        overflow: 'hidden',
        fontFamily: "'DM Sans', sans-serif",
    },

    // ── Header ──
    header: {
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
        padding: '20px 24px 16px',
        borderBottom: '1px solid #f1f5f9',
        flexShrink: 0,                      // header never shrinks — only body scrolls
    },
    headerTitle: {
        margin: 0, fontSize: '1rem',
        fontWeight: 700, color: '#0f172a',
        fontFamily: "'Sora', sans-serif",
    },
    headerSub: {
        margin: '3px 0 0', fontSize: '0.8rem', color: '#94a3b8',
    },
    closeBtn: {
        background: 'none', border: 'none', cursor: 'pointer',
        color: '#94a3b8', display: 'flex',
        alignItems: 'center', padding: 4, borderRadius: 6,
    },

    // ── Scrollable Body ──
    body: {
        padding: '20px 24px 24px',
        overflowY: 'auto',
        flex: 1,
        scrollbarWidth: 'thin',
        scrollbarColor: '#e2e8f0 transparent',
    },

    // ── Form ──
    label: {
        display: 'block',
        fontSize: '0.8rem', fontWeight: 600, color: '#0f172a',
        marginBottom: 8,
    },
    inputRow: {
        display: 'flex', gap: 8, alignItems: 'center',
    },
    inputWrap: {
        flex: 1, position: 'relative',
        display: 'flex', alignItems: 'center',
    },
    inputIcon: {
        position: 'absolute', left: 13,
        color: '#94a3b8', pointerEvents: 'none',
    },
    input: {
        width: '100%',
        padding: '10px 13px 10px 40px',
        background: '#f8faff',
        border: '1.5px solid #e2e8f0',
        borderRadius: 10,
        fontFamily: "'DM Sans', sans-serif",
        fontSize: '0.875rem', color: '#0f172a',
        outline: 'none', boxSizing: 'border-box',
    },
    sendBtn: {
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '10px 16px',
        background: 'linear-gradient(135deg, #1a3a6e, #2563eb)',
        color: '#fff', border: 'none', borderRadius: 10,
        fontFamily: "'Sora', sans-serif",
        fontSize: '0.8rem', fontWeight: 600,
        cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
        boxShadow: '0 4px 12px rgba(37,99,235,0.3)',
    },
    btnSpinner: {
        display: 'inline-block', width: 14, height: 14,
        border: '2px solid rgba(255,255,255,0.3)',
        borderTopColor: '#fff', borderRadius: '50%',
        animation: 'spin 0.7s linear infinite',
    },
    feedback: {
        display: 'flex', alignItems: 'center', gap: 8,
        marginTop: 10, padding: '9px 13px',
        borderRadius: 8, fontSize: '0.825rem',
        border: '1px solid',
    },

    // ── Dividers ──
    divider: {
        display: 'flex', alignItems: 'center', gap: 10,
        margin: '20px 0 16px',
    },
    dividerLine: { flex: 1, height: 1, background: '#f1f5f9' },
    dividerLabel: {
        fontSize: '0.68rem', fontWeight: 700, color: '#94a3b8',
        letterSpacing: '0.1em', textTransform: 'uppercase',
        whiteSpace: 'nowrap',
    },
    thinDivider: {
        height: 0, margin: '14px 0',
        borderTop: '1px dashed #f1f5f9',
    },

    // ── Section headers ──
    sectionHead: {
        display: 'flex', alignItems: 'center', gap: 7,
        marginBottom: 10,
    },
    sectionTitle: {
        fontSize: '0.72rem', fontWeight: 700,
        color: '#1e40af',
        letterSpacing: '0.06em', textTransform: 'uppercase',
    },
    amberSectionTitle: {
        fontSize: '0.72rem', fontWeight: 700,
        color: '#92400e',
        letterSpacing: '0.06em', textTransform: 'uppercase',
    },

    // ── Count chips ──
    blueChip: {
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        minWidth: 20, height: 20, padding: '0 6px',
        background: '#dbeafe', color: '#1d4ed8',
        borderRadius: 100, fontSize: '0.7rem', fontWeight: 700,
    },
    amberChip: {
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        minWidth: 20, height: 20, padding: '0 6px',
        background: '#fef3c7', color: '#92400e',
        borderRadius: 100, fontSize: '0.7rem', fontWeight: 700,
    },

    // ── Member rows ──
    memberRow: {
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '7px 10px', borderRadius: 10,
        marginBottom: 2,
        background: '#fafbff',
        border: '1px solid #f1f5f9',
    },
    avatar: {
        width: 32, height: 32, borderRadius: 10,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '0.7rem', fontWeight: 700,
        flexShrink: 0,
        fontFamily: "'Sora', sans-serif",
    },
    memberName: {
        flex: 1, fontSize: '0.875rem', fontWeight: 500, color: '#0f172a',
    },
    ownerBadge: {
        display: 'inline-flex', alignItems: 'center', gap: 4,
        padding: '3px 9px',
        background: '#dbeafe', color: '#1d4ed8',
        borderRadius: 100, fontSize: '0.68rem', fontWeight: 700,
        flexShrink: 0,
    },
    memberBadge: {
        display: 'inline-flex', alignItems: 'center',
        padding: '3px 9px',
        background: '#f1f5f9', color: '#64748b',
        borderRadius: 100, fontSize: '0.68rem', fontWeight: 600,
        flexShrink: 0,
    },

    // ── Pending invitation rows ──
    pendingRow: {
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '9px 11px', borderRadius: 10,
        background: '#fffbeb',
        border: '1px solid #fde68a',
        marginBottom: 6,
    },
    pendingIconBox: {
        width: 32, height: 32, borderRadius: 10,
        background: '#fef3c7',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
    },
    pendingInfo: {
        flex: 1, display: 'flex', flexDirection: 'column', gap: 2,
        overflow: 'hidden',
    },
    pendingEmail: {
        fontSize: '0.825rem', fontWeight: 500, color: '#0f172a',
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
    },
    pendingMeta: {
        fontSize: '0.72rem', color: '#b45309',
    },
    awaitingBadge: {
        display: 'inline-flex', alignItems: 'center',
        padding: '3px 9px',
        background: '#fef3c7', color: '#92400e',
        border: '1px solid #fde68a',
        borderRadius: 100, fontSize: '0.68rem', fontWeight: 700,
        whiteSpace: 'nowrap', flexShrink: 0,
    },

    // ── Loading / empty states ──
    emptyNote: {
        fontSize: '0.8rem', color: '#94a3b8',
        textAlign: 'center', padding: '8px 0',
        fontStyle: 'italic', margin: 0,
    },
};