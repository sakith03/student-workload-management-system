import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const NAV_ITEMS = [
    {
        icon: (
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <rect x="2" y="2" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
                <rect x="11" y="2" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
                <rect x="2" y="11" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
                <rect x="11" y="11" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
            </svg>
        ),
        label: 'Dashboard',
        path: '/dashboard',
    },
    {
        icon: (
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <rect x="3" y="4" width="14" height="13" rx="2" stroke="currentColor" strokeWidth="1.6" />
                <path d="M7 2v4M13 2v4M3 9h14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
        ),
        label: 'My Modules',
        path: '/modules',
    },
    {
        icon: (
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M17 11.5C17 14.538 14.314 17 11 17c-.98 0-1.904-.224-2.714-.622L4 17.5l1.3-3.8A5.44 5.44 0 013 11.5C3 8.462 5.686 6 9 6s8 2.462 8 5.5z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
            </svg>
        ),
        label: 'Workspaces',
        path: '/workspaces',
    },
    {
        icon: (
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.6" />
                <circle cx="10" cy="10" r="3" stroke="currentColor" strokeWidth="1.6" />
                <path d="M10 3v2M10 15v2M3 10h2M15 10h2"
                    stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
        ),
        label: 'My Goals',
        path: '/goals',
    },
    {
        icon: (
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <circle cx="10" cy="10" r="3" stroke="currentColor" strokeWidth="1.6" />
                <path d="M10 2v2M10 16v2M2 10h2M16 10h2M4.22 4.22l1.42 1.42M14.36 14.36l1.42 1.42M4.22 15.78l1.42-1.42M14.36 5.64l1.42-1.42" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
        ),
        label: 'Settings',
        path: '/settings',
    },
];

export default function Sidebar({ isOpen, onClose }) {
    const navigate = useNavigate();
    const location = useLocation();

    return (
        <>
            {isOpen && (
                <div className="sidebar-overlay" onClick={onClose} />
            )}

            <aside className={`sidebar ${isOpen ? 'sidebar--open' : ''}`}>
                <div className="sidebar-brand">
                    <div className="sidebar-logo">
                        <svg width="28" height="28" viewBox="0 0 48 48" fill="none">
                            <rect width="48" height="48" rx="12" fill="#1a3a6e" />
                            <path d="M24 10L38 18V24C38 32.837 31.732 41.08 24 43C16.268 41.08 10 32.837 10 24V18L24 10Z" fill="white" />
                            <path d="M19 24L22.5 27.5L29 21" stroke="#1a3a6e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </div>
                    <div>
                        <span className="sidebar-brand-name">LoadMate</span>
                        <span className="sidebar-brand-sub">Workload System</span>
                    </div>
                </div>

                <nav className="sidebar-nav">
                    <p className="sidebar-section-label">Menu</p>
                    {NAV_ITEMS.map((item) => (
                        <div
                            key={item.label}
                            className={`sidebar-item ${location.pathname.startsWith(item.path) ? 'sidebar-item--active' : ''}`}
                            onClick={() => {
                                navigate(item.path);
                                onClose();
                            }}
                        >
                            <span className="sidebar-item-icon">{item.icon}</span>
                            <span className="sidebar-item-label">{item.label}</span>
                        </div>
                    ))}
                </nav>

                <div className="sidebar-footer">
                    <div className="sidebar-sprint-badge">
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                            <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.5" />
                            <path d="M6 3v3l2 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                        </svg>
                        Sprint 2 — Workspace
                    </div>
                </div>
            </aside>
        </>
    );
}
