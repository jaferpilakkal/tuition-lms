import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Badge, Button, LoadingSpinner, EmptyState } from '../../components/common';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../services/supabase';
import { Plus, Calendar, FileText, Users, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import './TeacherTasks.css';

function TeacherTasks() {
    const { profile } = useAuth();
    const navigate = useNavigate();
    const [tasks, setTasks] = useState([]);
    const [classes, setClasses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        class_id: '',
        title: '',
        description: '',
        due_date: ''
    });
    const [creating, setCreating] = useState(false);

    useEffect(() => {
        fetchData();
    }, [profile]);

    const fetchData = async () => {
        if (!profile) return;

        try {
            setLoading(true);
            await Promise.all([fetchClasses(), fetchTasks()]);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchClasses = async () => {
        const { data, error } = await supabase
            .from('classes')
            .select('id, class_name, subject')
            .eq('teacher_id', profile.id)
            .eq('is_active', true);

        if (!error) setClasses(data || []);
    };

    const fetchTasks = async () => {
        const { data, error } = await supabase
            .from('tasks')
            .select(`
        *,
        class:classes (
          class_name,
          subject
        )
      `)
            .eq('created_by', profile.id)
            .order('due_date', { ascending: false });

        if (!error) setTasks(data || []);
    };

    const handleCreateTask = async (e) => {
        e.preventDefault();

        if (!formData.class_id || !formData.title || !formData.description || !formData.due_date) {
            toast.error('Please fill in all fields');
            return;
        }

        try {
            setCreating(true);

            // Create task
            const { data: newTask, error: taskError } = await supabase
                .from('tasks')
                .insert({
                    class_id: formData.class_id,
                    title: formData.title,
                    description: formData.description,
                    due_date: formData.due_date,
                    created_by: profile.id
                })
                .select()
                .single();

            if (taskError) throw taskError;

            // Get enrolled students and create submissions
            const { data: enrollments, error: enrollError } = await supabase
                .from('class_enrollments')
                .select('student_id')
                .eq('class_id', formData.class_id)
                .eq('is_active', true);

            if (!enrollError && enrollments?.length > 0) {
                const submissions = enrollments.map(e => ({
                    task_id: newTask.id,
                    student_id: e.student_id,
                    status: 'Assigned'
                }));

                await supabase.from('task_submissions').insert(submissions);
            }

            toast.success('Task created successfully!');
            setShowCreateModal(false);
            setFormData({ class_id: '', title: '', description: '', due_date: '' });
            fetchTasks();
        } catch (error) {
            console.error('Error creating task:', error);
            toast.error('Failed to create task');
        } finally {
            setCreating(false);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const isOverdue = (dueDate) => {
        const today = new Date().toISOString().split('T')[0];
        return dueDate < today;
    };

    if (loading) {
        return <LoadingSpinner fullPage text="Loading tasks..." />;
    }

    return (
        <div className="teacher-tasks">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Tasks</h1>
                    <p className="page-subtitle">Manage student assignments</p>
                </div>
                <Button
                    variant="primary"
                    onClick={() => setShowCreateModal(true)}
                    icon={<Plus size={18} />}
                >
                    New Task
                </Button>
            </div>

            {/* Task List */}
            {tasks.length === 0 ? (
                <EmptyState
                    icon="tasks"
                    title="No tasks created"
                    description="Create your first task to assign to students"
                />
            ) : (
                <div className="task-list">
                    {tasks.map((task) => (
                        <Card
                            key={task.id}
                            className={`task-card ${isOverdue(task.due_date) ? 'task-overdue' : ''}`}
                            onClick={() => navigate(`/teacher/tasks/${task.id}`)}
                        >
                            <div className="task-content">
                                <div className="task-info">
                                    <h3 className="task-title">{task.title}</h3>
                                    <p className="task-class">
                                        {task.class?.subject} • {task.class?.class_name}
                                    </p>
                                    <div className="task-meta">
                                        <Calendar size={14} />
                                        <span>Due {formatDate(task.due_date)}</span>
                                    </div>
                                </div>
                                <div className="task-action">
                                    {isOverdue(task.due_date) && (
                                        <Badge status="Overdue" size="small" />
                                    )}
                                    <ChevronRight size={20} className="task-arrow" />
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            {/* Create Task Modal */}
            {showCreateModal && (
                <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <h2 className="modal-title">Create New Task</h2>
                        <form onSubmit={handleCreateTask}>
                            <div className="form-group">
                                <label htmlFor="class_id">Class</label>
                                <select
                                    id="class_id"
                                    value={formData.class_id}
                                    onChange={(e) => setFormData({ ...formData, class_id: e.target.value })}
                                    required
                                >
                                    <option value="">Select a class</option>
                                    {classes.map((cls) => (
                                        <option key={cls.id} value={cls.id}>
                                            {cls.subject} - {cls.class_name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label htmlFor="title">Title</label>
                                <input
                                    type="text"
                                    id="title"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    placeholder="e.g., Chapter 5 Homework"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="description">Description</label>
                                <textarea
                                    id="description"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Describe the task requirements..."
                                    rows={4}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="due_date">Due Date</label>
                                <input
                                    type="date"
                                    id="due_date"
                                    value={formData.due_date}
                                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="modal-actions">
                                <Button variant="ghost" onClick={() => setShowCreateModal(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit" variant="primary" loading={creating}>
                                    Create Task
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default TeacherTasks;
