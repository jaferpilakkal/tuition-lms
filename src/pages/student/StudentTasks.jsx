import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Badge, Button, LoadingSpinner, EmptyState } from '../../components/common';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../services/supabase';
import { ClipboardList, Calendar, ChevronRight } from 'lucide-react';
import './StudentTasks.css';

function StudentTasks() {
    const { profile } = useAuth();
    const navigate = useNavigate();
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        fetchTasks();
    }, [profile]);

    const fetchTasks = async () => {
        if (!profile) return;

        try {
            setLoading(true);

            // Fetch task submissions for this student with task details
            const { data, error } = await supabase
                .from('task_submissions')
                .select(`
          *,
          task:tasks (
            id,
            title,
            description,
            due_date,
            class:classes (
              class_name,
              subject
            )
          )
        `)
                .eq('student_id', profile.id)
                .order('task(due_date)', { ascending: true });

            if (error) throw error;

            setTasks(data || []);
        } catch (error) {
            console.error('Error fetching tasks:', error);
        } finally {
            setLoading(false);
        }
    };

    const getFilteredTasks = () => {
        const today = new Date().toISOString().split('T')[0];

        switch (filter) {
            case 'pending':
                return tasks.filter(t => ['Assigned', 'Submitted', 'Reviewed'].includes(t.status));
            case 'completed':
                return tasks.filter(t => t.status === 'Completed');
            case 'overdue':
                return tasks.filter(t => t.status !== 'Completed' && t.task?.due_date < today);
            default:
                return tasks;
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

    const isOverdue = (dueDate, status) => {
        if (status === 'Completed') return false;
        const today = new Date().toISOString().split('T')[0];
        return dueDate < today;
    };

    const filteredTasks = getFilteredTasks();

    if (loading) {
        return <LoadingSpinner fullPage text="Loading tasks..." />;
    }

    return (
        <div className="student-tasks">
            <div className="page-header">
                <h1 className="page-title">My Tasks</h1>
                <p className="page-subtitle">{tasks.length} total assignments</p>
            </div>

            {/* Filter Tabs */}
            <div className="filter-tabs">
                <button
                    className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
                    onClick={() => setFilter('all')}
                >
                    All
                </button>
                <button
                    className={`filter-tab ${filter === 'pending' ? 'active' : ''}`}
                    onClick={() => setFilter('pending')}
                >
                    Pending
                </button>
                <button
                    className={`filter-tab ${filter === 'completed' ? 'active' : ''}`}
                    onClick={() => setFilter('completed')}
                >
                    Completed
                </button>
                <button
                    className={`filter-tab ${filter === 'overdue' ? 'active' : ''}`}
                    onClick={() => setFilter('overdue')}
                >
                    Overdue
                </button>
            </div>

            {/* Task List */}
            {filteredTasks.length === 0 ? (
                <EmptyState
                    icon="tasks"
                    title={filter === 'all' ? 'No tasks assigned yet' : `No ${filter} tasks`}
                    description="Your teacher will assign tasks here"
                />
            ) : (
                <div className="task-list">
                    {filteredTasks.map((submission) => {
                        const task = submission.task;
                        const overdue = isOverdue(task?.due_date, submission.status);

                        return (
                            <Card
                                key={submission.id}
                                className={`task-card ${overdue ? 'task-card-overdue' : ''}`}
                                onClick={() => navigate(`/student/tasks/${submission.id}`)}
                            >
                                <div className="task-card-content">
                                    <div className="task-info">
                                        <h3 className="task-title">{task?.title}</h3>
                                        <p className="task-subject">
                                            {task?.class?.subject} • {task?.class?.class_name}
                                        </p>
                                        <div className="task-due">
                                            <Calendar size={14} />
                                            <span>Due {formatDate(task?.due_date)}</span>
                                        </div>
                                    </div>
                                    <div className="task-action">
                                        <Badge
                                            status={overdue ? 'Overdue' : submission.status}
                                            size="small"
                                        />
                                        <ChevronRight size={20} className="task-arrow" />
                                    </div>
                                </div>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

export default StudentTasks;
