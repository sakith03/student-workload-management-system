// frontend/src/pages/Goals.jsx
import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { moduleService } from '../api/moduleService';
import { academicApi } from '../api/academicApi';
import { goalParserApi } from '../api/goalParserApi';
import MainLayout from '../components/MainLayout';
import '../styles/workspace.css';
import '../styles/goals.css';

// ── Constants ─────────────────────────────────────────────────────────────────

const COLOR_OPTIONS = ['Blue', 'Green', 'Purple', 'Red', 'Gray', 'Orange'];

const COLOR_HEX = {
    Blue: '#3b82f6',
    Green: '#10b981',
    Purple: '#8b5cf6',
    Red: '#ef4444',
    Gray: '#6b7280',
    Orange: '#f97316',
};

const EMPTY_FORM = {
    name: '',
    description: '',
    semester: '',
    targetHoursPerWeek: 2,
    colorTag: 'Blue',
    stepByStepGuidance: [],
    submissionGuidelines: '',
};

// ── Main Component ────────────────────────────────────────────────────────────

export default function Goals() {
    const [searchParams] = useSearchParams();
    const moduleParam = searchParams.get('module');

    // ── Data ──
    const [goals, setGoals] = useState([]);
    const [modules, setModules] = useState([]);
    const [selectedModuleId, setSelectedModuleId] = useState(moduleParam || '');
    const [fetching, setFetching] = useState(true);

    // ── Form step machine ──
    // null | 'upload' | 'loading' | 'ai-form' | 'guidance' | 'manual'
    const [formMode, setFormMode] = useState(null);
    const [form, setForm] = useState(EMPTY_FORM);
    const [editingGoal, setEditingGoal] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [formError, setFormError] = useState('');

    // ── Upload ──
    const [dragOver, setDragOver] = useState(false);
    const [uploadError, setUploadError] = useState('');
    const [uploadedFileName, setUploadedFileName] = useState('');
    const [aiMeta, setAiMeta] = useState(null);
    const fileRef = useRef(null);

    // ── Load modules ──────────────────────────────────────────────────────────
    useEffect(() => {
        academicApi.getSubjects().then(res => {
            setModules(res.data);
            if (!moduleParam && res.data.length > 0)
                setSelectedModuleId(res.data[0].id);
        }).catch(() => { });
    }, [moduleParam]);

    // ── Load goals when module changes ────────────────────────────────────────
    useEffect(() => {
        if (!selectedModuleId) { setFetching(false); return; }
        setFetching(true);
        moduleService.getModules(selectedModuleId)
            .then(r => setGoals(r))
            .catch(() => setGoals([]))
            .finally(() => setFetching(false));
    }, [selectedModuleId]);

    // ── Reset to clean state ──────────────────────────────────────────────────
    const resetAll = useCallback(() => {
        setFormMode(null);
        setForm(EMPTY_FORM);
        setEditingGoal(null);
        setAiMeta(null);
        setUploadedFileName('');
        setUploadError('');
        setFormError('');
    }, []);

    // ── File processing ───────────────────────────────────────────────────────
    const processFile = useCallback(async (file) => {
        if (!file) return;

        const ext = file.name.split('.').pop().toLowerCase();
        if (!['pdf', 'doc', 'docx'].includes(ext)) {
            setUploadError('Only PDF, DOC, or DOCX files are supported.');
            return;
        }
        if (file.size > 10 * 1024 * 1024) {
            setUploadError('File must be under 10 MB.');
            return;
        }

        setUploadedFileName(file.name);
        setUploadError('');
        setFormMode('loading');

        try {
            const { data } = await goalParserApi.parseDocument(file, selectedModuleId);

            // Pre-fill form with whatever AI extracted
            setForm({
                name: data.name || '',
                description: data.description || '',
                semester: data.semesterTag || '',
                targetHoursPerWeek: 2,
                colorTag: 'Blue',
                stepByStepGuidance: data.stepByStepGuidance || [],
                submissionGuidelines: data.submissionGuidelines || '',
            });

            setAiMeta({
                status: data.extractionStatus,
                percentage: data.extractionPercentage,
                extracted: data.fieldsExtracted,
                fileName: data.fileName,
            });

            setFormMode('ai-form');
        } catch (err) {
            setUploadError(
                err.response?.data?.message || 'AI processing failed. Please try again.'
            );
            setFormMode('upload');
        }
    }, [selectedModuleId]);

    const handleFileDrop = (e) => {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer.files?.[0];
        if (file) processFile(file);
    };

    const handleFileSelect = (e) => {
        const file = e.target.files?.[0];
        if (file) processFile(file);
        e.target.value = '';
    };

    // ── Core goal submit (shared by form and guidance panel) ──────────────────
    const submitGoal = useCallback(async () => {
        // Validate required fields before hitting the API
        if (!form.name.trim()) {
            setFormError('Goal name is required.');
            if (formMode === 'guidance') setFormMode('ai-form');
            return;
        }
        if (!form.semester.trim()) {
            setFormError('Semester tag is required.');
            if (formMode === 'guidance') setFormMode('ai-form');
            return;
        }

        setSubmitting(true);
        setFormError('');

        const payload = {
            ...form,
            subjectId: selectedModuleId,
            targetHoursPerWeek: Number(form.targetHoursPerWeek),
        };

        try {
            if (editingGoal) {
                // PUT returns 204 — no body. Rebuild updated object locally.
                await moduleService.updateModule(editingGoal.id, payload);
                const updatedGoal = {
                    ...editingGoal,
                    ...payload,
                    updatedAt: new Date().toISOString(),
                };
                setGoals(prev => prev.map(g =>
                    g.id === editingGoal.id ? updatedGoal : g
                ));
            } else {
                const created = await moduleService.createModule(payload);
                setGoals(prev => [created, ...prev]);
            }
            resetAll();
        } catch (err) {
            setFormError(
                err.response?.data?.message || 'Failed to save goal. Please try again.'
            );
        } finally {
            setSubmitting(false);
        }
    }, [form, selectedModuleId, editingGoal, formMode, resetAll]);

    const handleFormSubmit = (e) => {
        e.preventDefault();
        submitGoal();
    };

    // ── Edit / Delete ─────────────────────────────────────────────────────────
    const handleEdit = (goal) => {
        setEditingGoal(goal);
        setForm({
            name: goal.name || '',
            description: goal.description || '',
            semester: goal.semester || '',
            targetHoursPerWeek: goal.targetHoursPerWeek || 2,
            colorTag: goal.colorTag || 'Blue',
            stepByStepGuidance: goal.stepByStepGuidance || [],
            submissionGuidelines: goal.submissionGuidelines || '',
        });
        setAiMeta(null);
        setFormMode('manual');
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this goal? This cannot be undone.')) return;
        try {
            await moduleService.deleteModule(id);
            setGoals(prev => prev.filter(g => g.id !== id));
        } catch { /* silently fail — user sees no change */ }
    };

    // ── Quality colour helper ─────────────────────────────────────────────────
    const qualityColor = (status) => ({
        complete: '#22c55e',
        high: '#3b82f6',
        partial: '#f59e0b',
        minimal: '#f97316',
    }[status] || '#94a3b8');

    // ─────────────────────────────────────────────────────────────────────────
    return (
        <MainLayout title="My Goals">

            {/* ── Page Header ── */}
            <div style={{
                marginBottom: 24,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                flexWrap: 'wrap',
                gap: 12,
            }}>
                <p style={{ color: '#64748b', margin: 0, fontSize: '0.9rem' }}>
                    Track and manage your module-specific goals
                </p>

                <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                    {/* Module Selector */}
                    <select
                        className="subjects-input"
                        style={{ width: 220, margin: 0 }}
                        value={selectedModuleId}
                        onChange={e => setSelectedModuleId(e.target.value)}
                    >
                        <option value="" disabled>Select a module</option>
                        {modules.map(m => (
                            <option key={m.id} value={m.id}>{m.code} – {m.name}</option>
                        ))}
                    </select>

                    {/* Upload Lab Sheet */}
                    <button
                        className="goals-btn goals-btn--ai"
                        disabled={!selectedModuleId}
                        onClick={() => { resetAll(); setFormMode('upload'); }}
                        title={!selectedModuleId ? 'Select a module first' : ''}
                    >
                        <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
                            <path d="M8 2v8M5 5l3-3 3 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M2 11v2a1 1 0 001 1h10a1 1 0 001-1v-2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                        </svg>
                        Upload Lab Sheet
                    </button>

                    {/* Manual Add */}
                    <button
                        className="subjects-btn"
                        disabled={!selectedModuleId}
                        onClick={() => { resetAll(); setFormMode('manual'); }}
                    >
                        + Add Manually
                    </button>
                </div>
            </div>

            {/* ══════════════════════════════════════════════════════════════════
                STEP 1 — UPLOAD ZONE
            ══════════════════════════════════════════════════════════════════ */}
            {formMode === 'upload' && (
                <div className="goals-card" style={{ marginBottom: 24 }}>
                    <div className="goals-card-header">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div className="goals-ai-icon">✦</div>
                            <div>
                                <p style={{ margin: 0, fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: '0.95rem', color: '#0f172a' }}>
                                    AI Goal Extraction
                                </p>
                                <p style={{ margin: 0, fontSize: '0.78rem', color: '#64748b' }}>
                                    Upload your lab sheet — AI will fill in the details for you
                                </p>
                            </div>
                        </div>
                        <button className="goals-close-btn" onClick={resetAll}>✕</button>
                    </div>

                    <div style={{ padding: 24 }}>
                        <input
                            ref={fileRef}
                            type="file"
                            accept=".pdf,.doc,.docx"
                            onChange={handleFileSelect}
                            style={{ display: 'none' }}
                        />

                        <div
                            className={`goals-upload-zone ${dragOver ? 'goals-upload-zone--active' : ''}`}
                            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                            onDragLeave={() => setDragOver(false)}
                            onDrop={handleFileDrop}
                            onClick={() => fileRef.current?.click()}
                        >
                            <div className="goals-upload-icon">
                                <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
                                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                                    <polyline points="17 8 12 3 7 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                                    <line x1="12" y1="3" x2="12" y2="15" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                                </svg>
                            </div>
                            <p className="goals-upload-title">
                                {dragOver ? '📂 Drop it here!' : 'Drag & drop your lab sheet'}
                            </p>
                            <p className="goals-upload-sub">or click anywhere to browse files</p>
                            <div className="goals-upload-badges">
                                <span className="goals-badge">PDF</span>
                                <span className="goals-badge">DOCX</span>
                                <span className="goals-badge">DOC</span>
                                <span className="goals-badge goals-badge--light">Max 10 MB</span>
                            </div>
                        </div>

                        {uploadError && (
                            <div className="goals-error-msg">
                                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                                    <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.5" />
                                    <path d="M7 4v3M7 9.5v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                </svg>
                                {uploadError}
                            </div>
                        )}

                        <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end' }}>
                            <button className="subjects-btn-outline" onClick={resetAll}>Cancel</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ══════════════════════════════════════════════════════════════════
                STEP 2 — AI PROCESSING / LOADING
            ══════════════════════════════════════════════════════════════════ */}
            {formMode === 'loading' && (
                <div className="goals-card" style={{ marginBottom: 24 }}>
                    <div className="goals-processing">
                        <div className="goals-processing-spinner">
                            <div className="goals-spinner-ring" />
                            <div className="goals-ai-pulse">✦</div>
                        </div>
                        <div>
                            <p className="goals-processing-title">Analyzing with AI...</p>
                            <p className="goals-processing-sub">
                                Reading <strong>{uploadedFileName}</strong>
                            </p>
                            <p className="goals-processing-hint">
                                Extracting name, description, semester tag and guidance • ~30 s
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* ══════════════════════════════════════════════════════════════════
                STEP 3 — AI PRE-FILLED FORM  (also used for manual mode)
            ══════════════════════════════════════════════════════════════════ */}
            {(formMode === 'ai-form' || formMode === 'manual') && (
                <div className="goals-card" style={{ marginBottom: 24 }}>
                    {/* AI quality banner — only for AI mode */}
                    {formMode === 'ai-form' && aiMeta && (
                        <div className="goals-ai-banner">
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span className="goals-ai-icon-sm">✦</span>
                                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#3730a3' }}>
                                    AI Extracted — {aiMeta.extracted} of 5 fields found
                                </span>
                            </div>
                            <div className="goals-ai-quality">
                                <div className="goals-ai-quality-bar-track">
                                    <div
                                        className="goals-ai-quality-bar"
                                        style={{
                                            width: `${aiMeta.percentage}%`,
                                            background: qualityColor(aiMeta.status),
                                        }}
                                    />
                                </div>
                                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: qualityColor(aiMeta.status) }}>
                                    {aiMeta.percentage}%
                                </span>
                                <span style={{
                                    padding: '2px 8px',
                                    background: qualityColor(aiMeta.status) + '22',
                                    color: qualityColor(aiMeta.status),
                                    borderRadius: 100,
                                    fontSize: '0.68rem',
                                    fontWeight: 700,
                                    textTransform: 'capitalize',
                                }}>
                                    {aiMeta.status}
                                </span>
                            </div>
                        </div>
                    )}

                    <div style={{ padding: 24 }}>
                        <h3 className="subjects-form-title" style={{ marginBottom: 20 }}>
                            {editingGoal
                                ? '✏️ Edit Goal'
                                : formMode === 'ai-form'
                                    ? '✦ Review AI-Extracted Goal'
                                    : '+ New Goal'}
                        </h3>

                        {formError && (
                            <div className="subjects-error" style={{ marginBottom: 16 }}>
                                {formError}
                            </div>
                        )}

                        <form onSubmit={handleFormSubmit} className="subjects-form">

                            {/* Goal Name */}
                            <div className="subjects-field">
                                <label className="subjects-label">
                                    Goal / Task Name
                                    {formMode === 'ai-form' && form.name && (
                                        <span className="goals-ai-tag">AI</span>
                                    )}
                                </label>
                                <input
                                    required
                                    className="subjects-input"
                                    value={form.name}
                                    placeholder="e.g. Complete Lab 7"
                                    onChange={e => setForm({ ...form, name: e.target.value })}
                                />
                            </div>

                            {/* Description */}
                            <div className="subjects-field">
                                <label className="subjects-label">
                                    Description
                                    {formMode === 'ai-form' && form.description && (
                                        <span className="goals-ai-tag">AI</span>
                                    )}
                                </label>
                                <textarea
                                    className="subjects-input"
                                    style={{ minHeight: 90, paddingTop: 10, resize: 'vertical' }}
                                    value={form.description}
                                    placeholder="What do you need to achieve in this goal?"
                                    onChange={e => setForm({ ...form, description: e.target.value })}
                                />
                            </div>

                            <div className="subjects-form-row">
                                {/* Semester Tag */}
                                <div className="subjects-field">
                                    <label className="subjects-label">
                                        Semester / Tag
                                        {formMode === 'ai-form' && form.semester && (
                                            <span className="goals-ai-tag">AI</span>
                                        )}
                                    </label>
                                    <input
                                        required
                                        className="subjects-input"
                                        value={form.semester}
                                        placeholder="e.g. Y3S1"
                                        onChange={e => setForm({ ...form, semester: e.target.value })}
                                    />
                                </div>

                                {/* Hours */}
                                <div className="subjects-field" style={{ flex: 0.6 }}>
                                    <label className="subjects-label">Hours / Week</label>
                                    <input
                                        type="number"
                                        step="0.5"
                                        min="0"
                                        max="168"
                                        required
                                        className="subjects-input"
                                        value={form.targetHoursPerWeek}
                                        onChange={e => setForm({ ...form, targetHoursPerWeek: e.target.value })}
                                    />
                                </div>

                                {/* Color */}
                                <div className="subjects-field" style={{ flex: 0.5 }}>
                                    <label className="subjects-label">Color</label>
                                    <select
                                        className="subjects-input"
                                        value={form.colorTag}
                                        onChange={e => setForm({ ...form, colorTag: e.target.value })}
                                    >
                                        {COLOR_OPTIONS.map(c => (
                                            <option key={c}>{c}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8, flexWrap: 'wrap' }}>
                                <button type="button" className="subjects-btn-outline" onClick={resetAll}>
                                    Cancel
                                </button>

                                {formMode === 'ai-form' && (
                                    /* AI mode: primary action is to go view the guidance */
                                    <button
                                        type="button"
                                        className="goals-btn goals-btn--guidance"
                                        onClick={() => {
                                            setFormError('');
                                            setFormMode('guidance');
                                        }}
                                    >
                                        <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                                            <path d="M8 1.5a6.5 6.5 0 100 13 6.5 6.5 0 000-13z" stroke="currentColor" strokeWidth="1.5" />
                                            <path d="M8 7v4M8 5h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                        </svg>
                                        View AI Guidance &amp; Submission →
                                    </button>
                                )}

                                {formMode === 'manual' && (
                                    /* Manual mode: submit directly */
                                    <button type="submit" disabled={submitting} className="subjects-btn">
                                        {submitting
                                            ? (editingGoal ? 'Updating…' : 'Creating…')
                                            : (editingGoal ? 'Update Goal' : 'Create Goal')}
                                    </button>
                                )}
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ══════════════════════════════════════════════════════════════════
                STEP 4 — AI GUIDANCE & SUBMISSION PANEL
            ══════════════════════════════════════════════════════════════════ */}
            {formMode === 'guidance' && (
                <div className="goals-card" style={{ marginBottom: 24 }}>
                    <div className="goals-card-header">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div className="goals-ai-icon">✦</div>
                            <div>
                                <p style={{ margin: 0, fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: '0.95rem', color: '#0f172a' }}>
                                    AI Guidance &amp; Submission
                                </p>
                                <p style={{ margin: 0, fontSize: '0.78rem', color: '#64748b' }}>
                                    {form.name}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div style={{ padding: 24 }}>

                        {/* Step-by-Step Guidance */}
                        {form.stepByStepGuidance.length > 0 ? (
                            <div style={{ marginBottom: 28 }}>
                                <div className="goals-section-label">
                                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                                        <path d="M3 8h10M3 4h10M3 12h6" stroke="#1d4ed8" strokeWidth="1.6" strokeLinecap="round" />
                                    </svg>
                                    Step-by-Step Guidance
                                    <span className="goals-step-count">
                                        {form.stepByStepGuidance.length} steps
                                    </span>
                                </div>

                                <div className="goals-steps-list">
                                    {form.stepByStepGuidance.map((step, idx) => (
                                        <div key={idx} className="goals-step-item">
                                            <div className="goals-step-number">{idx + 1}</div>
                                            <p className="goals-step-text">{step}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="goals-guidance-empty">
                                No step-by-step guidance was found in this document.
                            </div>
                        )}

                        {/* Submission Guidelines */}
                        {form.submissionGuidelines && (
                            <div style={{ marginBottom: 24 }}>
                                <div className="goals-section-label">
                                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                                        <path d="M8 2v8M5 7l3 3 3-3" stroke="#1d4ed8" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                                        <path d="M2 13h12" stroke="#1d4ed8" strokeWidth="1.6" strokeLinecap="round" />
                                    </svg>
                                    Submission Guidelines
                                </div>
                                <div className="goals-submission-box">
                                    {form.submissionGuidelines}
                                </div>
                            </div>
                        )}

                        {formError && (
                            <div className="goals-error-msg" style={{ marginBottom: 16 }}>
                                {formError}
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                            <button
                                type="button"
                                className="subjects-btn-outline"
                                onClick={() => setFormMode('ai-form')}
                            >
                                ← Back to Edit
                            </button>

                            <button
                                className="goals-btn goals-btn--create"
                                disabled={submitting}
                                onClick={submitGoal}
                            >
                                {submitting ? (
                                    <>
                                        <span className="btn-spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />
                                        Creating...
                                    </>
                                ) : (
                                    <>
                                        <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                                            <path d="M13.5 4.5L6 12 2.5 8.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                        Create Goal
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ══════════════════════════════════════════════════════════════════
                GOALS LIST
            ══════════════════════════════════════════════════════════════════ */}
            {fetching ? (
                <div className="subjects-loading">Loading goals...</div>
            ) : !selectedModuleId ? (
                <div className="subjects-empty">Select a module above to view its goals.</div>
            ) : goals.length === 0 ? (
                <div className="subjects-empty">
                    <p style={{ fontSize: '1.5rem', marginBottom: 8 }}>🎯</p>
                    <p style={{ fontWeight: 600, color: '#334155', marginBottom: 4 }}>No goals yet</p>
                    <p>Upload a lab sheet for instant AI setup, or add one manually.</p>
                    <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 16 }}>
                        <button
                            className="goals-btn goals-btn--ai"
                            onClick={() => { resetAll(); setFormMode('upload'); }}
                        >
                            ✦ Upload Lab Sheet
                        </button>
                        <button
                            className="subjects-btn-outline"
                            onClick={() => { resetAll(); setFormMode('manual'); }}
                        >
                            + Add Manually
                        </button>
                    </div>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {goals.map(goal => (
                        <GoalCard
                            key={goal.id}
                            goal={goal}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                        />
                    ))}
                </div>
            )}

        </MainLayout>
    );
}

// ── GoalCard Component ────────────────────────────────────────────────────────

function GoalCard({ goal, onEdit, onDelete }) {
    const [open, setOpen] = useState(false);

    const hasAi = Boolean(
        (goal.stepByStepGuidance?.length > 0) || goal.submissionGuidelines
    );

    return (
        <div className="goals-goal-card">
            <div className="goals-goal-main">
                <div style={{ flex: 1, minWidth: 0 }}>
                    {/* Title row */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
                        <div
                            className="goals-color-dot"
                            style={{ background: COLOR_HEX[goal.colorTag] || '#3b82f6' }}
                        />
                        <span className="goals-goal-name">{goal.name}</span>
                        <span className="goals-semester-tag">{goal.semester}</span>
                        {hasAi && (
                            <span className="goals-ai-indicator">✦ AI</span>
                        )}
                    </div>

                    {goal.description && (
                        <p className="goals-goal-desc">{goal.description}</p>
                    )}

                    {/* Meta row */}
                    <div className="goals-goal-meta">
                        <span className="goals-meta-item">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10" />
                                <polyline points="12 6 12 12 16 14" />
                            </svg>
                            {goal.targetHoursPerWeek} hrs/week
                        </span>

                        {goal.stepByStepGuidance?.length > 0 && (
                            <span className="goals-meta-item">
                                <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                                    <path d="M3 8h10M3 4h10M3 12h6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                                </svg>
                                {goal.stepByStepGuidance.length} steps
                            </span>
                        )}
                    </div>
                </div>

                {/* Action buttons */}
                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                    {hasAi && (
                        <button
                            className="copy-btn"
                            title={open ? 'Hide AI guidance' : 'View AI guidance'}
                            onClick={() => setOpen(o => !o)}
                            style={{ color: open ? '#4f46e5' : undefined }}
                        >
                            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                                <path d="M8 1.5a6.5 6.5 0 100 13 6.5 6.5 0 000-13z" stroke="currentColor" strokeWidth="1.5" />
                                <path d="M8 7v4M8 5h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                            </svg>
                        </button>
                    )}
                    <button className="copy-btn" title="Edit" onClick={() => onEdit(goal)}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                    </button>
                    <button
                        className="copy-btn"
                        title="Delete"
                        style={{ color: '#ef4444' }}
                        onClick={() => onDelete(goal.id)}
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Expandable AI panel */}
            {open && hasAi && (
                <div className="goals-goal-guidance">
                    {goal.stepByStepGuidance?.length > 0 && (
                        <div style={{ marginBottom: 14 }}>
                            <p className="goals-guidance-section-title">📋 Step-by-Step Guidance</p>
                            {goal.stepByStepGuidance.map((step, idx) => (
                                <div key={idx} className="goals-inline-step">
                                    <div className="goals-step-number goals-step-number--sm">{idx + 1}</div>
                                    <p style={{ margin: 0, fontSize: '0.8rem', color: '#334155', lineHeight: 1.6 }}>
                                        {step}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}
                    {goal.submissionGuidelines && (
                        <div>
                            <p className="goals-guidance-section-title">📤 Submission</p>
                            <p style={{ margin: 0, fontSize: '0.8rem', color: '#166534', background: '#f0fdf4', padding: '10px 12px', borderRadius: 8, lineHeight: 1.6 }}>
                                {goal.submissionGuidelines}
                            </p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}