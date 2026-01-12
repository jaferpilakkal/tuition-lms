import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Badge, Button, LoadingSpinner, EmptyState, ConfirmModal } from '../../components/common';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../services/supabase';
import { ArrowLeft, Plus, UserMinus, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import './ClassStudents.css';

function ClassStudents() {
    const { classId } = useParams();
    const { profile } = useAuth();
    const navigate = useNavigate();

    const [classInfo, setClassInfo] = useState(null);
    const [enrolledStudents, setEnrolledStudents] = useState([]);
    const [allStudents, setAllStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [adding, setAdding] = useState(false);
    const [studentToRemove, setStudentToRemove] = useState(null);

    useEffect(() => {
        fetchData();
    }, [classId]);

    const fetchData = async () => {
        try {
            setLoading(true);
            await Promise.all([fetchClassInfo(), fetchEnrolledStudents(), fetchAllStudents()]);
        } catch (error) {
            console.error('Error fetching data:', error);
            navigate('/admin/classes');
        } finally {
            setLoading(false);
        }
    };

    const fetchClassInfo = async () => {
        const { data, error } = await supabase
            .from('classes')
            .select(`
        *,
        teacher:profiles (name)
      `)
            .eq('id', classId)
            .single();

        if (error) throw error;
        setClassInfo(data);
    };

    const fetchEnrolledStudents = async () => {
        const { data, error } = await supabase
            .from('class_enrollments')
            .select(`
        id,
        enrolled_on,
        student:profiles!class_enrollments_student_id_fkey (
          id,
          name,
          email
        )
      `)
            .eq('class_id', classId)
            .eq('is_active', true);

        if (!error) setEnrolledStudents(data || []);
    };

    const fetchAllStudents = async () => {
        const { data, error } = await supabase
            .from('profiles')
            .select('id, name, email')
            .eq('role', 'student')
            .eq('is_active', true);

        if (!error) setAllStudents(data || []);
    };

    const getAvailableStudents = () => {
        const enrolledIds = enrolledStudents.map(e => e.student?.id);
        return allStudents.filter(s =>
            !enrolledIds.includes(s.id) &&
            (s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                s.email.toLowerCase().includes(searchTerm.toLowerCase()))
        );
    };

    const addStudent = async (studentId) => {
        try {
            setAdding(true);

            const { error } = await supabase
                .from('class_enrollments')
                .insert({
                    class_id: classId,
                    student_id: studentId
                });

            if (error) throw error;

            toast.success('Student enrolled successfully!');
            fetchEnrolledStudents();
        } catch (error) {
            console.error('Error enrolling student:', error);
            toast.error('Failed to enroll student');
        } finally {
            setAdding(false);
        }
    };

    const removeStudent = async () => {
        if (!studentToRemove) return;

        try {
            const { error } = await supabase
                .from('class_enrollments')
                .update({ is_active: false })
                .eq('id', studentToRemove);

            if (error) throw error;

            toast.success('Student removed');
            fetchEnrolledStudents();
        } catch (error) {
            toast.error('Failed to remove student');
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const availableStudents = getAvailableStudents();

    if (loading) {
        return <LoadingSpinner fullPage text="Loading students..." />;
    }

    return (
        <div className="class-students">
            <div className="page-header-with-back">
                <button className="back-button" onClick={() => navigate('/admin/classes')}>
                    <ArrowLeft size={20} />
                    <span>Back to Classes</span>
                </button>
            </div>

            {/* Class Info */}
            <Card className="class-info-card">
                <div className="class-header">
                    <div>
                        <h1 className="class-title">{classInfo?.subject}</h1>
                        <p className="class-name">{classInfo?.class_name}</p>
                        {classInfo?.teacher && (
                            <p className="class-teacher">Teacher: {classInfo.teacher.name}</p>
                        )}
                    </div>
                    <Button
                        variant="primary"
                        onClick={() => setShowAddModal(true)}
                        icon={<Plus size={18} />}
                    >
                        Add Student
                    </Button>
                </div>
            </Card>

            {/* Enrolled Students */}
            <h2 className="section-title">
                Enrolled Students ({enrolledStudents.length})
            </h2>

            {enrolledStudents.length === 0 ? (
                <EmptyState
                    icon="users"
                    title="No students enrolled"
                    description="Add students to this class"
                />
            ) : (
                <div className="student-list">
                    {enrolledStudents.map((enrollment) => (
                        <Card key={enrollment.id} className="student-card">
                            <div className="student-content">
                                <div className="student-info">
                                    <p className="student-name">{enrollment.student?.name}</p>
                                    <p className="student-email">{enrollment.student?.email}</p>
                                    <p className="enrolled-date">
                                        Enrolled {formatDate(enrollment.enrolled_on)}
                                    </p>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="small"
                                    onClick={() => setStudentToRemove(enrollment.id)}
                                >
                                    <UserMinus size={16} />
                                </Button>
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            {/* Add Student Modal */}
            {showAddModal && (
                <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <h2 className="modal-title">Add Students</h2>

                        <div className="search-box">
                            <Search size={18} />
                            <input
                                type="text"
                                placeholder="Search students..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        {availableStudents.length === 0 ? (
                            <p className="no-students">No students available to add</p>
                        ) : (
                            <div className="available-list">
                                {availableStudents.map((student) => (
                                    <div key={student.id} className="available-item">
                                        <div className="available-info">
                                            <p className="available-name">{student.name}</p>
                                            <p className="available-email">{student.email}</p>
                                        </div>
                                        <Button
                                            variant="primary"
                                            size="small"
                                            onClick={() => addStudent(student.id)}
                                            loading={adding}
                                        >
                                            Add
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="modal-actions">
                            <Button variant="ghost" onClick={() => setShowAddModal(false)}>
                                Close
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Remove Student Confirmation Modal */}
            <ConfirmModal
                isOpen={!!studentToRemove}
                onClose={() => setStudentToRemove(null)}
                onConfirm={removeStudent}
                title="Remove Student"
                message="Are you sure you want to remove this student from the class?"
                confirmText="Remove"
                variant="danger"
            />
        </div>
    );
}

export default ClassStudents;
