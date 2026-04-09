// frontend/src/pages/Goals.jsx
import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { moduleService } from '../api/moduleService';
import { academicApi } from '../api/academicApi';
import { goalParserApi } from '../api/goalParserApi';
import confetti from 'canvas-confetti';
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
    deadlineDate: '',
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
                deadlineDate: '',
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
            deadlineDate: form.deadlineDate || null,
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
            } else if (formMode === 'manual') {
                // Manual flow — validate steps + use the dedicated /manual endpoint
                if (!payload.stepByStepGuidance || payload.stepByStepGuidance.length === 0) {
                    setFormError('Add at least one step to create a manual goal.');
                    setSubmitting(false);
                    return;
                }
                const created = await moduleService.createManualModule(payload);
                setGoals(prev => [created, ...prev]);
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
            deadlineDate: goal.deadlineDate ? goal.deadlineDate.substring(0, 10) : '',
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

    // ── Optimistic goal list update (from GoalGuidancePanel) ─────────────────
    const handleGoalUpdated = useCallback((updatedGoal) => {
        setGoals(prev => prev.map(g => g.id === updatedGoal.id ? updatedGoal : g));
    }, []);

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
                                    : '📝 Add Manually'}
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

                                {/* Deadline Date */}
                                <div className="subjects-field" style={{ flex: 0.6 }}>
                                    <label className="subjects-label">Deadline Date</label>
                                    <input
                                        type="date"
                                        className="subjects-input"
                                        value={form.deadlineDate}
                                        onChange={e => setForm({ ...form, deadlineDate: e.target.value })}
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

                            {/* ── Dynamic Step Builder — manual mode only ── */}
                            {formMode === 'manual' && (
                                <div className="subjects-field" style={{ marginTop: 4 }}>
                                    <label className="subjects-label">
                                        Step-by-Step Guide
                                        <span style={{ marginLeft: 6, fontWeight: 400, color: '#94a3b8', fontSize: '0.72rem' }}>
                                            ({form.stepByStepGuidance.length} step{form.stepByStepGuidance.length !== 1 ? 's' : ''} added)
                                        </span>
                                    </label>

                                    {/* Existing steps */}
                                    {form.stepByStepGuidance.length > 0 && (
                                        <div className="goals-manual-steps-list">
                                            {form.stepByStepGuidance.map((step, idx) => (
                                                <div key={idx} className="goals-manual-step-row">
                                                    <div className="goals-step-number goals-step-number--sm" style={{ flexShrink: 0 }}>
                                                        {idx + 1}
                                                    </div>
                                                    <p className="goals-manual-step-text">{step}</p>
                                                    <button
                                                        type="button"
                                                        className="goals-step-delete-btn"
                                                        onClick={() => setForm(f => ({
                                                            ...f,
                                                            stepByStepGuidance: f.stepByStepGuidance.filter((_, i) => i !== idx)
                                                        }))}
                                                        title="Remove step"
                                                    >✕</button>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Add new step */}
                                    <ManualStepAdder
                                        onAdd={(text) => setForm(f => ({
                                            ...f,
                                            stepByStepGuidance: [...f.stepByStepGuidance, text]
                                        }))}
                                    />
                                </div>
                            )}

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
                            onGoalUpdated={handleGoalUpdated}
                        />
                    ))}
                </div>
            )}

        </MainLayout>
    );
}

// ── ManualStepAdder ───────────────────────────────────────────────────────────
// Tiny self-clearing input + button; calls onAdd(text) when the user confirms a step.

function ManualStepAdder({ onAdd }) {
    const [text, setText] = useState('');

    const commit = () => {
        const trimmed = text.trim();
        if (!trimmed) return;
        onAdd(trimmed);
        setText('');
    };

    const handleKey = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); commit(); }
    };

    return (
        <div className="goals-step-adder">
            <textarea
                className="goals-step-adder-input"
                value={text}
                rows={2}
                placeholder="Type a step and press Add or Enter…"
                onChange={e => setText(e.target.value)}
                onKeyDown={handleKey}
            />
            <button
                type="button"
                className="goals-step-adder-btn"
                onClick={commit}
                disabled={!text.trim()}
            >
                + Add Step
            </button>
        </div>
    );
}

// ── GoalCard Component ────────────────────────────────────────────────────────

function GoalCard({ goal, onEdit, onDelete, onGoalUpdated }) {
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
                        {goal.isCompleted && (
                            <span className="goals-completed-badge">🏆 Completed</span>
                        )}
                    </div>

                    {goal.description && (
                        <p className="goals-goal-desc">{goal.description}</p>
                    )}

                    {/* Meta row */}
                    <div className="goals-goal-meta">
                        {goal.deadlineDate && (
                            <span className="goals-meta-item">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                    <line x1="16" y1="2" x2="16" y2="6" />
                                    <line x1="8" y1="2" x2="8" y2="6" />
                                    <line x1="3" y1="10" x2="21" y2="10" />
                                </svg>
                                {new Date(goal.deadlineDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '.')}
                            </span>
                        )}
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
                            title={open ? 'Hide guidance' : 'View guidance & progress'}
                            onClick={() => setOpen(o => !o)}
                            style={{ color: open ? '#4f46e5' : undefined }}
                        >
                            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                                <path d="M8 1.5a6.5 6.5 0 100 13 6.5 6.5 0 000-13z" stroke="currentColor" strokeWidth="1.5" />
                                <path d="M8 7v4M8 5h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                            </svg>
                        </button>
                    )}
                    <button className="copy-btn" title="Edit goal" onClick={() => onEdit(goal)} disabled={goal.isCompleted}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                            style={{ opacity: goal.isCompleted ? 0.35 : 1 }}>
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

            {/* Expandable guidance + progress panel */}
            {open && hasAi && (
                <GoalGuidancePanel goal={goal} onGoalUpdated={onGoalUpdated} />
            )}
        </div>
    );
}

// ── GoalGuidancePanel ─────────────────────────────────────────────────────────

function GoalGuidancePanel({ goal, onGoalUpdated }) {
    // ── Deadline / completed / locked state ──────────────────────────────────
    const isClosed = Boolean(goal.deadlineDate && new Date(goal.deadlineDate) < new Date());
    const isCompleted = Boolean(goal.isCompleted);
    const isLocked = isClosed || isCompleted;   // no edits when either is true

    // ── Local state ──────────────────────────────────────────────────────────
    const [steps, setSteps] = useState(goal.stepByStepGuidance || []);
    const [completions, setCompletions] = useState(() => {
        const base = goal.stepByStepGuidance || [];
        const saved = goal.stepCompletions || [];
        return base.map((_, i) => saved[i] ?? false);
    });
    const [editMode, setEditMode] = useState(false);
    const [saving, setSaving] = useState(false);
    const [completing, setCompleting] = useState(false);
    const [error, setError] = useState('');

    // Derived progress
    const doneCount = completions.filter(Boolean).length;
    const totalSteps = steps.length;
    const pct = totalSteps > 0 ? Math.round((doneCount / totalSteps) * 100) : 0;
    const allDone = totalSteps > 0 && doneCount === totalSteps;

    // ── Edit helpers ─────────────────────────────────────────────────────────
    const startEdit = () => { setSteps([...(goal.stepByStepGuidance || [])]); setEditMode(true); setError(''); };
    const cancelEdit = () => { setSteps(goal.stepByStepGuidance || []); setEditMode(false); setError(''); };

    const updateStep = (idx, val) => setSteps(prev => prev.map((s, i) => i === idx ? val : s));
    const deleteStep = (idx) => setSteps(prev => prev.filter((_, i) => i !== idx));
    const addStep = () => setSteps(prev => [...prev, '']);

    // ── Save edited steps via PUT ─────────────────────────────────────────────
    const saveSteps = async () => {
        const cleaned = steps.map(s => s.trim()).filter(Boolean);
        if (cleaned.length === 0) { setError('At least one step is required.'); return; }
        setSaving(true); setError('');
        try {
            await moduleService.updateModule(goal.id, {
                name: goal.name,
                description: goal.description,
                semester: goal.semester,
                deadlineDate: goal.deadlineDate || null,
                colorTag: goal.colorTag,
                subjectId: goal.subjectId || null,
                stepByStepGuidance: cleaned,
                stepCompletions: cleaned.map(() => false),
                submissionGuidelines: goal.submissionGuidelines || null,
            });
            const reset = cleaned.map(() => false);
            setSteps(cleaned);
            setCompletions(reset);
            setEditMode(false);
            onGoalUpdated({ ...goal, stepByStepGuidance: cleaned, stepCompletions: reset });
        } catch {
            setError('Failed to save steps. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    // ── Toggle completion via PATCH ──────────────────────────────────────────
    const toggleCompletion = async (idx) => {
        if (isClosed || editMode) return;
        const next = completions.map((c, i) => i === idx ? !c : c);
        setCompletions(next); // optimistic update
        try {
            await moduleService.patchCompletions(goal.id, next);
            onGoalUpdated({ ...goal, stepCompletions: next });
        } catch (err) {
            setCompletions(completions); // revert
            if (err?.response?.status === 409) {
                setError('Goal is closed — deadline has passed.');
            }
        }
    };

    // ── Complete goal ────────────────────────────────────────────────────────
    const handleCompleteGoal = async () => {
        if (isLocked || !allDone || completing) return;
        setCompleting(true); setError('');
        try {
            await moduleService.completeGoal(goal.id);
            // 🎉 Confetti burst
            const burst = (originY, spread) => confetti({
                particleCount: 90,
                spread,
                origin: { y: originY },
                colors: ['#4f46e5', '#22c55e', '#f59e0b', '#ec4899', '#06b6d4'],
                zIndex: 9999,
            });
            burst(0.7, 60);
            setTimeout(() => burst(0.6, 80), 150);
            setTimeout(() => burst(0.75, 50), 300);
            onGoalUpdated({ ...goal, isCompleted: true });
        } catch {
            setError('Could not mark goal as complete. Try again.');
        } finally {
            setCompleting(false);
        }
    };

    return (
        <div className="goals-goal-guidance">

            {/* Completed banner */}
            {isCompleted && (
                <div className="goals-completed-banner">
                    <span>🏆</span>
                    <span>Goal completed! Great work — this goal is now permanently locked.</span>
                </div>
            )}

            {/* Deadline closed banner (only if not completed) */}
            {!isCompleted && isClosed && (
                <div className="goals-closed-banner">
                    <span>🔒</span>
                    <span>Deadline reached — this goal is now closed. Steps are read-only.</span>
                </div>
            )}

            {/* ── Step-by-Step section ── */}
            {(steps.length > 0 || editMode) && (
                <div style={{ marginBottom: 16 }}>

                    {/* Section header */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                        <p className="goals-guidance-section-title" style={{ margin: 0 }}>
                            📋 Step-by-Step Guide
                            <span style={{ marginLeft: 8, fontWeight: 400, fontSize: '0.72rem', color: '#94a3b8' }}>
                                {doneCount}/{totalSteps} done
                            </span>
                        </p>

                        {/* Edit / Save / Cancel — hidden when locked */}
                        {!isLocked && (
                            <div style={{ display: 'flex', gap: 6 }}>
                                {!editMode ? (
                                    <button className="goals-step-action-btn" onClick={startEdit} title="Edit steps">
                                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                                            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                                        </svg>
                                        Edit
                                    </button>
                                ) : (
                                    <>
                                        <button
                                            className="goals-step-action-btn goals-step-action-btn--save"
                                            onClick={saveSteps}
                                            disabled={saving}
                                        >
                                            {saving ? 'Saving…' : '✓ Save'}
                                        </button>
                                        <button
                                            className="goals-step-action-btn"
                                            onClick={cancelEdit}
                                            disabled={saving}
                                        >
                                            Cancel
                                        </button>
                                    </>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Error message */}
                    {error && (
                        <div className="goals-error-msg" style={{ marginBottom: 10 }}>
                            {error}
                        </div>
                    )}

                    {/* Steps */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                        {steps.map((step, idx) => (
                            <div
                                key={idx}
                                className={`goals-inline-step ${!editMode && completions[idx] ? 'goals-inline-step--done' : ''}`}
                            >
                                {/* Checkbox or step number */}
                                {editMode ? (
                                    <div className="goals-step-number goals-step-number--sm" style={{ flexShrink: 0, marginTop: 6 }}>
                                        {idx + 1}
                                    </div>
                                ) : (
                                    <button
                                        className={`goals-step-check ${completions[idx] ? 'goals-step-check--done' : ''} ${isLocked ? 'goals-step-check--locked' : ''}`}
                                        onClick={() => toggleCompletion(idx)}
                                        disabled={isLocked}
                                        title={isLocked ? (isCompleted ? 'Goal completed' : 'Goal closed') : (completions[idx] ? 'Mark incomplete' : 'Mark complete')}
                                    >
                                        {completions[idx] && (
                                            <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                                                <path d="M1.5 6l3 3 6-6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                        )}
                                    </button>
                                )}

                                {/* Step text / textarea */}
                                {editMode ? (
                                    <textarea
                                        className="goals-step-edit-input"
                                        value={step}
                                        rows={2}
                                        onChange={e => updateStep(idx, e.target.value)}
                                        placeholder={`Step ${idx + 1}…`}
                                    />
                                ) : (
                                    <p style={{
                                        margin: 0, fontSize: '0.8rem', lineHeight: 1.6, flex: 1,
                                        color: completions[idx] ? '#94a3b8' : '#334155',
                                        textDecoration: completions[idx] ? 'line-through' : 'none',
                                    }}>
                                        {step}
                                    </p>
                                )}

                                {/* Delete button (edit only) */}
                                {editMode && (
                                    <button
                                        className="goals-step-delete-btn"
                                        onClick={() => deleteStep(idx)}
                                        title="Remove this step"
                                    >
                                        ✕
                                    </button>
                                )}
                            </div>
                        ))}

                        {/* Add step */}
                        {editMode && (
                            <button className="goals-add-step-btn" onClick={addStep}>
                                + Add Step
                            </button>
                        )}
                    </div>

                    {/* ── Progress bar ── */}
                    {!editMode && totalSteps > 0 && (
                        <div className="goals-progress-wrap">
                            <div className="goals-progress-track">
                                <div
                                    className={`goals-progress-fill ${allDone ? 'goals-progress-fill--done' : ''}`}
                                    style={{ width: `${pct}%` }}
                                />
                            </div>
                            <span className={`goals-progress-label ${allDone ? 'goals-progress-label--done' : ''}`}>
                                {allDone ? '✓ Done' : `${pct}%`}
                            </span>
                        </div>
                    )}

                    {/* ── Complete Goal button — appears when all steps done and not locked ── */}
                    {allDone && !isLocked && !editMode && (
                        <div className="goals-complete-goal-wrap">
                            <button
                                className={`goals-complete-goal-btn ${completing ? 'goals-complete-goal-btn--loading' : ''}`}
                                onClick={handleCompleteGoal}
                                disabled={completing}
                            >
                                {completing ? (
                                    <span className="goals-complete-spinner" />
                                ) : (
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                        <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" fill="currentColor" />
                                    </svg>
                                )}
                                {completing ? 'Completing…' : 'Complete Goal'}
                            </button>
                            <p className="goals-complete-goal-hint">
                                All steps done! Press to officially mark this goal as complete.
                            </p>
                        </div>
                    )}
                </div>
            )}

            {/* ── Submission Guidelines ── */}
            {goal.submissionGuidelines && (
                <div>
                    <p className="goals-guidance-section-title">📤 Submission</p>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: '#166534', background: '#f0fdf4', padding: '10px 12px', borderRadius: 8, lineHeight: 1.6 }}>
                        {goal.submissionGuidelines}
                    </p>
                </div>
            )}
        </div>
    );
}

