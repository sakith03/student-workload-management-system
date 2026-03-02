import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { moduleService } from '../api/moduleService';
import { academicApi } from '../api/academicApi';
import MainLayout from '../components/MainLayout';
import '../styles/workspace.css';

export default function Goals() {
    const [searchParams] = useSearchParams();
    const moduleParam = searchParams.get('module');

    const [goals, setGoals] = useState([]);
    const [modules, setModules] = useState([]);
    const [selectedModuleId, setSelectedModuleId] = useState(moduleParam || '');
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingGoal, setEditingGoal] = useState(null);

    const [form, setForm] = useState({
        title: '',
        description: '',
        dueDate: '',
        importance: 'Medium',
        status: 'Planned'
    });

    useEffect(() => {
        academicApi.getSubjects().then(r => {
            setModules(r.data);
            if (!moduleParam && r.data.length > 0) {
                setSelectedModuleId(r.data[0].id);
            }
        });
    }, [moduleParam]);

    useEffect(() => {
        if (selectedModuleId) {
            setFetching(true);
            moduleService.getModules(selectedModuleId)
                .then(r => setGoals(r.data))
                .catch(() => setGoals([]))
                .finally(() => setFetching(false));
        }
    }, [selectedModuleId]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (editingGoal) {
                const { data } = await moduleService.updateModule(editingGoal.id, {
                    ...form,
                    moduleId: selectedModuleId
                });
                setGoals(prev => prev.map(g => g.id === data.id ? data : g));
            } else {
                const { data } = await moduleService.createModule({
                    ...form,
                    moduleId: selectedModuleId
                });
                setGoals(prev => [...prev, data]);
            }
            resetForm();
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (goal) => {
        setEditingGoal(goal);
        setForm({
            title: goal.title,
            description: goal.description,
            dueDate: goal.dueDate ? goal.dueDate.split('T')[0] : '',
            importance: goal.importance,
            status: goal.status
        });
        setShowForm(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this goal?')) return;
        try {
            await moduleService.deleteModule(id);
            setGoals(prev => prev.filter(g => g.id !== id));
        } catch (err) {
            console.error(err);
        }
    };

    const resetForm = () => {
        setForm({ title: '', description: '', dueDate: '', importance: 'Medium', status: 'Planned' });
        setEditingGoal(null);
        setShowForm(false);
    };

    return (
        <MainLayout title="My Goals">
            <div className="workspace-header" style={{ marginBottom: '30px' }}>
                <div>
                    <p className="workspace-sub">Track and manage your module-specific goals</p>
                </div>
                <div className="workspace-header-actions" style={{ display: 'flex', gap: '12px' }}>
                    <select
                        className="subjects-input"
                        style={{ width: '240px', margin: 0 }}
                        value={selectedModuleId}
                        onChange={(e) => setSelectedModuleId(e.target.value)}
                    >
                        <option value="" disabled>Select a module</option>
                        {modules.map(m => (
                            <option key={m.id} value={m.id}>{m.code} - {m.name}</option>
                        ))}
                    </select>
                    <button className="subjects-btn" onClick={() => setShowForm(true)} disabled={!selectedModuleId}>
                        + Add Goal
                    </button>
                </div>
            </div>

            {showForm && (
                <div className="subjects-form-card" style={{ marginBottom: '30px' }}>
                    <h3 className="subjects-form-title">{editingGoal ? 'Edit Goal' : 'Add a Goal'}</h3>
                    <form onSubmit={handleSubmit} className="subjects-form">
                        <div className="subjects-form-row">
                            <div className="subjects-field" style={{ flex: 2 }}>
                                <label className="subjects-label">Goal Title</label>
                                <input
                                    required
                                    className="subjects-input"
                                    value={form.title}
                                    onChange={e => setForm({ ...form, title: e.target.value })}
                                    placeholder="e.g. Complete Lab 1"
                                />
                            </div>
                            <div className="subjects-field">
                                <label className="subjects-label">Due Date</label>
                                <input
                                    type="date"
                                    required
                                    className="subjects-input"
                                    value={form.dueDate}
                                    onChange={e => setForm({ ...form, dueDate: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="subjects-form-row">
                            <div className="subjects-field">
                                <label className="subjects-label">Importance</label>
                                <select
                                    className="subjects-input"
                                    value={form.importance}
                                    onChange={e => setForm({ ...form, importance: e.target.value })}
                                >
                                    <option>Low</option>
                                    <option>Medium</option>
                                    <option>High</option>
                                </select>
                            </div>
                            <div className="subjects-field">
                                <label className="subjects-label">Status</label>
                                <select
                                    className="subjects-input"
                                    value={form.status}
                                    onChange={e => setForm({ ...form, status: e.target.value })}
                                >
                                    <option>Planned</option>
                                    <option>In Progress</option>
                                    <option>Completed</option>
                                </select>
                            </div>
                        </div>
                        <div className="subjects-field">
                            <label className="subjects-label">Description (Optional)</label>
                            <textarea
                                className="subjects-input"
                                style={{ minHeight: '80px', paddingTop: '10px' }}
                                value={form.description}
                                onChange={e => setForm({ ...form, description: e.target.value })}
                                placeholder="Details about what you need to achieve..."
                            />
                        </div>
                        <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                            <button type="submit" disabled={loading} className="subjects-btn">
                                {editingGoal ? 'Update Goal' : 'Create Goal'}
                            </button>
                            <button type="button" onClick={resetForm} className="subjects-btn-outline">
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {fetching ? (
                <div className="subjects-loading">Loading goals...</div>
            ) : !selectedModuleId ? (
                <div className="subjects-empty">Please select a module to view goals.</div>
            ) : goals.length === 0 ? (
                <div className="subjects-empty">
                    <p>No goals for this module yet.</p>
                    <button className="subjects-btn-outline" style={{ marginTop: '12px' }} onClick={() => setShowForm(true)}>
                        Add your first goal
                    </button>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {goals.map(goal => (
                        <div
                            key={goal.id}
                            className="info-card"
                            style={{
                                animation: 'none',
                                borderLeft: `5px solid ${goal.importance === 'High' ? '#ef4444' : goal.importance === 'Medium' ? '#f59e0b' : '#3b82f6'}`
                            }}
                        >
                            <div style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
                                        <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#1a3a6e' }}>{goal.title}</h4>
                                        <span className={`info-badge ${goal.status === 'Completed' ? 'badge--student' : 'badge--lecturer'}`} style={{
                                            background: goal.status === 'Completed' ? '#d1fae5' : goal.status === 'In Progress' ? '#fff7ed' : '#f1f5f9',
                                            color: goal.status === 'Completed' ? '#065f46' : goal.status === 'In Progress' ? '#c2410c' : '#475569'
                                        }}>
                                            {goal.status}
                                        </span>
                                    </div>
                                    <p style={{ margin: '0 0 12px 0', fontSize: '0.875rem', color: '#64748b' }}>{goal.description || 'No description provided.'}</p>
                                    <div style={{ display: 'flex', gap: '20px', fontSize: '0.8rem', color: '#94a3b8', fontWeight: 500 }}>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line>
                                            </svg>
                                            Due: {goal.dueDate ? new Date(goal.dueDate).toLocaleDateString() : 'No date'}
                                        </span>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"></path>
                                            </svg>
                                            {goal.importance} Importance
                                        </span>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button className="copy-btn" onClick={() => handleEdit(goal)} title="Edit Goal">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                                    </button>
                                    <button className="copy-btn" onClick={() => handleDelete(goal.id)} title="Delete Goal" style={{ color: '#ef4444' }}>
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </MainLayout>
    );
}
