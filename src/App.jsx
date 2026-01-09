import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import AppLayout from './components/layout/AppLayout';
import Login from './pages/auth/Login';
import StudentDashboard from './pages/student/StudentDashboard';
import StudentTasks from './pages/student/StudentTasks';
import TaskSubmission from './pages/student/TaskSubmission';
import StudentAttendance from './pages/student/StudentAttendance';
import TeacherDashboard from './pages/teacher/TeacherDashboard';
import TeacherSessions from './pages/teacher/TeacherSessions';
import SessionAttendance from './pages/teacher/SessionAttendance';
import TeacherTasks from './pages/teacher/TeacherTasks';
import TaskReview from './pages/teacher/TaskReview';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminClasses from './pages/admin/AdminClasses';
import ClassStudents from './pages/admin/ClassStudents';
import AdminUsers from './pages/admin/AdminUsers';
import { LoadingSpinner } from './components/common';

// Root redirect based on user role
function RootRedirect() {
  const { isAuthenticated, profile, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner fullPage text="Loading..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Redirect to role-specific dashboard
  switch (profile?.role) {
    case 'admin':
      return <Navigate to="/admin" replace />;
    case 'teacher':
      return <Navigate to="/teacher" replace />;
    case 'student':
      return <Navigate to="/student" replace />;
    default:
      return <Navigate to="/login" replace />;
  }
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#333',
              color: '#fff',
            },
            success: {
              style: {
                background: '#16a34a',
              },
            },
            error: {
              style: {
                background: '#dc2626',
              },
            },
          }}
        />

        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />

          {/* Root redirect */}
          <Route path="/" element={<RootRedirect />} />

          {/* Student routes */}
          <Route
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/student" element={<StudentDashboard />} />
            <Route path="/student/tasks" element={<StudentTasks />} />
            <Route path="/student/tasks/:submissionId" element={<TaskSubmission />} />
            <Route path="/student/attendance" element={<StudentAttendance />} />
          </Route>


          {/* Teacher routes */}
          <Route
            element={
              <ProtectedRoute allowedRoles={['teacher']}>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/teacher" element={<TeacherDashboard />} />
            <Route path="/teacher/sessions" element={<TeacherSessions />} />
            <Route path="/teacher/sessions/:sessionId/attendance" element={<SessionAttendance />} />
            <Route path="/teacher/tasks" element={<TeacherTasks />} />
            <Route path="/teacher/tasks/:taskId" element={<TaskReview />} />
          </Route>

          {/* Admin routes */}
          <Route
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/classes" element={<AdminClasses />} />
            <Route path="/admin/classes/:classId/students" element={<ClassStudents />} />
            <Route path="/admin/users" element={<AdminUsers />} />
          </Route>

          {/* Profile route (all authenticated users) */}
          <Route
            element={
              <ProtectedRoute allowedRoles={['admin', 'teacher', 'student']}>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/profile" element={<div>Profile - Coming Soon</div>} />
          </Route>

          {/* Catch all - redirect to root */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
