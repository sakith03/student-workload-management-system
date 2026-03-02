import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { groupsApi } from '../../api/groupsApi';
import { academicApi } from '../../api/academicApi';
import MainLayout from '../../components/MainLayout';
import '../../styles/workspace.css';

export default function WorkspaceList() {
  const [groups, setGroups] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ subjectId: '', name: '', description: '', maxMembers: 6 });
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const [params] = useSearchParams();

  useEffect(() => {
    Promise.all([groupsApi.getMyGroups(), academicApi.getSubjects()])
      .then(([g, s]) => { setGroups(g.data); setSubjects(s.data); })
      .finally(() => setLoading(false));
    if (params.get('subject'))
      setCreateForm(p => ({ ...p, subjectId: params.get('subject') }));
  }, [params]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const { data } = await groupsApi.createGroup({
        ...createForm, maxMembers: Number(createForm.maxMembers)
      });
      navigate(`/workspace/${data.groupId}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create group.');
    }
  };

  return (
    <MainLayout title="Workspaces">
      <div className="ws-header">
        <div>
          <p className="ws-sub">Group workspaces across all your subjects</p>
        </div>
        <button className="ws-btn" onClick={() => setShowCreate(p => !p)}>
          {showCreate ? 'Cancel' : '+ Create Group'}
        </button>
      </div>

      {error && <div className="ws-error">{error}</div>}

      {showCreate && (
        <div className="ws-form-card">
          <h3 className="ws-form-title">Create a new group</h3>
          <form onSubmit={handleCreate} className="ws-create-form">
            <div className="ws-field">
              <label className="ws-label">Subject</label>
              <select className="ws-input" value={createForm.subjectId}
                onChange={e => setCreateForm(p => ({ ...p, subjectId: e.target.value }))} required>
                <option value="">Select a subject...</option>
                {subjects.map(s => (
                  <option key={s.id} value={s.id}>{s.code} — {s.name}</option>
                ))}
              </select>
            </div>
            <div className="ws-form-row">
              <div className="ws-field">
                <label className="ws-label">Group Name</label>
                <input className="ws-input" placeholder="e.g. Team Alpha" required
                  value={createForm.name}
                  onChange={e => setCreateForm(p => ({ ...p, name: e.target.value }))} />
              </div>
              <div className="ws-field" style={{ flex: 0.4 }}>
                <label className="ws-label">Max Members</label>
                <select className="ws-input" value={createForm.maxMembers}
                  onChange={e => setCreateForm(p => ({ ...p, maxMembers: e.target.value }))}>
                  {[2, 3, 4, 5, 6, 7, 8].map(n => <option key={n}>{n}</option>)}
                </select>
              </div>
            </div>
            <div className="ws-field">
              <label className="ws-label">Description (optional)</label>
              <input className="ws-input" placeholder="What is this group working on?"
                value={createForm.description}
                onChange={e => setCreateForm(p => ({ ...p, description: e.target.value }))} />
            </div>
            <button type="submit" className="ws-btn">Create Group</button>
          </form>
        </div>
      )}

      {loading ? (
        <div className="ws-loading">Loading workspaces...</div>
      ) : groups.length === 0 ? (
        <div className="ws-empty">
          <div className="ws-empty-icon">◈</div>
          <p>No workspaces yet.</p>
          <p>Create a group for one of your subjects to get started.</p>
        </div>
      ) : (
        <div className="ws-grid">
          {groups.map(g => {
            const sub = subjects.find(s => s.id === g.subjectId);
            return (
              <div key={g.id} className="ws-card"
                style={{ '--ws-color': sub?.color || '#3b82f6' }}
                onClick={() => navigate(`/workspace/${g.id}`)}>
                <div className="ws-card-top">
                  <span className="ws-card-code">{sub?.code || 'Subject'}</span>
                </div>
                <h3 className="ws-card-name">{g.name}</h3>
                <p className="ws-card-subject">{sub?.name}</p>
                <div className="ws-card-footer">
                  <span className="ws-card-open">Open Workspace →</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </MainLayout>
  );
}
