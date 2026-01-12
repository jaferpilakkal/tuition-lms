import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Badge, Button, LoadingSpinner, EmptyState, ConfirmModal } from '../../components/common';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../services/supabase';
import { Plus, Edit2, Users, Calendar, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import './AdminClasses.css';

function AdminClasses() {
    const { profile } = useAuth();
    const navigate = useNavigate();
    const [classes, setClasses] = useState([]);
    const [teachers, setTeachers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingClass, setEditingClass] = useState(null);
    const [classToDelete, setClassToDelete] = useState(null);

    // Form state
    const [formData, setFormData] = useState({
        class_name: '',
        subject: '',
        teacher_id: '',
        start_date: ''
    });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            await Promise.all([fetchClasses(), fetchTeachers()]);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchClasses = async () => {
        const { data, error } = await supabase
            .from('classes')
            .select(`
        *,
        teacher:profiles (
          id,
          name
        ),
        enrollments:class_enrollments (count)
      `)
            .eq('is_active', true)
            .order('created_at', { ascending: false });

        if (!error) setClasses(data || []);
    };

    const fetchTeachers = async () => {
        const { data, error } = await supabase
            .from('profiles')
            .select('id, name, email')
            .eq('role', 'teacher')
            .eq('is_active', true);

        if (!error) setTeachers(data || []);
    };

    const openCreateModal = () => {
        setEditingClass(null);
        setFormData({
            class_name: '',
            subject: '',
            teacher_id: '',
            start_date: new Date().toISOString().split('T')[0]
        });
        setShowModal(true);
    };

    const openEditModal = (cls) => {
        setEditingClass(cls);
        setFormData({
            class_name: cls.class_name,
            subject: cls.subject,
            teacher_id: cls.teacher_id || '',
            start_date: cls.start_date
        });
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.class_name || !formData.subject || !formData.start_date) {
            toast.error('Please fill in all required fields');
            return;
        }

        try {
            setSaving(true);

            if (editingClass) {
                // Update existing class
                const { error } = await supabase
                    .from('classes')
                    .update({
                        class_name: formData.class_name,
                        subject: formData.subject,
                        teacher_id: formData.teacher_id || null,
                        start_date: formData.start_date
                    })
                    .eq('id', editingClass.id);

                if (error) throw error;
                toast.success('Class updated successfully!');
            } else {
                // Create new class
                const { error } = await supabase
                    .from('classes')
                    .insert({
                        class_name: formData.class_name,
                        subject: formData.subject,
                        teacher_id: formData.teacher_id || null,
                        start_date: formData.start_date
                    });

                if (error) throw error;
                toast.success('Class created successfully!');
            }

            setShowModal(false);
            fetchClasses();
        } catch (error) {
            console.error('Error saving class:', error);
            toast.error('Failed to save class');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!classToDelete) return;

        try {
            const { error } = await supabase
                .from('classes')
                .update({ is_active: false })
                .eq('id', classToDelete);

            if (error) throw error;
            toast.success('Class deactivated');
            fetchClasses();
        } catch (error) {
            toast.error('Failed to deactivate class');
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    if (loading) {
        return <LoadingSpinner fullPage text="Loading classes..." />;
    }

    return (
        <div className="admin-classes">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Classes</h1>
                    <p className="page-subtitle">Manage classes and assignments</p>
                </div>
                <Button
                    variant="primary"
                    onClick={openCreateModal}
                    icon={<Plus size={18} />}
                >
                    New Class
                </Button>
            </div>

            {classes.length === 0 ? (
                <EmptyState
                    icon="classes"
                    title="No classes yet"
                    description="Create your first class to get started"
                />
            ) : (
                <div className="class-list">
                    {classes.map((cls) => (
                        <Card key={cls.id} className="class-card">
                            <div className="class-content">
                                <div className="class-info">
                                    <h3 className="class-name">{cls.subject}</h3>
                                    <p className="class-sub">{cls.class_name}</p>
                                    <div className="class-meta">
                                        <span className="meta-item">
                                            <Users size={14} />
                                            {cls.enrollments?.[0]?.count || 0} students
                                        </span>
                                        <span className="meta-item">
                                            <Calendar size={14} />
                                            Started {formatDate(cls.start_date)}
                                        </span>
                                    </div>
                                    {cls.teacher && (
                                        <p className="teacher-name">Teacher: {cls.teacher.name}</p>
                                    )}
                                </div>
                                <div className="class-actions">
                                    <Button
                                        variant="ghost"
                                        size="small"
                                        onClick={() => navigate(`/admin/classes/${cls.id}/students`)}
                                    >
                                        <Users size={16} />
                                        Students
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="small"
                                        onClick={() => openEditModal(cls)}
                                    >
                                        <Edit2 size={16} />
                                        Edit
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            {/* Create/Edit Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <h2 className="modal-title">
                            {editingClass ? 'Edit Class' : 'Create New Class'}
                        </h2>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label htmlFor="class_name">Class Name *</label>
                                <input
                                    type="text"
                                    id="class_name"
                                    value={formData.class_name}
                                    onChange={(e) => setFormData({ ...formData, class_name: e.target.value })}
                                    placeholder="e.g., Grade 10 - Section A"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="subject">Subject *</label>
                                <input
                                    type="text"
                                    id="subject"
                                    value={formData.subject}
                                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                    placeholder="e.g., Mathematics"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="teacher_id">Assign Teacher</label>
                                <select
                                    id="teacher_id"
                                    value={formData.teacher_id}
                                    onChange={(e) => setFormData({ ...formData, teacher_id: e.target.value })}
                                >
                                    <option value="">No teacher assigned</option>
                                    {teachers.map((teacher) => (
                                        <option key={teacher.id} value={teacher.id}>
                                            {teacher.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label htmlFor="start_date">Start Date *</label>
                                <input
                                    type="date"
                                    id="start_date"
                                    value={formData.start_date}
                                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="modal-actions">
                                <Button variant="ghost" onClick={() => setShowModal(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit" variant="primary" loading={saving}>
                                    {editingClass ? 'Save Changes' : 'Create Class'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            <ConfirmModal
                isOpen={!!classToDelete}
                onClose={() => setClassToDelete(null)}
                onConfirm={handleDelete}
                title="Deactivate Class"
                message="Are you sure you want to deactivate this class? Students will no longer see it."
                confirmText="Deactivate"
                variant="danger"
            />
        </div>
    );
}

export default AdminClasses;
