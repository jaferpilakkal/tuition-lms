import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Badge, ProgressBar, LoadingSpinner, EmptyState } from '../../components/common';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../services/supabase';
import { Users, BookOpen, CheckCircle, AlertTriangle } from 'lucide-react';
import './AdminDashboard.css';

function AdminDashboard() {
    const { profile } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalStudents: 0,
        totalTeachers: 0,
        totalClasses: 0,
        attendanceRate: 0,
        taskCompletionRate: 0
    });
    const [atRiskStudents, setAtRiskStudents] = useState([]);
    const [recentActivity, setRecentActivity] = useState([]);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            await Promise.all([
                fetchStats(),
                fetchAtRiskStudents(),
            ]);
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        // Get user counts
        const { data: profiles } = await supabase
            .from('profiles')
            .select('role')
            .eq('is_active', true);

        const students = profiles?.filter(p => p.role === 'student').length || 0;
        const teachers = profiles?.filter(p => p.role === 'teacher').length || 0;

        // Get class count
        const { data: classes } = await supabase
            .from('classes')
            .select('id')
            .eq('is_active', true);

        // Get attendance rate
        const { data: attendance } = await supabase
            .from('attendance_records')
            .select('status');

        const totalAtt = attendance?.length || 0;
        const presentAtt = attendance?.filter(a => a.status === 'Present').length || 0;
        const attendanceRate = totalAtt > 0 ? Math.round((presentAtt / totalAtt) * 100) : 0;

        // Get task completion rate
        const { data: submissions } = await supabase
            .from('task_submissions')
            .select('status');

        const totalTasks = submissions?.length || 0;
        const completedTasks = submissions?.filter(s => s.status === 'Completed').length || 0;
        const taskCompletionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

        setStats({
            totalStudents: students,
            totalTeachers: teachers,
            totalClasses: classes?.length || 0,
            attendanceRate,
            taskCompletionRate
        });
    };

    const fetchAtRiskStudents = async () => {
        // Students with low attendance or many overdue tasks
        const { data: students } = await supabase
            .from('profiles')
            .select('id, name, email')
            .eq('role', 'student')
            .eq('is_active', true);

        if (!students) return;

        const atRisk = [];
        const today = new Date().toISOString().split('T')[0];

        for (const student of students.slice(0, 20)) { // Limit to first 20 for performance
            // Check attendance
            const { data: attendance } = await supabase
                .from('attendance_records')
                .select('status')
                .eq('student_id', student.id);

            const total = attendance?.length || 0;
            const present = attendance?.filter(a => a.status === 'Present').length || 0;
            const rate = total > 0 ? (present / total) * 100 : 100;

            // Check overdue tasks
            const { data: overdue } = await supabase
                .from('task_submissions')
                .select(`
          id,
          status,
          task:tasks (due_date)
        `)
                .eq('student_id', student.id)
                .neq('status', 'Completed');

            const overdueCount = overdue?.filter(t => t.task?.due_date < today).length || 0;

            if (rate < 75 || overdueCount > 0) {
                atRisk.push({
                    ...student,
                    attendanceRate: Math.round(rate),
                    overdueCount
                });
            }
        }

        setAtRiskStudents(atRisk.slice(0, 5));
    };

    if (loading) {
        return <LoadingSpinner fullPage text="Loading dashboard..." />;
    }

    return (
        <div className="admin-dashboard">
            <div className="page-header">
                <h1 className="page-title">Admin Dashboard</h1>
                <p className="page-subtitle">Overview of your tuition center</p>
            </div>

            {/* Stats Grid */}
            <div className="stats-grid">
                <Card className="stat-card" onClick={() => navigate('/admin/users')}>
                    <div className="stat-icon students">
                        <Users size={24} />
                    </div>
                    <div className="stat-content">
                        <span className="stat-number">{stats.totalStudents}</span>
                        <span className="stat-label">Students</span>
                    </div>
                </Card>

                <Card className="stat-card" onClick={() => navigate('/admin/users')}>
                    <div className="stat-icon teachers">
                        <Users size={24} />
                    </div>
                    <div className="stat-content">
                        <span className="stat-number">{stats.totalTeachers}</span>
                        <span className="stat-label">Teachers</span>
                    </div>
                </Card>

                <Card className="stat-card" onClick={() => navigate('/admin/classes')}>
                    <div className="stat-icon classes">
                        <BookOpen size={24} />
                    </div>
                    <div className="stat-content">
                        <span className="stat-number">{stats.totalClasses}</span>
                        <span className="stat-label">Classes</span>
                    </div>
                </Card>
            </div>

            {/* Progress Cards */}
            <div className="dashboard-grid">
                <Card
                    title="Overall Attendance"
                    subtitle="All students"
                    accent="primary"
                >
                    <div className="progress-stat">
                        <span className="progress-number">{stats.attendanceRate}%</span>
                    </div>
                    <ProgressBar
                        percentage={stats.attendanceRate}
                        color={stats.attendanceRate >= 80 ? 'success' : stats.attendanceRate >= 60 ? 'warning' : 'danger'}
                        size="large"
                    />
                </Card>

                <Card
                    title="Task Completion"
                    subtitle="All assignments"
                    accent="success"
                >
                    <div className="progress-stat">
                        <span className="progress-number">{stats.taskCompletionRate}%</span>
                    </div>
                    <ProgressBar
                        percentage={stats.taskCompletionRate}
                        color={stats.taskCompletionRate >= 70 ? 'success' : stats.taskCompletionRate >= 40 ? 'warning' : 'danger'}
                        size="large"
                    />
                </Card>
            </div>

            {/* At Risk Students */}
            <Card
                title="Students at Risk"
                subtitle="Low attendance or overdue tasks"
                accent="warning"
                className="at-risk-card"
            >
                {atRiskStudents.length === 0 ? (
                    <div className="all-good">
                        <CheckCircle size={32} className="success-icon" />
                        <p>All students are on track!</p>
                    </div>
                ) : (
                    <div className="at-risk-list">
                        {atRiskStudents.map((student) => (
                            <div key={student.id} className="at-risk-item">
                                <div className="at-risk-info">
                                    <p className="at-risk-name">{student.name}</p>
                                    <div className="at-risk-badges">
                                        {student.attendanceRate < 75 && (
                                            <Badge status={`${student.attendanceRate}% attendance`} size="small" variant="danger" />
                                        )}
                                        {student.overdueCount > 0 && (
                                            <Badge status={`${student.overdueCount} overdue`} size="small" variant="warning" />
                                        )}
                                    </div>
                                </div>
                                <AlertTriangle size={18} className="warning-icon" />
                            </div>
                        ))}
                    </div>
                )}
            </Card>
        </div>
    );
}

export default AdminDashboard;
