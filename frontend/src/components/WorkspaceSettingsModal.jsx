import { useState, useEffect } from 'react';
import { groupsApi } from '../api/groupsApi';
import { academicApi } from '../api/academicApi';

export default function WorkspaceSettingsModal({
  groupId,
  onClose,
  onSaved,
  onDeleted,
  title = 'Workspace settings',
}) {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [form, setForm] = useState({
    subjectId: '',
    name: '',
    description: '',
    maxMembers: 6,
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const [groupRes, subjectsRes] = await Promise.all([
          groupsApi.getGroup(groupId),
          academicApi.getSubjects(),
        ]);
        if (cancelled) return;
        const g = groupRes.data;
        setSubjects(subjectsRes.data || []);
        setForm({
          subjectId: String(g.subjectId),
          name: g.name || '',
          description: g.description || '',
          maxMembers: g.maxMembers || 6,
        });
      } catch {
        if (!cancelled) setError('Could not load workspace.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [groupId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await groupsApi.updateGroup(groupId, {
        name: form.name.trim(),
        description: form.description.trim(),
        maxMembers: Number(form.maxMembers),
        subjectId: form.subjectId,
      });
      onSaved?.();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save changes.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    setError('');
    setDeleting(true);
    try {
      await groupsApi.deleteGroup(groupId);
      onDeleted?.();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete workspace.');
      setConfirmDelete(false);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="ws-modal-backdrop" onClick={onClose}>
      <div
        className="ws-modal ws-form-card"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="ws-settings-title"
      >
        <div className="ws-modal-head">
          <h3 id="ws-settings-title" className="ws-form-title" style={{ margin: 0 }}>
            {title}
          </h3>
          <button type="button" className="ws-modal-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        {loading ? (
          <div className="ws-loading" style={{ padding: 32 }}>
            Loading…
          </div>
        ) : (
          <>
            {error && <div className="ws-error">{error}</div>}
            <form onSubmit={handleSubmit} className="ws-create-form">
              <div className="ws-field">
                <label className="ws-label">Subject</label>
                <select
                  className="ws-input"
                  value={form.subjectId}
                  onChange={(e) => setForm((p) => ({ ...p, subjectId: e.target.value }))}
                  required
                >
                  <option value="">Select a subject…</option>
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.code} — {s.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="ws-form-row">
                <div className="ws-field">
                  <label className="ws-label">Workspace name</label>
                  <input
                    className="ws-input"
                    required
                    value={form.name}
                    onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  />
                </div>
                <div className="ws-field" style={{ flex: 0.4 }}>
                  <label className="ws-label">Max members</label>
                  <select
                    className="ws-input"
                    value={form.maxMembers}
                    onChange={(e) => setForm((p) => ({ ...p, maxMembers: e.target.value }))}
                  >
                    {[2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="ws-field">
                <label className="ws-label">Description (optional)</label>
                <input
                  className="ws-input"
                  value={form.description}
                  onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                  placeholder="What is this group working on?"
                />
              </div>
              <div className="ws-modal-actions">
                <button type="submit" className="ws-btn" disabled={saving}>
                  {saving ? 'Saving…' : 'Save changes'}
                </button>
              </div>
            </form>

            <div className="ws-danger-zone">
              <p className="ws-danger-label">Delete workspace</p>
              <p className="ws-danger-hint">
                This removes the workspace for everyone. Team chat and related data for this group are removed.
              </p>
              <button
                type="button"
                className={`ws-btn ws-btn--ghost-danger ${confirmDelete ? 'ws-btn--danger-confirm' : ''}`}
                disabled={deleting}
                onClick={handleDelete}
              >
                {deleting
                  ? 'Deleting…'
                  : confirmDelete
                    ? 'Click again to confirm delete'
                    : 'Delete workspace'}
              </button>
              {confirmDelete && (
                <button
                  type="button"
                  className="ws-btn-text"
                  onClick={() => setConfirmDelete(false)}
                >
                  Cancel
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
