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
        name: '',
        description: '',
        semester: 'Y3S1', // Should ideally come from profile
        targetHoursPerWeek: 2,
        colorTag: 'Blue'
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
                .then(r => setGoals(r))
                .catch(() => setGoals([]))
                .finally(() => setFetching(false));
        }
    }, [selectedModuleId]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const payload = {
                ...form,
                subjectId: selectedModuleId
            };

            if (editingGoal) {
                const data = await moduleService.updateModule(editingGoal.id, payload);
                setGoals(prev => prev.map(g => g.id === data.id ? data : g));
            } else {
                const data = await moduleService.createModule(payload);
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
            name: goal.name,
            description: goal.description || '',
            semester: goal.semester,
            targetHoursPerWeek: goal.targetHoursPerWeek,
            colorTag: goal.colorTag || 'Blue'
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
        setForm({ name: '', description: '', semester: 'Y3S1', targetHoursPerWeek: 2, colorTag: 'Blue' });
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
                                <label className="subjects-label">Goal/Task Name</label>
                                <input
                                    required
                                    className="subjects-input"
                                    value={form.name}
                                    onChange={e => setForm({ ...form, name: e.target.value })}
                                    placeholder="e.g. Complete Lab 1"
                                />
                            </div>
                            <div className="subjects-field">
                                <label className="subjects-label">Estimated Hours</label>
                                <input
                                    type="number"
                                    step="0.5"
                                    required
                                    className="subjects-input"
                                    value={form.targetHoursPerWeek}
                                    onChange={e => setForm({ ...form, targetHoursPerWeek: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="subjects-form-row">
                            <div className="subjects-field">
                                <label className="subjects-label">Semester/Tag</label>
                                <input
                                    required
                                    className="subjects-input"
                                    value={form.semester}
                                    onChange={e => setForm({ ...form, semester: e.target.value })}
                                    placeholder="e.g. Y3S1"
                                />
                            </div>
                            <div className="subjects-field">
                                <label className="subjects-label">Color Tag</label>
                                <select
                                    className="subjects-input"
                                    value={form.colorTag}
                                    onChange={e => setForm({ ...form, colorTag: e.target.value })}
                                >
                                    <option>Blue</option>
                                    <option>Green</option>
                                    <option>Purple</option>
                                    <option>Red</option>
                                    <option>Gray</option>
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
                                        <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#1a3a6e' }}>{goal.name}</h4>
                                        <span className="info-badge badge--student" style={{
                                            background: '#eef2ff',
                                            color: '#4338ca'
                                        }}>
                                            {goal.semester}
                                        </span>
                                    </div>
                                    <p style={{ margin: '0 0 12px 0', fontSize: '0.875rem', color: '#64748b' }}>{goal.description || 'No description provided.'}</p>
                                    <div style={{ display: 'flex', gap: '20px', fontSize: '0.8rem', color: '#94a3b8', fontWeight: 500 }}>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline>
                                            </svg>
                                            Target: {goal.targetHoursPerWeek} hrs/week
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
