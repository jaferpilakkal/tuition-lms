import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Badge, ProgressBar, LoadingSpinner, EmptyState } from '../../components/common';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../services/supabase';
import { Calendar, CheckSquare, FileText, Users, Clock } from 'lucide-react';
import './TeacherDashboard.css';

function TeacherDashboard() {
    const { profile } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [todaySessions, setTodaySessions] = useState([]);
    const [pendingSubmissions, setPendingSubmissions] = useState(0);
    const [classStats, setClassStats] = useState([]);

    useEffect(() => {
        if (profile) {
            fetchDashboardData();
        }
    }, [profile]);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            await Promise.all([
                fetchTodaySessions(),
                fetchPendingSubmissions(),
                fetchClassStats(),
            ]);
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchTodaySessions = async () => {
        const today = new Date().toISOString().split('T')[0];

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
            .eq('session_date', today)
            .eq('is_completed', false)
            .order('session_time', { ascending: true });

        if (!error) setTodaySessions(data || []);
    };

    const fetchPendingSubmissions = async () => {
        const { data, error } = await supabase
            .from('task_submissions')
            .select(`
        id,
        task:tasks!inner (
          created_by
        )
      `)
            .eq('task.created_by', profile.id)
            .eq('status', 'Submitted');

        if (!error) setPendingSubmissions(data?.length || 0);
    };

    const fetchClassStats = async () => {
        const { data: classes, error } = await supabase
            .from('classes')
            .select(`
        id,
        class_name,
        subject
      `)
            .eq('teacher_id', profile.id)
            .eq('is_active', true)
            .limit(4);

        if (!error && classes) {
            // Get task stats for each class
            const stats = await Promise.all(
                classes.map(async (cls) => {
                    const { data: tasks } = await supabase
                        .from('tasks')
                        .select(`
              id,
              task_submissions (status)
            `)
                        .eq('class_id', cls.id);

                    let total = 0;
                    let completed = 0;

                    tasks?.forEach(task => {
                        task.task_submissions?.forEach(sub => {
                            total++;
                            if (sub.status === 'Completed') completed++;
                        });
                    });

                    return {
                        ...cls,
                        total,
                        completed,
                        percentage: total > 0 ? Math.round((completed / total) * 100) : 0
                    };
                })
            );

            setClassStats(stats);
        }
    };

    if (loading) {
        return <LoadingSpinner fullPage text="Loading dashboard..." />;
    }

    return (
        <div className="teacher-dashboard">
            <div className="page-header">
                <h1 className="page-title">Welcome, {profile?.name?.split(' ')[0]}!</h1>
                <p className="page-subtitle">Here's your teaching overview</p>
            </div>

            <div className="dashboard-grid">
                {/* Today's Classes */}
                <Card
                    title="Today's Sessions"
                    subtitle={todaySessions.length > 0 ? `${todaySessions.length} sessions scheduled` : 'No sessions today'}
                    accent="primary"
                    onClick={() => navigate('/teacher/sessions')}
                >
                    {todaySessions.length > 0 ? (
                        <div className="session-list">
                            {todaySessions.slice(0, 3).map((session) => (
                                <div key={session.id} className="session-item">
                                    <div className="session-info">
                                        <Clock size={16} className="session-icon" />
                                        <div>
                                            <p className="session-subject">{session.class?.subject}</p>
                                            <p className="session-time">{session.session_time || 'No time set'}</p>
                                        </div>
                                    </div>
                                    {session.live_link && (
                                        <Badge status="Live" size="small" />
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="empty-sessions">
                            <Calendar size={32} className="empty-icon" />
                            <p>No sessions scheduled for today</p>
                        </div>
                    )}
                </Card>

                {/* Pending Actions */}
                <Card
                    title="Pending Reviews"
                    subtitle="Tasks waiting for your review"
                    accent={pendingSubmissions > 0 ? 'warning' : 'success'}
                    onClick={() => navigate('/teacher/tasks')}
                >
                    <div className="pending-stat">
                        <span className="pending-number">{pendingSubmissions}</span>
                        <span className="pending-label">submissions to review</span>
                    </div>
                    {pendingSubmissions > 0 && (
                        <button className="review-btn">
                            Review Now →
                        </button>
                    )}
                </Card>

                {/* Class Progress */}
                <Card
                    title="Class Task Progress"
                    subtitle="Completion rates by class"
                    className="progress-card"
                >
                    {classStats.length === 0 ? (
                        <EmptyState
                            icon="classes"
                            title="No classes assigned"
                            description="Contact admin to get classes assigned"
                        />
                    ) : (
                        <div className="class-progress-list">
                            {classStats.map((cls) => (
                                <div key={cls.id} className="class-progress-item">
                                    <div className="class-info">
                                        <span className="class-name">{cls.subject}</span>
                                        <span className="class-percent">{cls.percentage}%</span>
                                    </div>
                                    <ProgressBar
                                        percentage={cls.percentage}
                                        color={cls.percentage >= 70 ? 'success' : cls.percentage >= 40 ? 'warning' : 'danger'}
                                        size="small"
                                        showLabel={false}
                                    />
                                </div>
                            ))}
                        </div>
                    )}
                </Card>
            </div>
        </div>
    );
}

export default TeacherDashboard;
