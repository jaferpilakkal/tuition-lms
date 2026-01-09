import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Badge, Button, LoadingSpinner, EmptyState, ProgressBar } from '../../components/common';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../services/supabase';
import { ArrowLeft, Calendar, Check, MessageSquare, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';
import './TaskReview.css';

function TaskReview() {
    const { taskId } = useParams();
    const { profile } = useAuth();
    const navigate = useNavigate();

    const [task, setTask] = useState(null);
    const [submissions, setSubmissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedSubmission, setSelectedSubmission] = useState(null);
    const [remarks, setRemarks] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchData();
    }, [taskId]);

    const fetchData = async () => {
        try {
            setLoading(true);

            // Fetch task details
            const { data: taskData, error: taskError } = await supabase
                .from('tasks')
                .select(`
          *,
          class:classes (
            class_name,
            subject
          )
        `)
                .eq('id', taskId)
                .single();

            if (taskError) throw taskError;
            setTask(taskData);

            // Fetch submissions - use explicit FK reference for ambiguous relationship
            const { data: submissionData, error: subError } = await supabase
                .from('task_submissions')
                .select(`
          *,
          student:profiles!task_submissions_student_id_fkey (
            id,
            name,
            email
          )
        `)
                .eq('task_id', taskId)
                .order('status', { ascending: true });

            if (!subError) setSubmissions(submissionData || []);
        } catch (error) {
            console.error('[TaskReview] Error fetching data:', error);
            toast.error('Failed to load task');
            navigate('/teacher/tasks');
        } finally {
            setLoading(false);
        }
    };

    const openReviewModal = (submission) => {
        setSelectedSubmission(submission);
        setRemarks(submission.remarks || '');
    };

    const handleReview = async (status) => {
        if (!selectedSubmission) return;

        try {
            setSaving(true);

            const { error } = await supabase
                .from('task_submissions')
                .update({
                    status,
                    remarks: remarks.trim() || null,
                    reviewed_by: profile.id
                })
                .eq('id', selectedSubmission.id);

            if (error) throw error;

            toast.success(`Task marked as ${status}`);
            setSelectedSubmission(null);
            setRemarks('');
            fetchData();
        } catch (error) {
            console.error('Error updating submission:', error);
            toast.error('Failed to update task');
        } finally {
            setSaving(false);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const getStats = () => {
        const total = submissions.length;
        const submitted = submissions.filter(s => s.status === 'Submitted').length;
        const reviewed = submissions.filter(s => s.status === 'Reviewed').length;
        const completed = submissions.filter(s => s.status === 'Completed').length;
        const pending = submissions.filter(s => s.status === 'Assigned').length;

        return { total, submitted, reviewed, completed, pending };
    };

    if (loading) {
        return <LoadingSpinner fullPage text="Loading task..." />;
    }

    const stats = getStats();
    const progressPercent = stats.total > 0 ? ((stats.completed + stats.reviewed) / stats.total) * 100 : 0;

    return (
        <div className="task-review">
            <div className="page-header-with-back">
                <button className="back-button" onClick={() => navigate('/teacher/tasks')}>
                    <ArrowLeft size={20} />
                    <span>Back to Tasks</span>
                </button>
            </div>

            {/* Task Info */}
            <Card className="task-info-card">
                <div className="task-header">
                    <div>
                        <h1 className="task-title">{task?.title}</h1>
                        <p className="task-class">
                            {task?.class?.subject} • {task?.class?.class_name}
                        </p>
                        <div className="task-due">
                            <Calendar size={16} />
                            <span>Due {formatDate(task?.due_date)}</span>
                        </div>
                    </div>
                </div>
                <p className="task-description">{task?.description}</p>
            </Card>

            {/* Progress Stats */}
            <div className="progress-stats">
                <div className="progress-header">
                    <span>Progress</span>
                    <span>{stats.completed + stats.reviewed} / {stats.total} reviewed</span>
                </div>
                <ProgressBar percentage={progressPercent} color="primary" />
                <div className="stat-row">
                    <Badge status="Assigned" size="small" /> {stats.pending}
                    <Badge status="Submitted" size="small" /> {stats.submitted}
                    <Badge status="Completed" size="small" /> {stats.completed}
                </div>
            </div>

            {/* Submissions List */}
            <h2 className="section-title">Student Submissions</h2>

            {submissions.length === 0 ? (
                <EmptyState
                    icon="users"
                    title="No submissions"
                    description="No students are assigned to this task"
                />
            ) : (
                <div className="submission-list">
                    {submissions.map((sub) => (
                        <Card
                            key={sub.id}
                            className={`submission-card ${sub.status === 'Submitted' ? 'needs-review' : ''}`}
                            onClick={() => sub.status !== 'Assigned' && openReviewModal(sub)}
                        >
                            <div className="submission-content">
                                <div className="submission-info">
                                    <p className="submission-name">{sub.student?.name}</p>
                                    <p className="submission-email">{sub.student?.email}</p>
                                </div>
                                <div className="submission-status">
                                    <Badge status={sub.status} size="small" />
                                    {sub.status === 'Submitted' && (
                                        <span className="review-prompt">Tap to review</span>
                                    )}
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            {/* Review Modal */}
            {selectedSubmission && (
                <div className="modal-overlay" onClick={() => setSelectedSubmission(null)}>
                    <div className="modal-content review-modal" onClick={e => e.stopPropagation()}>
                        <h2 className="modal-title">Review Submission</h2>

                        <div className="student-header">
                            <p className="student-name">{selectedSubmission.student?.name}</p>
                            <Badge status={selectedSubmission.status} />
                        </div>

                        {selectedSubmission.submission_text && (
                            <div className="submission-section">
                                <h4>Response</h4>
                                <p className="submission-text">{selectedSubmission.submission_text}</p>
                            </div>
                        )}

                        {selectedSubmission.submission_link && (
                            <div className="submission-section">
                                <h4>Link</h4>
                                <a
                                    href={selectedSubmission.submission_link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="submission-link"
                                >
                                    <ExternalLink size={14} />
                                    Open submitted link
                                </a>
                            </div>
                        )}

                        {selectedSubmission.submitted_at && (
                            <p className="submitted-time">
                                Submitted {new Date(selectedSubmission.submitted_at).toLocaleString()}
                            </p>
                        )}

                        <div className="form-group">
                            <label htmlFor="remarks">
                                <MessageSquare size={16} />
                                Remarks (optional)
                            </label>
                            <textarea
                                id="remarks"
                                value={remarks}
                                onChange={(e) => setRemarks(e.target.value)}
                                placeholder="Add feedback for the student..."
                                rows={3}
                            />
                        </div>

                        <div className="modal-actions">
                            <Button variant="ghost" onClick={() => setSelectedSubmission(null)}>
                                Cancel
                            </Button>
                            <Button
                                variant="secondary"
                                onClick={() => handleReview('Reviewed')}
                                loading={saving}
                            >
                                Mark Reviewed
                            </Button>
                            <Button
                                variant="primary"
                                onClick={() => handleReview('Completed')}
                                loading={saving}
                                icon={<Check size={16} />}
                            >
                                Complete
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default TaskReview;
