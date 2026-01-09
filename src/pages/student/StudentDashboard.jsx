import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Badge, ProgressBar, EmptyState, LoadingSpinner } from '../../components/common';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../services/supabase';
import { Calendar, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import './StudentDashboard.css';

function StudentDashboard() {
    const { profile } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [attendanceData, setAttendanceData] = useState({ percentage: 0, attended: 0, total: 0 });
    const [taskData, setTaskData] = useState({ completed: 0, pending: 0, overdue: 0, total: 0 });
    const [upcomingClasses, setUpcomingClasses] = useState([]);
    const [overdueTasks, setOverdueTasks] = useState([]);

    useEffect(() => {
        if (profile) {
            fetchDashboardData();
        }
    }, [profile]);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            await Promise.all([
                fetchAttendance(),
                fetchTasks(),
                fetchUpcomingClasses(),
            ]);
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchAttendance = async () => {
        const { data, error } = await supabase
            .from('attendance_records')
            .select('status')
            .eq('student_id', profile.id);

        if (!error && data) {
            const total = data.length;
            const attended = data.filter(a => a.status === 'Present').length;
            const percentage = total > 0 ? Math.round((attended / total) * 100) : 0;
            setAttendanceData({ percentage, attended, total });
        }
    };

    const fetchTasks = async () => {
        const today = new Date().toISOString().split('T')[0];

        const { data, error } = await supabase
            .from('task_submissions')
            .select(`
        id,
        status,
        task:tasks (
          title,
          due_date,
          class:classes (subject)
        )
      `)
            .eq('student_id', profile.id);

        if (!error && data) {
            const total = data.length;
            const completed = data.filter(t => t.status === 'Completed').length;
            const pending = data.filter(t => ['Assigned', 'Submitted', 'Reviewed'].includes(t.status)).length;
            const overdue = data.filter(t => t.status !== 'Completed' && t.task?.due_date < today);

            setTaskData({ completed, pending, overdue: overdue.length, total });
            setOverdueTasks(overdue.slice(0, 3));
        }
    };

    const fetchUpcomingClasses = async () => {
        const today = new Date().toISOString().split('T')[0];

        // Get student's enrolled classes
        const { data: enrollments, error: enrollError } = await supabase
            .from('class_enrollments')
            .select('class_id')
            .eq('student_id', profile.id)
            .eq('is_active', true);

        if (enrollError || !enrollments?.length) return;

        const classIds = enrollments.map(e => e.class_id);

        // Get upcoming sessions
        const { data: sessions, error: sessionError } = await supabase
            .from('sessions')
            .select(`
        id,
        session_date,
        session_time,
        live_link,
        class:classes (
          class_name,
          subject
        )
      `)
            .in('class_id', classIds)
            .gte('session_date', today)
            .order('session_date', { ascending: true })
            .limit(3);

        if (!sessionError && sessions) {
            setUpcomingClasses(sessions);
        }
    };

    const formatDate = (dateString, timeString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        let dayPart;
        if (date.toDateString() === today.toDateString()) {
            dayPart = 'Today';
        } else if (date.toDateString() === tomorrow.toDateString()) {
            dayPart = 'Tomorrow';
        } else {
            dayPart = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        }

        if (timeString) {
            return `${dayPart}, ${timeString}`;
        }
        return dayPart;
    };

    if (loading) {
        return <LoadingSpinner fullPage text="Loading dashboard..." />;
    }

    return (
        <div className="student-dashboard">
            <div className="page-header">
                <h1 className="page-title">Welcome back, {profile?.name?.split(' ')[0]}!</h1>
                <p className="page-subtitle">Here's your learning progress</p>
            </div>

            <div className="dashboard-grid">
                {/* Attendance Card */}
                <Card
                    title="Attendance"
                    subtitle="Your class attendance"
                    accent="primary"
                    className="attendance-card"
                    onClick={() => navigate('/student/attendance')}
                >
                    <div className="stat-large">
                        <span className="stat-number">{attendanceData.percentage}%</span>
                    </div>
                    <ProgressBar
                        percentage={attendanceData.percentage}
                        color={attendanceData.percentage >= 75 ? 'success' : 'warning'}
                        size="large"
                        showLabel={false}
                    />
                    <p className="stat-detail">
                        {attendanceData.attended} of {attendanceData.total} sessions attended
                    </p>
                </Card>

                {/* Task Progress Card */}
                <Card
                    title="Task Progress"
                    subtitle="Your assignments"
                    accent="success"
                    className="task-card"
                    onClick={() => navigate('/student/tasks')}
                >
                    <div className="task-stats">
                        <div className="task-stat">
                            <CheckCircle size={20} className="icon-success" />
                            <span>{taskData.completed} Completed</span>
                        </div>
                        <div className="task-stat">
                            <Clock size={20} className="icon-warning" />
                            <span>{taskData.pending} Pending</span>
                        </div>
                        {taskData.overdue > 0 && (
                            <div className="task-stat">
                                <AlertCircle size={20} className="icon-danger" />
                                <span>{taskData.overdue} Overdue</span>
                            </div>
                        )}
                    </div>
                    <ProgressBar
                        percentage={taskData.total > 0 ? (taskData.completed / taskData.total) * 100 : 0}
                        color="success"
                        size="medium"
                    />
                </Card>

                {/* Upcoming Classes Card */}
                <Card
                    title="Upcoming Classes"
                    subtitle="Your next sessions"
                    accent="primary"
                    className="upcoming-card"
                >
                    {upcomingClasses.length > 0 ? (
                        <div className="upcoming-list">
                            {upcomingClasses.map((cls) => (
                                <div key={cls.id} className="upcoming-item">
                                    <div className="upcoming-info">
                                        <Calendar size={18} className="upcoming-icon" />
                                        <div>
                                            <p className="upcoming-subject">{cls.class?.subject}</p>
                                            <p className="upcoming-date">{formatDate(cls.session_date, cls.session_time)}</p>
                                        </div>
                                    </div>
                                    {cls.live_link ? (
                                        <a
                                            href={cls.live_link}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="join-btn"
                                        >
                                            Join
                                        </a>
                                    ) : (
                                        <span className="no-link">No link</span>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <EmptyState
                            icon="sessions"
                            title="No upcoming classes"
                            description="Check back later for scheduled sessions"
                        />
                    )}
                </Card>

                {/* Overdue Tasks Card */}
                {overdueTasks.length > 0 && (
                    <Card
                        title="Overdue Tasks"
                        subtitle="Needs attention"
                        accent="danger"
                        className="overdue-card"
                        onClick={() => navigate('/student/tasks')}
                    >
                        <div className="overdue-list">
                            {overdueTasks.map((item) => (
                                <div key={item.id} className="overdue-item">
                                    <div className="overdue-info">
                                        <AlertCircle size={18} className="overdue-icon" />
                                        <div>
                                            <p className="overdue-title">{item.task?.title}</p>
                                            <p className="overdue-meta">
                                                {item.task?.class?.subject} • Due {new Date(item.task?.due_date).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                    <Badge status="Overdue" size="small" />
                                </div>
                            ))}
                        </div>
                    </Card>
                )}
            </div>
        </div>
    );
}

export default StudentDashboard;
