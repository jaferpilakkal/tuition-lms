import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Badge, Button, LoadingSpinner } from '../../components/common';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../services/supabase';
import { ArrowLeft, Calendar, FileText, Link as LinkIcon, Upload } from 'lucide-react';
import toast from 'react-hot-toast';
import './TaskSubmission.css';

function TaskSubmission() {
    const { submissionId } = useParams();
    const { profile } = useAuth();
    const navigate = useNavigate();

    const [submission, setSubmission] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // Form state
    const [submissionText, setSubmissionText] = useState('');
    const [submissionLink, setSubmissionLink] = useState('');

    useEffect(() => {
        fetchSubmission();
    }, [submissionId]);

    const fetchSubmission = async () => {
        try {
            setLoading(true);

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
                .eq('id', submissionId)
                .single();

            if (error) throw error;

            setSubmission(data);
            setSubmissionText(data.submission_text || '');
            setSubmissionLink(data.submission_link || '');
        } catch (error) {
            console.error('Error fetching submission:', error);
            toast.error('Failed to load task');
            navigate('/student/tasks');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!submissionText.trim() && !submissionLink.trim()) {
            toast.error('Please provide a response or link');
            return;
        }

        try {
            setSubmitting(true);

            const { error } = await supabase
                .from('task_submissions')
                .update({
                    submission_text: submissionText.trim() || null,
                    submission_link: submissionLink.trim() || null,
                    status: 'Submitted',
                    submitted_at: new Date().toISOString()
                })
                .eq('id', submissionId);

            if (error) throw error;

            toast.success('Task submitted successfully!');
            navigate('/student/tasks');
        } catch (error) {
            console.error('Error submitting task:', error);
            toast.error('Failed to submit task');
        } finally {
            setSubmitting(false);
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

    const isOverdue = () => {
        if (!submission?.task?.due_date) return false;
        if (submission.status === 'Completed') return false;
        const today = new Date().toISOString().split('T')[0];
        return submission.task.due_date < today;
    };

    const canSubmit = () => {
        return ['Assigned', 'Submitted'].includes(submission?.status);
    };

    if (loading) {
        return <LoadingSpinner fullPage text="Loading task..." />;
    }

    if (!submission) {
        return null;
    }

    const task = submission.task;

    return (
        <div className="task-submission-page">
            {/* Header */}
            <div className="page-header-with-back">
                <button className="back-button" onClick={() => navigate('/student/tasks')}>
                    <ArrowLeft size={20} />
                    <span>Back to Tasks</span>
                </button>
            </div>

            {/* Task Info Card */}
            <Card className="task-info-card">
                <div className="task-header">
                    <div className="task-meta">
                        <Badge
                            status={isOverdue() ? 'Overdue' : submission.status}
                        />
                        <span className="task-class">
                            {task?.class?.subject} • {task?.class?.class_name}
                        </span>
                    </div>
                    <h1 className="task-title">{task?.title}</h1>
                </div>

                <div className="task-due-date">
                    <Calendar size={16} />
                    <span>Due: {formatDate(task?.due_date)}</span>
                    {isOverdue() && <span className="overdue-label">(Overdue)</span>}
                </div>

                <div className="task-description">
                    <h3>Description</h3>
                    <p>{task?.description}</p>
                </div>
            </Card>

            {/* Submission Form */}
            {canSubmit() ? (
                <Card className="submission-card">
                    <h2 className="submission-title">Your Submission</h2>

                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label htmlFor="submissionText">
                                <FileText size={16} />
                                Text Response
                            </label>
                            <textarea
                                id="submissionText"
                                value={submissionText}
                                onChange={(e) => setSubmissionText(e.target.value)}
                                placeholder="Type your response here..."
                                rows={6}
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="submissionLink">
                                <LinkIcon size={16} />
                                Link (Google Docs, Drive, etc.)
                            </label>
                            <input
                                id="submissionLink"
                                type="url"
                                value={submissionLink}
                                onChange={(e) => setSubmissionLink(e.target.value)}
                                placeholder="https://docs.google.com/..."
                            />
                            <p className="form-hint">Paste a link to your work (recommended)</p>
                        </div>

                        <div className="form-actions">
                            <Button
                                type="submit"
                                variant="primary"
                                size="large"
                                fullWidth
                                loading={submitting}
                            >
                                {submission.status === 'Submitted' ? 'Update Submission' : 'Submit Task'}
                            </Button>
                        </div>
                    </form>
                </Card>
            ) : (
                <Card className="submission-card">
                    <h2 className="submission-title">Your Submission</h2>

                    {submission.submission_text && (
                        <div className="submitted-content">
                            <h4>Response</h4>
                            <p>{submission.submission_text}</p>
                        </div>
                    )}

                    {submission.submission_link && (
                        <div className="submitted-content">
                            <h4>Link</h4>
                            <a href={submission.submission_link} target="_blank" rel="noopener noreferrer">
                                {submission.submission_link}
                            </a>
                        </div>
                    )}

                    {submission.remarks && (
                        <div className="teacher-remarks">
                            <h4>Teacher's Remarks</h4>
                            <p>{submission.remarks}</p>
                        </div>
                    )}
                </Card>
            )}
        </div>
    );
}

export default TaskSubmission;
