import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { academicApi } from '../api/academicApi';
import api from '../api/axiosConfig';
import '../styles/auth.css';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', form);
      login(data.token);

      // Check for academic profile setup
      let hasProfile = false;
      try {
        await academicApi.getProfile();
        hasProfile = true;
      } catch (err) {
        if (err.response?.status === 404) {
          hasProfile = false;
        } else {
          // If some other error occurs, default to dashboard but ideally onboarding
          hasProfile = true;
        }
      }

      navigate(hasProfile ? '/dashboard' : '/onboarding');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Check credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-root">
      {/* Animated background */}
      <div className="auth-bg">
        <div className="auth-bg-orb orb-1" />
        <div className="auth-bg-orb orb-2" />
        <div className="auth-bg-orb orb-3" />
        <div className="auth-grid-overlay" />
      </div>

      <div className="auth-split">
        {/* LEFT PANEL */}
        <div className="auth-left">
          <div className="auth-left-inner">
            <div className="brand-mark">
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                <rect width="48" height="48" rx="14" fill="rgba(255,255,255,0.15)" />
                <path d="M24 10L38 18V24C38 32.837 31.732 41.08 24 43C16.268 41.08 10 32.837 10 24V18L24 10Z" fill="rgba(255,255,255,0.9)" />
                <path d="M19 24L22.5 27.5L29 21" stroke="#1a3a6e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div className="auth-left-text">
              <h1 className="auth-brand-name">LoadMate</h1>
              <p className="auth-brand-sub">Student Workload System</p>
            </div>
            <div className="auth-left-divider" />
            <p className="auth-left-tagline">
              Manage your academic journey with clarity and precision.
            </p>
            <ul className="auth-features">
              <li>
                <span className="feature-icon">◈</span>
                Track assignments &amp; deadlines in real time
              </li>
              <li>
                <span className="feature-icon">◈</span>
                Collaborate with peers across modules
              </li>
              <li>
                <span className="feature-icon">◈</span>
                Monitor your workload intelligently
              </li>
            </ul>
            <div className="auth-left-footer">
              <span className="auth-left-badge">Sprint 1 · Authentication</span>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className="auth-right">
          <div className="auth-card login-card">
            <div className="auth-card-header">
              <h2 className="auth-title">Welcome back</h2>
              <p className="auth-subtitle">Sign in to continue to LoadMate</p>
            </div>

            {error && (
              <div className="auth-error">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M8 5v3M8 10.5v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="auth-form">
              <div className="field-group">
                <label className="field-label">Email address</label>
                <div className="field-wrap">
                  <svg className="field-icon" width="18" height="18" viewBox="0 0 18 18" fill="none">
                    <rect x="1.5" y="3.5" width="15" height="11" rx="2" stroke="currentColor" strokeWidth="1.5" />
                    <path d="M1.5 6.5L9 11L16.5 6.5" stroke="currentColor" strokeWidth="1.5" />
                  </svg>
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    required
                    placeholder="you@university.edu"
                    className="field-input"
                  />
                </div>
              </div>

              <div className="field-group">
                <label className="field-label">Password</label>
                <div className="field-wrap">
                  <svg className="field-icon" width="18" height="18" viewBox="0 0 18 18" fill="none">
                    <rect x="3" y="8" width="12" height="8" rx="2" stroke="currentColor" strokeWidth="1.5" />
                    <path d="M6 8V6a3 3 0 016 0v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    <circle cx="9" cy="12" r="1.25" fill="currentColor" />
                  </svg>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    required
                    placeholder="••••••••"
                    className="field-input"
                  />
                  <button
                    type="button"
                    className="field-toggle"
                    onClick={() => setShowPassword(p => !p)}
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                        <path d="M2 9s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z" stroke="currentColor" strokeWidth="1.5" />
                        <circle cx="9" cy="9" r="2" stroke="currentColor" strokeWidth="1.5" />
                        <path d="M3 3l12 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                      </svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                        <path d="M2 9s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z" stroke="currentColor" strokeWidth="1.5" />
                        <circle cx="9" cy="9" r="2" stroke="currentColor" strokeWidth="1.5" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={loading} className="auth-btn">
                {loading ? (
                  <>
                    <span className="btn-spinner" />
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign In
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                      <path d="M3 9h12M10 4l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </>
                )}
              </button>
            </form>

            <p className="auth-switch">
              No account yet?{' '}
              <Link to="/register" className="auth-link">Create one</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}