// FILE PATH:
// frontend/src/components/InviteModal.jsx

import { useState } from 'react';
import { invitationsApi } from '../api/invitationsApi';

// ─── InviteModal ─────────────────────────────────────────────────────────────
// Drop this anywhere you need an "Invite member" button.
// Props:
//   groupId  — the group to invite to
//   onClose  — callback to close the modal
// ────────────────────────────────────────────────────────────────────────────

export default function InviteModal({ groupId, onClose }) {
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState('idle'); // idle | loading | success | error
    const [message, setMessage] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus('loading');
        setMessage('');

        try {
            await invitationsApi.sendInvitation(groupId, email.trim());
            setStatus('success');
            setMessage(`Invitation sent to ${email.trim()} ✓`);
            setEmail('');
        } catch (err) {
            setStatus('error');
            setMessage(err.response?.data?.message || 'Failed to send invitation.');
        }
    };

    return (
        <div style={overlay}>
            <div style={modal}>
                {/* Header */}
                <div style={header}>
                    <div>
                        <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>
                            Invite to Workspace
                        </h3>
                        <p style={{ margin: '4px 0 0', fontSize: '0.825rem', color: '#64748b' }}>
                            Send an invitation link via email
                        </p>
                    </div>
                    <button onClick={onClose} style={closeBtn} aria-label="Close">
                        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                            <path d="M4 4l10 10M14 4L4 14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                        </svg>
                    </button>
                </div>

                {/* Body */}
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <label style={{ fontSize: '0.825rem', fontWeight: 600, color: '#0f172a' }}>
                            Email address
                        </label>
                        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                            <svg style={{ position: 'absolute', left: 14, color: '#94a3b8', pointerEvents: 'none' }}
                                width="18" height="18" viewBox="0 0 18 18" fill="none">
                                <rect x="1.5" y="3.5" width="15" height="11" rx="2" stroke="currentColor" strokeWidth="1.5" />
                                <path d="M1.5 6.5L9 11L16.5 6.5" stroke="currentColor" strokeWidth="1.5" />
                            </svg>
                            <input
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                required
                                placeholder="teammate@university.edu"
                                style={input}
                            />
                        </div>
                    </div>

                    {message && (
                        <div style={{
                            padding: '10px 14px',
                            borderRadius: 10,
                            fontSize: '0.875rem',
                            background: status === 'success' ? '#f0fdf4' : '#fef2f2',
                            border: `1px solid ${status === 'success' ? '#bbf7d0' : '#fecaca'}`,
                            color: status === 'success' ? '#15803d' : '#dc2626',
                        }}>
                            {message}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={status === 'loading'}
                        style={submitBtn}
                    >
                        {status === 'loading' ? (
                            <span style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
                                <span style={{
                                    width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)',
                                    borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite'
                                }} />
                                Sending…
                            </span>
                        ) : 'Send Invitation'}
                    </button>
                </form>
            </div>

            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );
}

// ─── Inline styles (matches existing workspace.css aesthetic) ────────────────

const overlay = {
    position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.45)',
    backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center',
    justifyContent: 'center', zIndex: 1000,
};

const modal = {
    background: '#fff', borderRadius: 16, padding: '28px 32px', width: '100%',
    maxWidth: 440, boxShadow: '0 24px 64px rgba(26,58,110,0.18)',
    border: '1px solid #e2e8f0', animation: 'none',
};

const header = {
    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
    marginBottom: 22,
};

const closeBtn = {
    background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8',
    display: 'flex', alignItems: 'center', padding: 4, borderRadius: 6,
};

const input = {
    width: '100%', padding: '11px 14px 11px 44px', background: '#f8faff',
    border: '1.5px solid #e2e8f0', borderRadius: 12, fontSize: '0.9rem',
    color: '#0f172a', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
};

const submitBtn = {
    width: '100%', padding: '13px 24px',
    background: 'linear-gradient(135deg, #1a3a6e 0%, #2563eb 100%)',
    color: '#fff', border: 'none', borderRadius: 12, fontSize: '0.95rem',
    fontWeight: 600, cursor: 'pointer', boxShadow: '0 8px 24px rgba(37,99,235,0.35)',
};