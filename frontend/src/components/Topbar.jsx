import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

function formatDate() {
    return new Date().toLocaleDateString('en-US', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
}

function getInitials(email) {
    if (!email) return '?';
    return email.charAt(0).toUpperCase();
}

export default function Topbar({ title, onToggleSidebar }) {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <header className="dash-nav">
            <div className="dash-nav-left">
                <button className="hamburger" onClick={onToggleSidebar}>
                    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                        <path d="M3 6h16M3 11h16M3 16h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                    </svg>
                </button>
                <div className="dash-nav-title">
                    <span>{title}</span>
                </div>
            </div>
            <div className="dash-nav-right">
                <div className="nav-date">{formatDate()}</div>
                <div className="nav-user">
                    <div className="nav-avatar">{getInitials(user?.email)}</div>
                    <div className="nav-user-info">
                        <span className="nav-user-email">{user?.email}</span>
                        <span className={`nav-role-badge ${user?.role === 'Lecturer' ? 'badge--lecturer' : 'badge--student'}`}>
                            {user?.role}
                        </span>
                    </div>
                </div>
                <button onClick={handleLogout} className="logout-btn">
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                        <path d="M7 3H3.5A1.5 1.5 0 002 4.5v9A1.5 1.5 0 003.5 15H7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                        <path d="M12 6l3 3-3 3M7 9h8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <span>Logout</span>
                </button>
            </div>
        </header>
    );
}
