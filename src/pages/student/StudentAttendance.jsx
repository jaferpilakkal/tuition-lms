import { useState, useEffect } from 'react';
import { Card, Badge, ProgressBar, LoadingSpinner, EmptyState } from '../../components/common';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../services/supabase';
import { Calendar, CheckCircle, XCircle } from 'lucide-react';
import './StudentAttendance.css';

function StudentAttendance() {
    const { profile } = useAuth();
    const [attendance, setAttendance] = useState([]);
    const [stats, setStats] = useState({ total: 0, present: 0, percentage: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAttendance();
    }, [profile]);

    const fetchAttendance = async () => {
        if (!profile) return;

        try {
            setLoading(true);

            // Fetch attendance records for this student
            const { data, error } = await supabase
                .from('attendance_records')
                .select(`
          *,
          session:sessions (
            id,
            session_date,
            class:classes (
              class_name,
              subject
            )
          )
        `)
                .eq('student_id', profile.id)
                .order('session(session_date)', { ascending: false });

            if (error) throw error;

            setAttendance(data || []);

            // Calculate stats
            const total = data?.length || 0;
            const present = data?.filter(a => a.status === 'Present').length || 0;
            const percentage = total > 0 ? Math.round((present / total) * 100) : 0;

            setStats({ total, present, percentage });
        } catch (error) {
            console.error('Error fetching attendance:', error);
        } finally {
            setLoading(false);
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

    const getProgressColor = (percentage) => {
        if (percentage >= 90) return 'success';
        if (percentage >= 75) return 'warning';
        return 'danger';
    };

    if (loading) {
        return <LoadingSpinner fullPage text="Loading attendance..." />;
    }

    return (
        <div className="student-attendance">
            <div className="page-header">
                <h1 className="page-title">My Attendance</h1>
                <p className="page-subtitle">Track your class attendance</p>
            </div>

            {/* Stats Card */}
            <Card className="attendance-stats-card" accent="primary">
                <div className="stats-header">
                    <div className="stats-percentage">
                        <span className="percentage-number">{stats.percentage}%</span>
                        <span className="percentage-label">Attendance</span>
                    </div>
                    <div className="stats-detail">
                        <div className="stat-item">
                            <CheckCircle size={18} className="icon-success" />
                            <span>{stats.present} Present</span>
                        </div>
                        <div className="stat-item">
                            <XCircle size={18} className="icon-danger" />
                            <span>{stats.total - stats.present} Absent</span>
                        </div>
                    </div>
                </div>
                <ProgressBar
                    percentage={stats.percentage}
                    color={getProgressColor(stats.percentage)}
                    size="large"
                    showLabel={false}
                />
                <p className="stats-subtext">
                    {stats.present} of {stats.total} sessions attended
                </p>
            </Card>

            {/* Attendance History */}
            <div className="attendance-history">
                <h2 className="section-title">Attendance History</h2>

                {attendance.length === 0 ? (
                    <EmptyState
                        icon="sessions"
                        title="No attendance records"
                        description="Your attendance will appear here after classes"
                    />
                ) : (
                    <div className="attendance-list">
                        {attendance.map((record) => (
                            <div key={record.id} className="attendance-item">
                                <div className="attendance-info">
                                    <Calendar size={18} className="attendance-icon" />
                                    <div>
                                        <p className="attendance-date">
                                            {formatDate(record.session?.session_date)}
                                        </p>
                                        <p className="attendance-class">
                                            {record.session?.class?.subject} • {record.session?.class?.class_name}
                                        </p>
                                    </div>
                                </div>
                                <Badge status={record.status} size="small" />
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default StudentAttendance;
