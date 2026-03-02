import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Plus, FileEdit, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ModuleService from '../api/moduleService';
import MainLayout from '../components/MainLayout';
import '../styles/dashboard.css';

export default function MyCoursesPage() {
    const { user } = useAuth();
    const navigate = useNavigate();

    // My Courses Page State
    const [modules, setModules] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [currentModule, setCurrentModule] = useState(null);
    const [formData, setFormData] = useState({
        name: '', description: '', colorTag: 'Blue', targetHoursPerWeek: 0, semester: ''
    });
    const [formErrors, setFormErrors] = useState({});

    useEffect(() => {
        fetchModules();
    }, []);

    const fetchModules = async () => {
        try {
            setLoading(true);
            const data = await ModuleService.getModules();
            setModules(data);
            setError('');
        } catch (err) {
            setError('Failed to fetch modules.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const openCreateModal = () => {
        setCurrentModule(null);
        setFormData({ name: '', description: '', colorTag: 'Blue', targetHoursPerWeek: 0, semester: '' });
        setFormErrors({});
        setIsFormOpen(true);
    };

    const openEditModal = (module) => {
        setCurrentModule(module);
        setFormData({
            name: module.name, description: module.description || '', colorTag: module.colorTag,
            targetHoursPerWeek: module.targetHoursPerWeek, semester: module.semester
        });
        setFormErrors({});
        setIsFormOpen(true);
    };

    const openDeleteModal = (module) => {
        setCurrentModule(module);
        setIsDeleteOpen(true);
    };

    const validateForm = () => {
        const errors = {};
        if (!formData.name || formData.name.trim() === '') errors.name = 'Module Name is required.';
        if (formData.name && formData.name.length > 120) errors.name = 'Module Name must be under 120 characters.';

        if (formData.targetHoursPerWeek === '' || formData.targetHoursPerWeek === null) {
            errors.targetHoursPerWeek = 'Target hours are required.';
        } else if (Number(formData.targetHoursPerWeek) < 0 || Number(formData.targetHoursPerWeek) > 168) {
            errors.targetHoursPerWeek = 'Must be between 0 and 168.';
        }

        if (!formData.semester || formData.semester.trim() === '') errors.semester = 'Semester is required.';

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSaveModule = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;
        try {
            if (currentModule) {
                await ModuleService.updateModule(currentModule.id, formData);
            } else {
                await ModuleService.createModule(formData);
            }
            setIsFormOpen(false);
            fetchModules();
        } catch (err) {
            if (err.response?.data?.errors) {
                setFormErrors(err.response.data.errors);
            } else {
                setError('Failed to save module.');
            }
        }
    };

    const handleDeleteModule = async () => {
        if (!currentModule) return;
        try {
            await ModuleService.deleteModule(currentModule.id);
            setIsDeleteOpen(false);
            fetchModules();
        } catch (err) {
            setError('Failed to delete module.');
        }
    };

    return (
        <MainLayout title="My Courses">
            <div style={{ padding: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', color: '#1f2937' }}>My Courses (Modules)</h1>
                    <button
                        onClick={openCreateModal}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#4f46e5', color: 'white', padding: '0.5rem 1rem', borderRadius: '0.5rem', border: 'none', cursor: 'pointer' }}
                    >
                        <Plus size={20} />
                        Create New Course
                    </button>
                </div>

                {error && <div style={{ backgroundColor: '#fef2f2', color: '#dc2626', padding: '1rem', borderRadius: '0.5rem', marginBottom: '1.5rem' }}>{error}</div>}

                {loading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
                        <div className="spinner" style={{ width: '3rem', height: '3rem', border: '2px solid #4f46e5', borderBottomColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                        <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                        {modules.length === 0 ? (
                            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem', backgroundColor: '#f9fafb', borderRadius: '0.75rem', border: '1px solid #e5e7eb' }}>
                                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto 1rem auto' }}>
                                    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
                                    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
                                </svg>
                                <h3 style={{ fontSize: '1.25rem', fontWeight: '500', color: '#374151', margin: '0.5rem 0' }}>No courses yet</h3>
                                <p style={{ color: '#6b7280', marginTop: '0.5rem' }}>Click the button above to add your first course module.</p>
                            </div>
                        ) : (
                            modules.map(module => (
                                <div key={module.id} style={{ backgroundColor: 'white', borderRadius: '0.75rem', border: '1px solid #f3f4f6', overflow: 'hidden', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)' }}>
                                    <div style={{ height: '0.5rem', width: '100%', backgroundColor: module.colorTag.toLowerCase() === 'blue' ? '#3b82f6' : module.colorTag.toLowerCase() === 'green' ? '#10b981' : module.colorTag.toLowerCase() === 'red' ? '#ef4444' : module.colorTag.toLowerCase() === 'purple' ? '#8b5cf6' : module.colorTag }}></div>
                                    <div style={{ padding: '1.5rem' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                            <div>
                                                <span style={{ display: 'inline-block', padding: '0.25rem 0.5rem', backgroundColor: '#f3f4f6', color: '#4b5563', fontSize: '0.75rem', fontWeight: 'bold', borderRadius: '0.25rem', marginBottom: '0.5rem' }}>
                                                    {module.semester}
                                                </span>
                                                <h3 style={{ fontWeight: 'bold', fontSize: '1.125rem', color: '#111827', margin: 0 }}>{module.name}</h3>
                                            </div>
                                        </div>

                                        {module.description && (
                                            <p style={{ fontSize: '0.875rem', color: '#4b5563', marginBottom: '1rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{module.description}</p>
                                        )}

                                        <div style={{ display: 'flex', alignItems: 'center', fontSize: '0.875rem', fontWeight: '500', color: '#4338ca', backgroundColor: '#eef2ff', width: 'fit-content', padding: '0.25rem 0.75rem', borderRadius: '9999px', marginBottom: '1.5rem' }}>
                                            <span style={{ marginRight: '0.25rem' }}>🎯</span>
                                            {module.targetHoursPerWeek} hours/week
                                        </div>

                                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', borderTop: '1px solid #f3f4f6', paddingTop: '1rem' }}>
                                            <button
                                                onClick={() => openEditModal(module)}
                                                style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.875rem', color: '#4b5563', backgroundColor: 'transparent', border: 'none', cursor: 'pointer' }}
                                            >
                                                <FileEdit size={16} /> Edit
                                            </button>
                                            <button
                                                onClick={() => openDeleteModal(module)}
                                                style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.875rem', color: '#ef4444', backgroundColor: 'transparent', border: 'none', cursor: 'pointer' }}
                                            >
                                                <Trash2 size={16} /> Delete
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>

            {/* Form Modal */}
            {isFormOpen && (
                <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '1rem' }}>
                    <div style={{ backgroundColor: 'white', borderRadius: '0.75rem', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)', width: '100%', maxWidth: '32rem', overflow: 'hidden' }}>
                        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'linear-gradient(135deg, #f8faff 0%, #eef2ff 100%)' }}>
                            <div>
                                <h2 style={{ fontSize: '1.125rem', fontWeight: '700', color: '#111827', margin: 0 }}>
                                    {currentModule ? '✏️ Edit Course Module' : '📚 Create New Course'}
                                </h2>
                                <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: '0.2rem 0 0 0' }}>
                                    {currentModule ? 'Update your module details below' : 'Add a new module to your course list'}
                                </p>
                            </div>
                            <button onClick={() => setIsFormOpen(false)} style={{ color: '#9ca3af', fontSize: '1.5rem', background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem', lineHeight: 1 }}>&times;</button>
                        </div>

                        <form onSubmit={handleSaveModule} style={{ padding: '1.5rem' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.25rem' }}>Module Name *</label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleFormChange}
                                        style={{ width: '100%', padding: '0.625rem 0.75rem', border: `1.5px solid ${formErrors.name ? '#ef4444' : '#e5e7eb'}`, borderRadius: '0.5rem', outline: 'none', boxSizing: 'border-box', fontSize: '0.9375rem' }}
                                        placeholder="e.g. Data Structures and Algorithms"
                                        maxLength={120}
                                    />
                                    {formErrors.name && <p style={{ color: '#ef4444', fontSize: '0.75rem', margin: '0.25rem 0 0 0' }}>{formErrors.name}</p>}
                                </div>

                                <div>
                                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.25rem' }}>Semester *</label>
                                    <input
                                        type="text"
                                        name="semester"
                                        value={formData.semester}
                                        onChange={handleFormChange}
                                        style={{ width: '100%', padding: '0.625rem 0.75rem', border: `1.5px solid ${formErrors.semester ? '#ef4444' : '#e5e7eb'}`, borderRadius: '0.5rem', outline: 'none', boxSizing: 'border-box', fontSize: '0.9375rem' }}
                                        placeholder="e.g. Y3S1"
                                    />
                                    {formErrors.semester && <p style={{ color: '#ef4444', fontSize: '0.75rem', margin: '0.25rem 0 0 0' }}>{formErrors.semester}</p>}
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.25rem' }}>Target Hrs/Week *</label>
                                        <input
                                            type="number"
                                            step="0.5"
                                            min="0"
                                            max="168"
                                            name="targetHoursPerWeek"
                                            value={formData.targetHoursPerWeek}
                                            onChange={handleFormChange}
                                            style={{ width: '100%', padding: '0.625rem 0.75rem', border: `1.5px solid ${formErrors.targetHoursPerWeek ? '#ef4444' : '#e5e7eb'}`, borderRadius: '0.5rem', outline: 'none', boxSizing: 'border-box', fontSize: '0.9375rem' }}
                                        />
                                        {formErrors.targetHoursPerWeek && <p style={{ color: '#ef4444', fontSize: '0.75rem', margin: '0.25rem 0 0 0' }}>{formErrors.targetHoursPerWeek}</p>}
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.25rem' }}>Colour Tag</label>
                                        <select
                                            name="colorTag"
                                            value={formData.colorTag}
                                            onChange={handleFormChange}
                                            style={{ width: '100%', padding: '0.625rem 0.75rem', border: '1.5px solid #e5e7eb', borderRadius: '0.5rem', outline: 'none', backgroundColor: 'white', boxSizing: 'border-box', fontSize: '0.9375rem', cursor: 'pointer' }}
                                        >
                                            <option value="Blue">🔵 Blue</option>
                                            <option value="Green">🟢 Green</option>
                                            <option value="Purple">🟣 Purple</option>
                                            <option value="Red">🔴 Red</option>
                                            <option value="Gray">⚫ Gray</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.25rem' }}>Description (Optional)</label>
                                    <textarea
                                        name="description"
                                        value={formData.description}
                                        onChange={handleFormChange}
                                        rows="3"
                                        style={{ width: '100%', padding: '0.625rem 0.75rem', border: '1.5px solid #e5e7eb', borderRadius: '0.5rem', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', resize: 'vertical', fontSize: '0.9375rem', lineHeight: 1.5 }}
                                        placeholder="Brief description of what this module covers..."
                                    ></textarea>
                                </div>
                            </div>

                            <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                                <button
                                    type="button"
                                    onClick={() => setIsFormOpen(false)}
                                    style={{ padding: '0.625rem 1.25rem', color: '#374151', backgroundColor: '#f9fafb', border: '1.5px solid #e5e7eb', borderRadius: '0.5rem', fontWeight: '500', cursor: 'pointer', fontSize: '0.875rem' }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    style={{ padding: '0.625rem 1.5rem', color: 'white', backgroundColor: '#4f46e5', border: 'none', borderRadius: '0.5rem', fontWeight: '600', cursor: 'pointer', fontSize: '0.875rem', boxShadow: '0 1px 3px rgba(79,70,229,0.35)' }}
                                >
                                    {currentModule ? '💾 Save Changes' : '✅ Create Course'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {isDeleteOpen && currentModule && (
                <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '1rem' }}>
                    <div style={{ backgroundColor: 'white', borderRadius: '0.75rem', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)', width: '100%', maxWidth: '24rem', padding: '1.5rem', textAlign: 'center' }}>
                        <div style={{ margin: '0 auto 1rem auto', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '3rem', width: '3rem', borderRadius: '9999px', backgroundColor: '#fee2e2' }}>
                            <Trash2 style={{ height: '1.5rem', width: '1.5rem', color: '#dc2626' }} />
                        </div>
                        <h3 style={{ fontSize: '1.125rem', fontWeight: 'bold', color: '#111827', margin: '0 0 0.5rem 0' }}>Delete Module</h3>
                        <p style={{ color: '#6b7280', fontSize: '0.875rem', margin: '0 0 1.5rem 0' }}>
                            Are you sure you want to delete <span style={{ fontWeight: '600', color: '#1f2937' }}>"{currentModule.name}"</span>? This action cannot be undone.
                        </p>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem' }}>
                            <button
                                onClick={() => setIsDeleteOpen(false)}
                                style={{ padding: '0.5rem 1rem', color: '#374151', backgroundColor: '#f3f4f6', border: 'none', borderRadius: '0.5rem', fontWeight: '500', cursor: 'pointer', width: '100%' }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDeleteModule}
                                style={{ padding: '0.5rem 1rem', color: 'white', backgroundColor: '#dc2626', border: 'none', borderRadius: '0.5rem', fontWeight: '500', cursor: 'pointer', width: '100%' }}
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </MainLayout>
    );
}
