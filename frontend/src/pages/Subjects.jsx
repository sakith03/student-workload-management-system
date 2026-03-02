import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { academicApi } from '../api/academicApi';
import MainLayout from '../components/MainLayout';
import '../styles/subjects.css';

const COLORS = ['#3b82f6', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];

export default function Subjects() {
  const [subjects, setSubjects] = useState([]);
  const [form, setForm] = useState({ code: '', name: '', creditHours: 3, color: COLORS[0] });
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    academicApi.getSubjects()
      .then(r => setSubjects(r.data))
      .catch(() => { })
      .finally(() => setFetching(false));
  }, []);

  const handleChange = (e) => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleAdd = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await academicApi.addSubject({
        code: form.code, name: form.name,
        creditHours: Number(form.creditHours), color: form.color
      });
      setSubjects(prev => [...prev, data]);
      setForm({ code: '', name: '', creditHours: 3, color: COLORS[0] });
      setShowForm(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add subject.');
    } finally { setLoading(false); }
  };

  return (
    <MainLayout title="My Subjects">
      <div className="subjects-header">
        <div>
          <p className="subjects-sub">Manage your current semester subjects</p>
        </div>
        <div className="subjects-header-actions">
          <button className="subjects-btn-outline" onClick={() => navigate('/workspaces')}>
            View Workspaces &rarr;
          </button>
          <button className="subjects-btn" onClick={() => setShowForm(p => !p)}>
            {showForm ? 'Cancel' : '+ Add Subject'}
          </button>
        </div>
      </div>

      {showForm && (
        <div className="subjects-form-card">
          <h3 className="subjects-form-title">Add a subject</h3>
          {error && <div className="subjects-error">{error}</div>}
          <form onSubmit={handleAdd} className="subjects-form">
            <div className="subjects-form-row">
              <div className="subjects-field">
                <label className="subjects-label">Subject Code</label>
                <input name="code" value={form.code} onChange={handleChange} required
                  placeholder="e.g. CSP6001" className="subjects-input" />
              </div>
              <div className="subjects-field" style={{ flex: 2 }}>
                <label className="subjects-label">Subject Name</label>
                <input name="name" value={form.name} onChange={handleChange} required
                  placeholder="e.g. Cloud Systems Programming" className="subjects-input" />
              </div>
              <div className="subjects-field" style={{ flex: 0.5 }}>
                <label className="subjects-label">Credits</label>
                <select name="creditHours" value={form.creditHours} onChange={handleChange} className="subjects-input">
                  {[1, 2, 3, 4, 5, 6].map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div className="subjects-color-row">
              <label className="subjects-label">Colour</label>
              <div className="subjects-colors">
                {COLORS.map(c => (
                  <button key={c} type="button"
                    className={`subjects-color-btn ${form.color === c ? 'subjects-color-btn--active' : ''}`}
                    style={{ background: c }}
                    onClick={() => setForm(p => ({ ...p, color: c }))} />
                ))}
              </div>
            </div>
            <button type="submit" disabled={loading} className="subjects-btn">
              {loading ? 'Adding...' : 'Add Subject'}
            </button>
          </form>
        </div>
      )}

      {fetching ? (
        <div className="subjects-loading">Loading subjects...</div>
      ) : subjects.length === 0 ? (
        <div className="subjects-empty">
          <p>No subjects yet.</p>
          <p>Add your first subject above to get started.</p>
        </div>
      ) : (
        <div className="subjects-grid">
          {subjects.map(s => (
            <div key={s.id} className="subject-card" style={{ '--sub-color': s.color }}>
              <div className="subject-card-accent" />
              <div className="subject-card-body">
                <span className="subject-card-code">{s.code}</span>
                <h3 className="subject-card-name">{s.name}</h3>
                <span className="subject-card-credits">{s.creditHours} credits</span>
              </div>
              <button className="subject-card-btn"
                onClick={() => navigate(`/workspaces?subject=${s.id}`)}>
                View Groups →
              </button>
            </div>
          ))}
        </div>
      )}
    </MainLayout>
  );
}
