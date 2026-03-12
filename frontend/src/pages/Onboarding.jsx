import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { academicApi } from '../api/academicApi';
import '../styles/auth.css';
import '../styles/setup.css';

export default function Onboarding() {
    const [step, setStep] = useState(1);
    const [year, setYear] = useState(1);
    const [semester, setSemester] = useState(1);
    const [code, setCode] = useState('');
    const [name, setName] = useState('');
    const [creditHours, setCreditHours] = useState(3);
    const [color, setColor] = useState('#3b82f6');
    const [addedModules, setAddedModules] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleStep1Submit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await academicApi.setupProfile({ academicYear: year, semester });
            setStep(2);
            setError('');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to save academic profile.');
        } finally {
            setLoading(false);
        }
    };

    const handleAddModule = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const { data } = await academicApi.addSubject({
                code,
                name,
                creditHours: Number(creditHours),
                color
            });
            setAddedModules(prev => [...prev, data]);
            setCode('');
            setName('');
            setError('');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to add module.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-root">
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
                            Let's get you set up. This will only take a minute.
                        </p>
                        <ul className="auth-features">
                            <li>
                                <span className="feature-icon">◈</span>
                                Select your academic year and semester
                            </li>
                            <li>
                                <span className="feature-icon">◈</span>
                                Add your modules for this semester
                            </li>
                            <li>
                                <span className="feature-icon">◈</span>
                                Start managing your workload
                            </li>
                        </ul>
                        <div className="auth-left-footer">
                            <span className="auth-left-badge">Sprint 2 · Workspace</span>
                        </div>
                    </div>
                </div>

                {/* RIGHT PANEL */}
                <div className="auth-right">
                    <div className="auth-card">
                        <span style={{
                            display: 'inline-block', background: '#eff6ff', color: '#2563eb',
                            fontSize: '0.75rem', fontWeight: 600, padding: '4px 12px',
                            borderRadius: '100px', marginBottom: '20px'
                        }}>
                            {step === 1 ? 'Step 1 of 2 — Academic Profile' : 'Step 2 of 2 — Add Your Modules'}
                        </span>

                        {step === 1 ? (
                            <>
                                <div className="auth-card-header">
                                    <h2 className="auth-title">Your academic profile</h2>
                                    <p className="auth-subtitle">Tell us your current year and semester.</p>
                                </div>

                                {error && <div className="auth-error">{error}</div>}

                                <form onSubmit={handleStep1Submit} className="auth-form">
                                    <div className="field-group">
                                        <label className="field-label">Academic Year</label>
                                        <div className="setup-pills">
                                            {[1, 2, 3, 4].map(y => (
                                                <button key={y} type="button"
                                                    className={`setup-pill ${year === y ? 'setup-pill--active' : ''}`}
                                                    onClick={() => setYear(y)}>Year {y}</button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="field-group">
                                        <label className="field-label">Semester</label>
                                        <div className="setup-pills">
                                            {[1, 2].map(s => (
                                                <button key={s} type="button"
                                                    className={`setup-pill ${semester === s ? 'setup-pill--active' : ''}`}
                                                    onClick={() => setSemester(s)}>Semester {s}</button>
                                            ))}
                                        </div>
                                    </div>

                                    <button type="submit" disabled={loading} className="auth-btn">
                                        {loading ? 'Saving...' : 'Continue →'}
                                    </button>
                                </form>
                            </>
                        ) : (
                            <>
                                <div className="auth-card-header">
                                    <h2 className="auth-title">Add your modules</h2>
                                    <p className="auth-subtitle">
                                        Add modules you are studying this semester.
                                        You can add more later from My Modules.
                                    </p>
                                </div>

                                {error && <div className="auth-error">{error}</div>}

                                <form onSubmit={handleAddModule} className="auth-form">
                                    <div className="field-group">
                                        <label className="field-label">Module Code</label>
                                        <div className="field-wrap">
                                            <input
                                                type="text"
                                                value={code}
                                                onChange={e => setCode(e.target.value)}
                                                required
                                                placeholder="e.g. CSP6001"
                                                className="field-input field-input--no-icon"
                                            />
                                        </div>
                                    </div>

                                    <div className="field-group">
                                        <label className="field-label">Module Name</label>
                                        <div className="field-wrap">
                                            <input
                                                type="text"
                                                value={name}
                                                onChange={e => setName(e.target.value)}
                                                required
                                                placeholder="e.g. Cloud Systems Programming"
                                                className="field-input field-input--no-icon"
                                            />
                                        </div>
                                    </div>

                                    <div className="field-group">
                                        <label className="field-label">Credit Hours</label>
                                        <div className="field-wrap">
                                            <select
                                                value={creditHours}
                                                onChange={e => setCreditHours(e.target.value)}
                                                className="field-input field-input--no-icon"
                                            >
                                                {[1, 2, 3, 4, 5, 6].map(c => <option key={c} value={c}>{c}</option>)}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="field-group">
                                        <label className="field-label">Colour</label>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '4px' }}>
                                            {['#3b82f6', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899'].map(c => (
                                                <button
                                                    key={c}
                                                    type="button"
                                                    onClick={() => setColor(c)}
                                                    style={{
                                                        width: '28px', height: '28px',
                                                        borderRadius: '50%', border: 'none', cursor: 'pointer',
                                                        background: c, transition: 'all 0.2s',
                                                        outline: color === c ? '3px solid #1a3a6e' : 'none',
                                                        outlineOffset: color === c ? '2px' : '0',
                                                        transform: color === c ? 'scale(1.2)' : 'scale(1)'
                                                    }}
                                                />
                                            ))}
                                        </div>
                                    </div>

                                    <button type="submit" disabled={loading} className="auth-btn">
                                        {loading ? 'Adding...' : 'Add Module'}
                                    </button>
                                </form>

                                <div style={{ marginTop: '20px', display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                    {addedModules.map((mod, idx) => (
                                        <span key={idx} style={{
                                            display: 'inline-flex', alignItems: 'center', gap: '6px',
                                            padding: '4px 12px', borderRadius: '100px', margin: '4px',
                                            background: `color-mix(in srgb, ${mod.color} 15%, white)`,
                                            border: `1px solid ${mod.color}`, fontSize: '0.8rem'
                                        }}>
                                            <span style={{ width: 8, height: 8, borderRadius: '50%', background: mod.color, display: 'inline-block' }} />
                                            {mod.code} — {mod.name}
                                        </span>
                                    ))}
                                </div>

                                <button
                                    onClick={() => navigate('/dashboard')}
                                    disabled={addedModules.length === 0}
                                    className="auth-btn"
                                    style={{ marginTop: '16px', opacity: addedModules.length === 0 ? 0.5 : 1 }}
                                >
                                    Done, go to Dashboard →
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
