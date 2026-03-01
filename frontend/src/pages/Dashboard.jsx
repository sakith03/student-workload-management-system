import { useState } from 'react';
import {
  LogOut, LayoutDashboard, Plus, Clock, Target, Calendar,
  BarChart2, Calculator, Settings, BookOpen
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import '../styles/dashboard.css';

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
        <path d="M4 6h12M4 10h8M4 14h10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    ),
    label: 'My Courses',
    path: '/my-courses',
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <circle cx="10" cy="6" r="3" stroke="currentColor" strokeWidth="1.6" />
        <path d="M3 17c0-3.314 2.686-6 7-6s7 2.686 7 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    ),
    label: 'Academic Setup',
    path: '/setup',
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <rect x="3" y="4" width="14" height="13" rx="2" stroke="currentColor" strokeWidth="1.6" />
        <path d="M7 2v4M13 2v4M3 9h14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    ),
    label: 'My Subjects',
    path: '/subjects',
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
        <circle cx="10" cy="10" r="3" stroke="currentColor" strokeWidth="1.6" />
        <path d="M10 2v2M10 16v2M2 10h2M16 10h2M4.22 4.22l1.42 1.42M14.36 14.36l1.42 1.42M4.22 15.78l1.42-1.42M14.36 5.64l1.42-1.42" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
    label: 'Settings',
    path: null,
  },
];

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function formatDate() {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });
}

function getInitials(email) {
  if (!email) return '?';
  return email.charAt(0).toUpperCase();
}

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [bannerVisible, setBannerVisible] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const copyId = () => {
    if (user?.id) {
      navigator.clipboard.writeText(user.id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="dash-root">
      {/* Sidebar overlay for mobile */}
      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />
      )}

      {/* SIDEBAR */}
      <aside className={`sidebar ${sidebarOpen ? 'sidebar--open' : ''}`}>
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
              className={`sidebar-item ${location.pathname === item.path ? 'sidebar-item--active' : ''} ${!item.path ? 'sidebar-item--disabled' : ''}`}
              onClick={() => item.path && navigate(item.path)}
            >
              <span className="sidebar-item-icon">{item.icon}</span>
              <span className="sidebar-item-label">{item.label}</span>
              {!item.path && <span className="sidebar-soon">Soon</span>}
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

      {/* MAIN */}
      <div className="dash-main">
        {/* TOP NAVBAR */}
        <header className="dash-nav">
          <div className="dash-nav-left">
            <button className="hamburger" onClick={() => setSidebarOpen(o => !o)}>
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                <path d="M3 6h16M3 11h16M3 16h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </button>
            <div className="dash-nav-title">
              <span>Dashboard</span>
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
              Logout
            </button>
          </div>
        </header>

        {/* PAGE CONTENT */}
        <main className="dash-content">

          {/* Greeting */}
          <div className="dash-greeting">
            <div>
              <h1 className="greeting-title">
                {getGreeting()}, <span className="greeting-name">{user?.email?.split('@')[0]}</span>
              </h1>
              <p className="greeting-sub">
                Here's what's happening in your academic workspace today.
              </p>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="stats-grid">
            <div className="stat-card stat-card--blue">
              <div className="stat-card-icon">
                <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                  <circle cx="11" cy="7" r="4" stroke="currentColor" strokeWidth="1.8" />
                  <path d="M3 20c0-4.418 3.582-8 8-8s8 3.582 8 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              </div>
              <div className="stat-card-content">
                <p className="stat-label">Your Role</p>
                <p className="stat-value">{user?.role}</p>
                <p className="stat-desc">Access level confirmed</p>
              </div>
              <div className="stat-card-glow" />
            </div>

            <div className="stat-card stat-card--green">
              <div className="stat-card-icon">
                <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                  <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="1.8" />
                  <path d="M7 11l3 3 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div className="stat-card-content">
                <p className="stat-label">Account Status</p>
                <p className="stat-value">Active</p>
                <p className="stat-desc">Session authenticated</p>
              </div>
              <div className="stat-card-glow" />
            </div>

            <div className="stat-card stat-card--purple">
              <div className="stat-card-icon">
                <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                  <path d="M11 2l2.5 6H20l-5 3.5 2 6.5-6-4-6 4 2-6.5L2 8h6.5L11 2z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
                </svg>
              </div>
              <div className="stat-card-content">
                <p className="stat-label">Current Sprint</p>
                <p className="stat-value">Sprint 2</p>
                <p className="stat-desc">Workspace system</p>
              </div>
              <div className="stat-card-glow" />
            </div>
          </div>

          {/* Quick Nav Cards */}
          <div className="quick-nav-grid">
            <div className="quick-nav-card" onClick={() => navigate('/my-courses')}>
              <div className="quick-nav-icon quick-nav-icon--blue">
                <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                  <path d="M4 6h14M4 11h10M4 16h12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              </div>
              <div className="quick-nav-text">
                <p className="quick-nav-title">My Courses</p>
                <p className="quick-nav-sub">View and manage your modules</p>
              </div>
              <svg className="quick-nav-arrow" width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M4 9h10M9 4l5 5-5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>

            <div className="quick-nav-card" onClick={() => navigate('/setup')}>
              <div className="quick-nav-icon quick-nav-icon--blue">
                <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                  <circle cx="11" cy="7" r="4" stroke="currentColor" strokeWidth="1.8" />
                  <path d="M3 20c0-4.418 3.582-8 8-8s8 3.582 8 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              </div>
              <div className="quick-nav-text">
                <p className="quick-nav-title">Academic Setup</p>
                <p className="quick-nav-sub">Set your year &amp; semester</p>
              </div>
              <svg className="quick-nav-arrow" width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M4 9h10M9 4l5 5-5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>

            <div className="quick-nav-card" onClick={() => navigate('/subjects')}>
              <div className="quick-nav-icon quick-nav-icon--purple">
                <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                  <rect x="3" y="4" width="16" height="15" rx="2" stroke="currentColor" strokeWidth="1.8" />
                  <path d="M7 2v4M15 2v4M3 10h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              </div>
              <div className="quick-nav-text">
                <p className="quick-nav-title">My Subjects</p>
                <p className="quick-nav-sub">Manage semester subjects</p>
              </div>
              <svg className="quick-nav-arrow" width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M4 9h10M9 4l5 5-5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>

            <div className="quick-nav-card" onClick={() => navigate('/workspaces')}>
              <div className="quick-nav-icon quick-nav-icon--green">
                <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                  <path d="M19 13.5C19 16.538 16.314 19 13 19c-.98 0-1.904-.224-2.714-.622L5 19.5l1.3-3.8A5.44 5.44 0 014 13.5C4 10.462 6.686 8 10 8s9 2.462 9 5.5z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
                </svg>
              </div>
              <div className="quick-nav-text">
                <p className="quick-nav-title">Workspaces</p>
                <p className="quick-nav-sub">View your group workspaces</p>
              </div>
              <svg className="quick-nav-arrow" width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M4 9h10M9 4l5 5-5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>

          {/* Account Info Card */}
          <div className="info-card">
            <div className="info-card-header">
              <div className="info-card-title">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <circle cx="10" cy="7" r="3.5" stroke="currentColor" strokeWidth="1.6" />
                  <path d="M3 18c0-3.866 3.134-7 7-7s7 3.134 7 7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
                Account Information
              </div>
            </div>

            <div className="info-rows">
              <div className="info-row">
                <span className="info-row-label">User ID</span>
                <div className="info-row-value-wrap">
                  <span className="info-row-value info-row-mono">
                    {user?.id ? `${user.id.substring(0, 8)}...` : '—'}
                  </span>
                  <button className="copy-btn" onClick={copyId} title="Copy full ID">
                    {copied ? (
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <path d="M2 7l3.5 3.5L12 4" stroke="#22c55e" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    ) : (
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <rect x="5" y="5" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
                        <path d="M9 5V3.5A1.5 1.5 0 007.5 2h-4A1.5 1.5 0 002 3.5v4A1.5 1.5 0 003.5 9H5" stroke="currentColor" strokeWidth="1.4" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <div className="info-row">
                <span className="info-row-label">Email address</span>
                <span className="info-row-value">{user?.email}</span>
              </div>

              <div className="info-row">
                <span className="info-row-label">Role</span>
                <span className={`info-badge ${user?.role === 'Lecturer' ? 'badge--lecturer' : 'badge--student'}`}>
                  {user?.role}
                </span>
              </div>

              <div className="info-row info-row--last">
                <span className="info-row-label">Member since</span>
                <span className="info-row-value">2026</span>
              </div>
            </div>
          </div>

          {/* Banner */}
          {bannerVisible && (
            <div className="welcome-banner">
              <div className="banner-content">
                <div className="banner-icon">🚀</div>
                <div>
                  <p className="banner-title">You're all set, {user?.email?.split('@')[0]}!</p>
                  <p className="banner-sub">Sprint 2 workspace features are ready. Set up your academic profile to get started.</p>
                </div>
              </div>
              <button className="banner-close" onClick={() => setBannerVisible(false)}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
              </button>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}