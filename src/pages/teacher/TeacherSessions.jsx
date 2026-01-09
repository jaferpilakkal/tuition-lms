import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Badge, Button, LoadingSpinner, EmptyState } from '../../components/common';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../services/supabase';
import { Calendar, Users, Plus, Video, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import './TeacherSessions.css';

function TeacherSessions() {
    const { profile } = useAuth();
    const navigate = useNavigate();
    const [sessions, setSessions] = useState([]);
    const [classes, setClasses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        class_id: '',
        session_date: '',
        session_time: '',
        live_link: ''
    });
    const [creating, setCreating] = useState(false);

    useEffect(() => {
        fetchData();
    }, [profile]);

    const fetchData = async () => {
        if (!profile) return;

        try {
            setLoading(true);
            await Promise.all([fetchClasses(), fetchSessions()]);
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

    const fetchSessions = async () => {
        const { data, error } = await supabase
            .from('sessions')
            .select(`
        *,
        class:classes (
          class_name,
          subject
        )
      `)
            .eq('created_by', profile.id)
            .order('session_date', { ascending: false })
            .limit(50);

        if (!error) setSessions(data || []);
    };

    const handleCreateSession = async (e) => {
        e.preventDefault();

        if (!formData.class_id || !formData.session_date) {
            toast.error('Please select a class and date');
            return;
        }

        try {
            setCreating(true);

            const { error } = await supabase
                .from('sessions')
                .insert({
                    class_id: formData.class_id,
                    session_date: formData.session_date,
                    session_time: formData.session_time || null,
                    live_link: formData.live_link || null,
                    created_by: profile.id
                });

            if (error) throw error;

            toast.success('Session created successfully!');
            setShowCreateModal(false);
            setFormData({ class_id: '', session_date: '', session_time: '', live_link: '' });
            fetchSessions();
        } catch (error) {
            console.error('Error creating session:', error);
            toast.error('Failed to create session');
        } finally {
            setCreating(false);
        }
    };

    const handleMarkComplete = async (sessionId) => {
        try {
            const { error } = await supabase
                .from('sessions')
                .update({ is_completed: true })
                .eq('id', sessionId);

            if (error) throw error;

            toast.success('Session marked as complete');
            fetchSessions();
        } catch (error) {
            toast.error('Failed to update session');
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const isToday = (dateString) => {
        const today = new Date().toISOString().split('T')[0];
        return dateString === today;
    };

    const isUpcoming = (dateString) => {
        const today = new Date().toISOString().split('T')[0];
        return dateString >= today;
    };

    // Group sessions by status
    const todaySessions = sessions.filter(s => isToday(s.session_date) && !s.is_completed);
    const upcomingSessions = sessions.filter(s => isUpcoming(s.session_date) && !isToday(s.session_date));
    const pastSessions = sessions.filter(s => !isUpcoming(s.session_date) || s.is_completed);

    if (loading) {
        return <LoadingSpinner fullPage text="Loading sessions..." />;
    }

    return (
        <div className="teacher-sessions">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Sessions</h1>
                    <p className="page-subtitle">Manage your class sessions</p>
                </div>
                <Button
                    variant="primary"
                    onClick={() => setShowCreateModal(true)}
                    icon={<Plus size={18} />}
                >
                    New Session
                </Button>
            </div>

            {/* Today's Sessions */}
            {todaySessions.length > 0 && (
                <section className="session-section">
                    <h2 className="section-title">Today</h2>
                    <div className="session-list">
                        {todaySessions.map((session) => (
                            <Card key={session.id} className="session-card session-today">
                                <div className="session-content">
                                    <div className="session-info">
                                        <h3 className="session-subject">{session.class?.subject}</h3>
                                        <p className="session-class">{session.class?.class_name}</p>
                                        <p className="session-time">
                                            {session.session_time || 'No time set'}
                                        </p>
                                    </div>
                                    <div className="session-actions">
                                        {session.live_link && (
                                            <a
                                                href={session.live_link}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="btn-live"
                                            >
                                                <Video size={16} />
                                                Join
                                            </a>
                                        )}
                                        <Button
                                            variant="ghost"
                                            size="small"
                                            onClick={() => navigate(`/teacher/sessions/${session.id}/attendance`)}
                                        >
                                            <Users size={16} />
                                            Attendance
                                        </Button>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                </section>
            )}

            {/* Upcoming Sessions */}
            <section className="session-section">
                <h2 className="section-title">Upcoming</h2>
                {upcomingSessions.length === 0 ? (
                    <EmptyState
                        icon="sessions"
                        title="No upcoming sessions"
                        description="Create a new session to get started"
                    />
                ) : (
                    <div className="session-list">
                        {upcomingSessions.map((session) => (
                            <Card key={session.id} className="session-card">
                                <div className="session-content">
                                    <div className="session-info">
                                        <h3 className="session-subject">{session.class?.subject}</h3>
                                        <p className="session-class">{session.class?.class_name}</p>
                                        <div className="session-meta">
                                            <Calendar size={14} />
                                            <span>{formatDate(session.session_date)}</span>
                                            {session.session_time && <span> • {session.session_time}</span>}
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </section>

            {/* Past Sessions */}
            {pastSessions.length > 0 && (
                <section className="session-section">
                    <h2 className="section-title">Past Sessions</h2>
                    <div className="session-list">
                        {pastSessions.slice(0, 10).map((session) => (
                            <Card key={session.id} className="session-card session-past">
                                <div className="session-content">
                                    <div className="session-info">
                                        <h3 className="session-subject">{session.class?.subject}</h3>
                                        <p className="session-class">{session.class?.class_name}</p>
                                        <p className="session-date">{formatDate(session.session_date)}</p>
                                    </div>
                                    <Badge
                                        status={session.is_completed ? 'Completed' : 'Pending'}
                                        size="small"
                                    />
                                </div>
                            </Card>
                        ))}
                    </div>
                </section>
            )}

            {/* Create Session Modal */}
            {showCreateModal && (
                <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <h2 className="modal-title">Create New Session</h2>
                        <form onSubmit={handleCreateSession}>
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
                                <label htmlFor="session_date">Date</label>
                                <input
                                    type="date"
                                    id="session_date"
                                    value={formData.session_date}
                                    onChange={(e) => setFormData({ ...formData, session_date: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="session_time">Time (optional)</label>
                                <input
                                    type="time"
                                    id="session_time"
                                    value={formData.session_time}
                                    onChange={(e) => setFormData({ ...formData, session_time: e.target.value })}
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="live_link">Live Link (optional)</label>
                                <input
                                    type="url"
                                    id="live_link"
                                    value={formData.live_link}
                                    onChange={(e) => setFormData({ ...formData, live_link: e.target.value })}
                                    placeholder="https://meet.google.com/..."
                                />
                            </div>

                            <div className="modal-actions">
                                <Button variant="ghost" onClick={() => setShowCreateModal(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit" variant="primary" loading={creating}>
                                    Create Session
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default TeacherSessions;
