import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { academicApi } from '../api/academicApi';
import '../styles/setup.css';
 
export default function Setup() {
  const [year, setYear] = useState(1);
  const [semester, setSemester] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
 
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await academicApi.setupProfile({ academicYear: year, semester });
      navigate('/subjects');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save profile.');
    } finally { setLoading(false); }
  };
 
  return (
    <div className="setup-root">
      <div className="setup-bg">
        <div className="setup-orb orb-a" /><div className="setup-orb orb-b" />
      </div>
      <div className="setup-center">
        <div className="setup-card">
          <div className="setup-icon">
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
              <rect width="40" height="40" rx="12" fill="#1a3a6e"/>
              <path d="M20 8L32 15V21C32 28.732 26.627 36.065 20 38C13.373 36.065 8 28.732 8 21V15L20 8Z" fill="white"/>
              <path d="M15 21L18.5 24.5L25 18" stroke="#1a3a6e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h1 className="setup-title">Set up your academic profile</h1>
          <p className="setup-sub">Tell us your current year and semester so we can personalise your workspace.</p>
          {error && <div className="setup-error">{error}</div>}
          <form onSubmit={handleSubmit} className="setup-form">
            <div className="setup-field-group">
              <label className="setup-label">Academic Year</label>
              <div className="setup-pills">
                {[1,2,3,4].map(y => (
                  <button key={y} type="button"
                    className={`setup-pill ${year === y ? 'setup-pill--active' : ''}`}
                    onClick={() => setYear(y)}>Year {y}</button>
                ))}
              </div>
            </div>
            <div className="setup-field-group">
              <label className="setup-label">Semester</label>
              <div className="setup-pills">
                {[1,2].map(s => (
                  <button key={s} type="button"
                    className={`setup-pill ${semester === s ? 'setup-pill--active' : ''}`}
                    onClick={() => setSemester(s)}>Semester {s}</button>
                ))}
              </div>
            </div>
            <button type="submit" disabled={loading} className="setup-btn">
              {loading ? <><span className="setup-spinner"/>Saving...</> : <>Continue to Subjects →</>}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
