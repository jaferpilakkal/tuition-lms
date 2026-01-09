-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Run this AFTER schema.sql
-- ============================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_submissions ENABLE ROW LEVEL SECURITY;

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Get current user's role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$ language 'sql' SECURITY DEFINER;

-- Check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'
  );
$$ language 'sql' SECURITY DEFINER;

-- Check if user is teacher
CREATE OR REPLACE FUNCTION is_teacher()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'teacher'
  );
$$ language 'sql' SECURITY DEFINER;

-- Check if user is student
CREATE OR REPLACE FUNCTION is_student()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'student'
  );
$$ language 'sql' SECURITY DEFINER;

-- ============================================
-- PROFILES POLICIES
-- ============================================

-- Everyone can read profiles (needed for display names)
CREATE POLICY "Profiles are viewable by authenticated users"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

-- Only admins can insert/update/delete profiles
CREATE POLICY "Admins can manage profiles"
  ON profiles FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Users can update their own profile (name only)
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- ============================================
-- CLASSES POLICIES
-- ============================================

-- All authenticated users can view classes
CREATE POLICY "Classes are viewable by authenticated users"
  ON classes FOR SELECT
  TO authenticated
  USING (true);

-- Only admins can manage classes
CREATE POLICY "Admins can manage classes"
  ON classes FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- ============================================
-- CLASS ENROLLMENTS POLICIES
-- ============================================

-- All authenticated users can view enrollments
CREATE POLICY "Enrollments are viewable by authenticated users"
  ON class_enrollments FOR SELECT
  TO authenticated
  USING (true);

-- Only admins can manage enrollments
CREATE POLICY "Admins can manage enrollments"
  ON class_enrollments FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- ============================================
-- SESSIONS POLICIES
-- ============================================

-- All authenticated users can view sessions
CREATE POLICY "Sessions are viewable by authenticated users"
  ON sessions FOR SELECT
  TO authenticated
  USING (true);

-- Teachers and admins can create sessions
CREATE POLICY "Teachers and admins can create sessions"
  ON sessions FOR INSERT
  TO authenticated
  WITH CHECK (is_admin() OR is_teacher());

-- Teachers and admins can update sessions
CREATE POLICY "Teachers and admins can update sessions"
  ON sessions FOR UPDATE
  TO authenticated
  USING (is_admin() OR is_teacher())
  WITH CHECK (is_admin() OR is_teacher());

-- Only admins can delete sessions
CREATE POLICY "Admins can delete sessions"
  ON sessions FOR DELETE
  TO authenticated
  USING (is_admin());

-- ============================================
-- ATTENDANCE RECORDS POLICIES
-- ============================================

-- Students can view their own attendance, teachers/admins can view all
CREATE POLICY "View attendance records"
  ON attendance_records FOR SELECT
  TO authenticated
  USING (
    student_id = auth.uid() 
    OR is_admin() 
    OR is_teacher()
  );

-- Teachers and admins can manage attendance
CREATE POLICY "Teachers and admins can manage attendance"
  ON attendance_records FOR ALL
  TO authenticated
  USING (is_admin() OR is_teacher())
  WITH CHECK (is_admin() OR is_teacher());

-- ============================================
-- TASKS POLICIES
-- ============================================

-- All authenticated users can view tasks
CREATE POLICY "Tasks are viewable by authenticated users"
  ON tasks FOR SELECT
  TO authenticated
  USING (true);

-- Teachers and admins can manage tasks
CREATE POLICY "Teachers and admins can manage tasks"
  ON tasks FOR ALL
  TO authenticated
  USING (is_admin() OR is_teacher())
  WITH CHECK (is_admin() OR is_teacher());

-- ============================================
-- TASK SUBMISSIONS POLICIES
-- ============================================

-- Students can view their own submissions, teachers/admins can view all
CREATE POLICY "View task submissions"
  ON task_submissions FOR SELECT
  TO authenticated
  USING (
    student_id = auth.uid() 
    OR is_admin() 
    OR is_teacher()
  );

-- Students can insert their own submissions
CREATE POLICY "Students can create submissions"
  ON task_submissions FOR INSERT
  TO authenticated
  WITH CHECK (student_id = auth.uid());

-- Students can update their own submissions, teachers/admins can update any
CREATE POLICY "Update task submissions"
  ON task_submissions FOR UPDATE
  TO authenticated
  USING (
    student_id = auth.uid() 
    OR is_admin() 
    OR is_teacher()
  )
  WITH CHECK (
    student_id = auth.uid() 
    OR is_admin() 
    OR is_teacher()
  );

-- Only teachers and admins can delete submissions
CREATE POLICY "Teachers and admins can delete submissions"
  ON task_submissions FOR DELETE
  TO authenticated
  USING (is_admin() OR is_teacher());
