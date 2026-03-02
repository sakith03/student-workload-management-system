// FILE PATH:
// frontend/src/pages/InvitePage.jsx

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { invitationsApi } from '../api/invitationsApi';
import '../styles/auth.css';

// ─── InvitePage ──────────────────────────────────────────────────────────────
// This page handles /invite/:token
//  • Fetches preview info (group name, invitedEmail) — no auth needed
//  • Shows a nice "Accept invitation" screen
//  • If user IS logged in (token in localStorage) → calls accept API → redirect to workspace
//  • If NOT logged in → stores token in sessionStorage, redirects to /login (or /register)
// ────────────────────────────────────────────────────────────────────────────

export default function InvitePage() {
    const { token } = useParams();
    const navigate = useNavigate();

    const [preview, setPreview] = useState(null);
    const [status, setStatus] = useState('loading'); // loading | ready | error | accepting
    const [errorMsg, setErrorMsg] = useState('');

    const isLoggedIn = !!localStorage.getItem('token');

    useEffect(() => {
        invitationsApi.previewInvitation(token)
            .then(({ data }) => {
                setPreview(data);
                setStatus('ready');
            })
            .catch(() => {
                setStatus('error');
                setErrorMsg('This invitation is invalid or has expired.');
            });
    }, [token]);

    const handleAccept = async () => {
        if (!isLoggedIn) {
            // Store token so Register/Login pages can pick it up after auth
            sessionStorage.setItem('pendingInviteToken', token);
            navigate('/register');
            return;
        }

        setStatus('accepting');
        try {
            const { data } = await invitationsApi.acceptInvitation(token);
            navigate(`/workspace/${data.groupId}`);
        } catch (err) {
            setStatus('error');
            setErrorMsg(err.response?.data?.message || 'Failed to accept invitation.');
        }
    };

    const handleLogin = () => {
        sessionStorage.setItem('pendingInviteToken', token);
        navigate('/login');
    };

    if (status === 'loading') {
        return (
            <div className="auth-root">
                <AuthBg />
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
                    <div style={{ textAlign: 'center', color: '#475569' }}>
                        <div className="btn-spinner" style={{ margin: '0 auto 16px', borderColor: '#cbd5e1', borderTopColor: '#2563eb' }} />
                        <p>Loading invitation…</p>
                    </div>
                </div>
            </div>
        );
    }

    if (status === 'error') {
        return (
            <div className="auth-root">
                <AuthBg />
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
                    <div className="auth-card" style={{ maxWidth: 420, textAlign: 'center' }}>
                        <div style={{ fontSize: '2.5rem', marginBottom: 16 }}>🔗</div>
                        <h2 className="auth-title" style={{ marginBottom: 8 }}>Invalid Invitation</h2>
                        <p style={{ color: '#475569', marginBottom: 24 }}>{errorMsg}</p>
                        <button className="auth-btn" onClick={() => navigate('/login')}>Go to Login</button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="auth-root">
            <AuthBg />
            <div className="auth-split">
                {/* LEFT PANEL */}
                <div className="auth-left">
                    <div className="auth-left-inner">
                        <div className="brand-mark">
                            <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                                <rect width="48" height="48" rx="14" fill="rgba(255,255,255,0.15)" />
                                <path d="M24 10L38 18V24C38 32.837 31.732 41.08 24 43C16.268 41.08 10 32.837 10 24V18L24 10Z"
                                    fill="rgba(255,255,255,0.9)" />
                                <path d="M19 24L22.5 27.5L29 21" stroke="#1a3a6e" strokeWidth="2.5"
                                    strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </div>
                        <div className="auth-left-text">
                            <h1 className="auth-brand-name">LoadMate</h1>
                            <p className="auth-brand-sub">Student Workload System</p>
                        </div>
                        <div className="auth-left-divider" />
                        <p className="auth-left-tagline">
                            You've been invited to collaborate with a group on LoadMate.
                        </p>
                        <ul className="auth-features">
                            <li><span className="feature-icon">◈</span>Shared group workspace</li>
                            <li><span className="feature-icon">◈</span>Collaborate on assignments</li>
                            <li><span className="feature-icon">◈</span>Track workload together</li>
                        </ul>
                    </div>
                </div>

                {/* RIGHT PANEL */}
                <div className="auth-right">
                    <div className="auth-card" style={{ maxWidth: 460, textAlign: 'center' }}>
                        <div style={{ fontSize: '3rem', marginBottom: 8 }}>🎉</div>
                        <div className="auth-card-header" style={{ marginBottom: 20 }}>
                            <h2 className="auth-title">You're invited!</h2>
                            <p className="auth-subtitle">
                                Join <strong style={{ color: '#1a3a6e' }}>{preview?.groupName}</strong> on LoadMate
                            </p>
                        </div>

                        <div style={{
                            background: '#f0f4ff',
                            border: '1px solid #dbeafe',
                            borderRadius: 12,
                            padding: '16px 20px',
                            marginBottom: 24,
                            textAlign: 'left'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                <span style={{ fontSize: '0.825rem', color: '#64748b' }}>Group</span>
                                <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0f172a' }}>
                                    {preview?.groupName}
                                </span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                <span style={{ fontSize: '0.825rem', color: '#64748b' }}>Invited email</span>
                                <span style={{ fontSize: '0.875rem', color: '#0f172a' }}>
                                    {preview?.invitedEmail}
                                </span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ fontSize: '0.825rem', color: '#64748b' }}>Expires</span>
                                <span style={{ fontSize: '0.875rem', color: '#0f172a' }}>
                                    {preview?.expiresAt ? new Date(preview.expiresAt).toLocaleDateString() : '—'}
                                </span>
                            </div>
                        </div>

                        {isLoggedIn ? (
                            <>
                                <button
                                    className="auth-btn"
                                    disabled={status === 'accepting'}
                                    onClick={handleAccept}
                                >
                                    {status === 'accepting' ? (
                                        <><span className="btn-spinner" /> Joining…</>
                                    ) : (
                                        <>Accept &amp; Join Workspace →</>
                                    )}
                                </button>
                            </>
                        ) : (
                            <>
                                <p style={{ color: '#475569', fontSize: '0.9rem', marginBottom: 20 }}>
                                    To join this workspace, create a free account or log in.
                                </p>
                                <button className="auth-btn" onClick={handleAccept} style={{ marginBottom: 12 }}>
                                    Create Account &amp; Join →
                                </button>
                                <button
                                    onClick={handleLogin}
                                    style={{
                                        width: '100%', padding: '12px 24px', border: '1.5px solid #e2e8f0',
                                        borderRadius: 12, background: '#fff', color: '#1a3a6e',
                                        fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer'
                                    }}
                                >
                                    I already have an account
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

function AuthBg() {
    return (
        <div className="auth-bg">
            <div className="auth-bg-orb orb-1" />
            <div className="auth-bg-orb orb-2" />
            <div className="auth-bg-orb orb-3" />
            <div className="auth-grid-overlay" />
        </div>
    );
}