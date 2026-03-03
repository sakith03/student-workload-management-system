import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axiosConfig';
import '../styles/auth.css';
import { invitationsApi } from '../api/invitationsApi';


export default function Register() {
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '', role: 'Student' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (name === 'password') {
      let strength = 0;
      if (value.length >= 8) strength++;
      if (/[A-Z]/.test(value)) strength++;
      if (/[0-9]/.test(value)) strength++;
      if (/[^A-Za-z0-9]/.test(value)) strength++;
      setPasswordStrength(strength);
    }
  };

  const handleRoleSelect = (role) => {
    setForm(prev => ({ ...prev, role }));
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      // Register
      await api.post('/auth/register', form);

<<<<<<< HEAD
      // Auto-login
=======
      // Auto-login after registration
>>>>>>> 93ea15873d0f5d554e9a22d1c91332c6e3ad28fb
      const { data } = await api.post('/auth/login', {
        email: form.email,
        password: form.password
      });

<<<<<<< HEAD
      login(data.token);
      navigate('/onboarding');
=======
      // Use AuthContext login for correct token key and state update
      login(data.token);

      // ✚ Check for pending invite
      const pendingToken = sessionStorage.getItem('pendingInviteToken');
      if (pendingToken) {
        sessionStorage.removeItem('pendingInviteToken');
        try {
          const { data: inviteData } = await invitationsApi.acceptInvitation(pendingToken);
          navigate(`/workspace/${inviteData.groupId}`);
        } catch {
          navigate('/onboarding');
        }
      } else {
        navigate('/onboarding');
      }
>>>>>>> 93ea15873d0f5d554e9a22d1c91332c6e3ad28fb
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };



  const strengthLabels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
  const strengthColors = ['', '#ef4444', '#f97316', '#eab308', '#22c55e'];

  return (
    <div className="auth-root">
      <div className="auth-bg">
        <div className="auth-bg-orb orb-1" />
        <div className="auth-bg-orb orb-2" />
        <div className="auth-bg-orb orb-3" />
        <div className="auth-grid-overlay" />
      </div>

      <div className="auth-split register-split">
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
              Join thousands of students managing their academic life smarter.
            </p>
            <ul className="auth-features">
              <li><span className="feature-icon">◈</span>Free for all university students</li>
              <li><span className="feature-icon">◈</span>Secure JWT-authenticated sessions</li>
              <li><span className="feature-icon">◈</span>Role-based access for students &amp; lecturers</li>
            </ul>
            <div className="auth-left-footer">
              <span className="auth-left-badge">Sprint 1 · Authentication</span>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className="auth-right">
          <div className="auth-card register-card">
            <div className="auth-card-header">
              <h2 className="auth-title">Create account</h2>
              <p className="auth-subtitle">Get started with LoadMate today</p>
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
              {/* Role selector */}
              <div className="role-selector">
                <button
                  type="button"
                  className={`role-pill ${form.role === 'Student' ? 'role-pill--active' : ''}`}
                  onClick={() => handleRoleSelect('Student')}
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <circle cx="8" cy="5" r="3" stroke="currentColor" strokeWidth="1.5" />
                    <path d="M2 14c0-3.314 2.686-6 6-6s6 2.686 6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                  Student
                </button>
                <button
                  type="button"
                  className={`role-pill ${form.role === 'Lecturer' ? 'role-pill--active' : ''}`}
                  onClick={() => handleRoleSelect('Lecturer')}
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <rect x="2" y="3" width="12" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
                    <path d="M5 13h6M8 12v1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    <path d="M5 7h6M5 9h4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                  </svg>
                  Lecturer
                </button>
              </div>

              <div className="field-row">
                <div className="field-group">
                  <label className="field-label">First name</label>
                  <div className="field-wrap">
                    <input
                      name="firstName"
                      value={form.firstName}
                      onChange={handleChange}
                      required
                      placeholder="John"
                      className="field-input field-input--no-icon"
                    />
                  </div>
                </div>
                <div className="field-group">
                  <label className="field-label">Last name</label>
                  <div className="field-wrap">
                    <input
                      name="lastName"
                      value={form.lastName}
                      onChange={handleChange}
                      required
                      placeholder="Doe"
                      className="field-input field-input--no-icon"
                    />
                  </div>
                </div>
              </div>

              <div className="field-group">
                <label className="field-label">University email</label>
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
                    minLength={8}
                    placeholder="Min. 8 characters"
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
                {form.password.length > 0 && (
                  <div className="strength-meter">
                    <div className="strength-bars">
                      {[1, 2, 3, 4].map(i => (
                        <div
                          key={i}
                          className="strength-bar"
                          style={{ background: i <= passwordStrength ? strengthColors[passwordStrength] : '#e2e8f0' }}
                        />
                      ))}
                    </div>
                    <span className="strength-label" style={{ color: strengthColors[passwordStrength] }}>
                      {strengthLabels[passwordStrength]}
                    </span>
                  </div>
                )}
              </div>

              <button type="submit" disabled={loading} className="auth-btn">
                {loading ? (
                  <>
                    <span className="btn-spinner" />
                    Creating account...
                  </>
                ) : (
                  <>
                    Create Account
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                      <path d="M3 9h12M10 4l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </>
                )}
              </button>
            </form>

            <p className="auth-switch">
              Already have an account?{' '}
              <Link to="/login" className="auth-link">Sign in</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}