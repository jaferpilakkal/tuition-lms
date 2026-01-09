import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Badge, Button, LoadingSpinner, EmptyState } from '../../components/common';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../services/supabase';
import { ArrowLeft, CheckCircle, XCircle, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import './SessionAttendance.css';

function SessionAttendance() {
    const { sessionId } = useParams();
    const { profile } = useAuth();
    const navigate = useNavigate();

    const [session, setSession] = useState(null);
    const [students, setStudents] = useState([]);
    const [attendance, setAttendance] = useState({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);

    useEffect(() => {
        fetchData();
    }, [sessionId]);

    const fetchData = async () => {
        try {
            setLoading(true);

            // Fetch session details
            const { data: sessionData, error: sessionError } = await supabase
                .from('sessions')
                .select(`
          *,
          class:classes (
            id,
            class_name,
            subject
          )
        `)
                .eq('id', sessionId)
                .single();

            if (sessionError) throw sessionError;
            setSession(sessionData);

            // Fetch enrolled students - use explicit FK reference
            const { data: enrollments, error: enrollError } = await supabase
                .from('class_enrollments')
                .select(`
          student:profiles!class_enrollments_student_id_fkey (
            id,
            name,
            email
          )
        `)
                .eq('class_id', sessionData.class.id)
                .eq('is_active', true);

            if (enrollError) throw enrollError;
            setStudents(enrollments?.map(e => e.student) || []);

            // Fetch existing attendance
            const { data: attendanceData, error: attendanceError } = await supabase
                .from('attendance_records')
                .select('*')
                .eq('session_id', sessionId);

            if (!attendanceError) {
                const attendanceMap = {};
                attendanceData?.forEach(record => {
                    attendanceMap[record.student_id] = record.status;
                });
                setAttendance(attendanceMap);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
            toast.error('Failed to load attendance');
            navigate('/teacher/sessions');
        } finally {
            setLoading(false);
        }
    };

    const toggleAttendance = (studentId) => {
        setAttendance(prev => {
            const currentStatus = prev[studentId];
            let newStatus;

            if (!currentStatus) {
                newStatus = 'Present';
            } else if (currentStatus === 'Present') {
                newStatus = 'Absent';
            } else {
                newStatus = 'Present';
            }

            return { ...prev, [studentId]: newStatus };
        });
        setHasChanges(true);
    };

    const markAllPresent = () => {
        const newAttendance = {};
        students.forEach(s => {
            newAttendance[s.id] = 'Present';
        });
        setAttendance(newAttendance);
        setHasChanges(true);
    };

    const markAllAbsent = () => {
        const newAttendance = {};
        students.forEach(s => {
            newAttendance[s.id] = 'Absent';
        });
        setAttendance(newAttendance);
        setHasChanges(true);
    };

    const saveAttendance = async () => {
        try {
            setSaving(true);

            // Prepare records
            const records = students.map(student => ({
                session_id: sessionId,
                student_id: student.id,
                status: attendance[student.id] || 'Absent',
                marked_by: profile.id,
                marked_at: new Date().toISOString()
            }));

            // Upsert attendance records
            const { error } = await supabase
                .from('attendance_records')
                .upsert(records, {
                    onConflict: 'session_id,student_id',
                    ignoreDuplicates: false
                });

            if (error) throw error;

            // Mark session as completed
            await supabase
                .from('sessions')
                .update({ is_completed: true })
                .eq('id', sessionId);

            toast.success('Attendance saved successfully!');
            setHasChanges(false);
            navigate('/teacher/sessions');
        } catch (error) {
            console.error('Error saving attendance:', error);
            toast.error('Failed to save attendance');
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

    const presentCount = Object.values(attendance).filter(s => s === 'Present').length;
    const absentCount = Object.values(attendance).filter(s => s === 'Absent').length;

    if (loading) {
        return <LoadingSpinner fullPage text="Loading attendance..." />;
    }

    return (
        <div className="session-attendance">
            <div className="page-header-with-back">
                <button className="back-button" onClick={() => navigate('/teacher/sessions')}>
                    <ArrowLeft size={20} />
                    <span>Back to Sessions</span>
                </button>
            </div>

            {/* Session Info */}
            <Card className="session-info-card">
                <div className="session-header">
                    <div>
                        <h1 className="session-title">{session?.class?.subject}</h1>
                        <p className="session-class-name">{session?.class?.class_name}</p>
                        <p className="session-date">{formatDate(session?.session_date)}</p>
                    </div>
                    <Badge
                        status={session?.is_completed ? 'Completed' : 'Pending'}
                    />
                </div>
            </Card>

            {/* Quick Actions */}
            <div className="quick-actions">
                <Button variant="ghost" size="small" onClick={markAllPresent}>
                    <CheckCircle size={16} />
                    Mark All Present
                </Button>
                <Button variant="ghost" size="small" onClick={markAllAbsent}>
                    <XCircle size={16} />
                    Mark All Absent
                </Button>
            </div>

            {/* Stats */}
            <div className="attendance-stats">
                <div className="stat-item stat-present">
                    <span className="stat-number">{presentCount}</span>
                    <span className="stat-label">Present</span>
                </div>
                <div className="stat-item stat-absent">
                    <span className="stat-number">{absentCount}</span>
                    <span className="stat-label">Absent</span>
                </div>
                <div className="stat-item stat-total">
                    <span className="stat-number">{students.length}</span>
                    <span className="stat-label">Total</span>
                </div>
            </div>

            {/* Student List */}
            {students.length === 0 ? (
                <EmptyState
                    icon="users"
                    title="No students enrolled"
                    description="This class has no enrolled students"
                />
            ) : (
                <div className="student-list">
                    {students.map((student) => (
                        <div
                            key={student.id}
                            className={`student-item ${attendance[student.id] || 'unmarked'}`}
                            onClick={() => toggleAttendance(student.id)}
                        >
                            <div className="student-info">
                                <p className="student-name">{student.name}</p>
                                <p className="student-email">{student.email}</p>
                            </div>
                            <div className="attendance-toggle">
                                {attendance[student.id] === 'Present' && (
                                    <span className="status-icon present">
                                        <CheckCircle size={24} />
                                    </span>
                                )}
                                {attendance[student.id] === 'Absent' && (
                                    <span className="status-icon absent">
                                        <XCircle size={24} />
                                    </span>
                                )}
                                {!attendance[student.id] && (
                                    <span className="status-icon unmarked">Tap to mark</span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Save Button */}
            {students.length > 0 && (
                <div className="save-container">
                    <Button
                        variant="primary"
                        size="large"
                        fullWidth
                        onClick={saveAttendance}
                        loading={saving}
                        icon={<Save size={18} />}
                    >
                        Save Attendance
                    </Button>
                </div>
            )}
        </div>
    );
}

export default SessionAttendance;
