import { useState, useEffect } from 'react';
import { academicApi } from '../api/academicApi';
import { useAuth } from '../context/AuthContext';
import MainLayout from '../components/MainLayout';
import '../styles/setup.css';

export default function Settings() {
    const { user } = useAuth();
    const [profile, setProfile] = useState({ academicYear: 1, semester: 1 });
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [toast, setToast] = useState(null);

    useEffect(() => {
        academicApi.getProfile()
            .then(r => setProfile(r.data))
            .catch(() => { })
            .finally(() => setFetching(false));
    }, []);

    const handleUpdate = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await academicApi.setupProfile(profile);
            showToast('Profile updated successfully!');
        } catch (err) {
            showToast('Failed to update profile.', true);
        } finally {
            setLoading(false);
        }
    };

    const showToast = (msg, isError = false) => {
        setToast({ msg, isError });
        setTimeout(() => setToast(null), 3000);
    };

    return (
        <MainLayout title="Settings">
            <div style={{ maxWidth: '600px' }}>
                <p style={{ color: '#64748b', marginBottom: '24px' }}>Manage your account and academic preferences.</p>

                {/* Academic Profile */}
                <div className="info-card" style={{ marginBottom: '24px', animation: 'none' }}>
                    <div className="info-card-header">
                        <h3 className="info-card-title">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
                            </svg>
                            Academic Profile
                        </h3>
                    </div>
                    <div style={{ padding: '24px' }}>
                        {fetching ? <p>Loading profile...</p> : (
                            <form onSubmit={handleUpdate} className="auth-form">
                                <div className="field-group">
                                    <label className="field-label">Current Academic Year</label>
                                    <div className="setup-pills">
                                        {[1, 2, 3, 4].map(y => (
                                            <button key={y} type="button"
                                                className={`setup-pill ${profile.academicYear === y ? 'setup-pill--active' : ''}`}
                                                onClick={() => setProfile({ ...profile, academicYear: y })}>Year {y}</button>
                                        ))}
                                    </div>
                                </div>

                                <div className="field-group">
                                    <label className="field-label">Current Semester</label>
                                    <div className="setup-pills">
                                        {[1, 2].map(s => (
                                            <button key={s} type="button"
                                                className={`setup-pill ${profile.semester === s ? 'setup-pill--active' : ''}`}
                                                onClick={() => setProfile({ ...profile, semester: s })}>Semester {s}</button>
                                        ))}
                                    </div>
                                </div>

                                <button type="submit" disabled={loading} className="auth-btn" style={{ width: 'fit-content', padding: '10px 24px' }}>
                                    {loading ? 'Saving...' : 'Update Profile'}
                                </button>
                            </form>
                        )}
                    </div>
                </div>

                {/* Account Info */}
                <div className="info-card" style={{ animation: 'none' }}>
                    <div className="info-card-header">
                        <h3 className="info-card-title">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                <circle cx="12" cy="7" r="4"></circle>
                            </svg>
                            Account Information
                        </h3>
                    </div>
                    <div className="info-rows">
                        <div className="info-row">
                            <span className="info-row-label">Email Address</span>
                            <span className="info-row-value">{user?.email}</span>
                        </div>
                        <div className="info-row info-row--last">
                            <span className="info-row-label">Role</span>
                            <span className={`info-badge ${user?.role === 'Student' ? 'badge--student' : 'badge--lecturer'}`}>
                                {user?.role}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* TOAST NOTIFICATION */}
            {toast && (
                <div style={{
                    position: 'fixed', bottom: '24px', right: '24px',
                    background: toast.isError ? '#ef4444' : '#059669',
                    color: '#fff', padding: '12px 24px', borderRadius: '12px',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                    display: 'flex', alignItems: 'center', gap: '10px',
                    zIndex: 1000, animation: 'fadeSlideUp 0.3s ease'
                }}>
                    {toast.isError ? '✕' : '✓'} {toast.msg}
                </div>
            )}
        </MainLayout>
    );
}
