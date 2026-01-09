-- ============================================
-- COMPLETE RLS FIX - Run this in Supabase SQL Editor
-- This replaces all problematic policies
-- ============================================

-- ============================================
-- STEP 1: DROP ALL EXISTING POLICIES
-- ============================================

-- Profiles
DROP POLICY IF EXISTS "profiles_select_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON profiles;
DROP POLICY IF EXISTS "Profiles are viewable by authenticated users" ON profiles;
DROP POLICY IF EXISTS "Admins can manage profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Teachers can view profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can insert profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON profiles;
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON profiles;
DROP POLICY IF EXISTS "Allow authenticated select" ON profiles;
DROP POLICY IF EXISTS "Allow self update" ON profiles;

-- Classes
DROP POLICY IF EXISTS "Classes are viewable by authenticated users" ON classes;
DROP POLICY IF EXISTS "Admins can manage classes" ON classes;

-- Class Enrollments
DROP POLICY IF EXISTS "Enrollments are viewable by authenticated users" ON class_enrollments;
DROP POLICY IF EXISTS "Admins can manage enrollments" ON class_enrollments;

-- Sessions
DROP POLICY IF EXISTS "Sessions are viewable by authenticated users" ON sessions;
DROP POLICY IF EXISTS "Teachers and admins can create sessions" ON sessions;
DROP POLICY IF EXISTS "Teachers and admins can update sessions" ON sessions;
DROP POLICY IF EXISTS "Admins can delete sessions" ON sessions;

-- Attendance Records
DROP POLICY IF EXISTS "View attendance records" ON attendance_records;
DROP POLICY IF EXISTS "Teachers and admins can manage attendance" ON attendance_records;

-- Tasks
DROP POLICY IF EXISTS "Tasks are viewable by authenticated users" ON tasks;
DROP POLICY IF EXISTS "Teachers and admins can manage tasks" ON tasks;

-- Task Submissions
DROP POLICY IF EXISTS "View task submissions" ON task_submissions;
DROP POLICY IF EXISTS "Students can create submissions" ON task_submissions;
DROP POLICY IF EXISTS "Update task submissions" ON task_submissions;
DROP POLICY IF EXISTS "Teachers and admins can delete submissions" ON task_submissions;

-- ============================================
-- STEP 2: CREATE SIMPLE POLICIES
-- Using direct role checks, not helper functions
-- ============================================

-- ---------- PROFILES ----------
CREATE POLICY "profiles_read" ON profiles FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "profiles_update_self" ON profiles FOR UPDATE
  TO authenticated USING (id = auth.uid());

CREATE POLICY "profiles_insert_admin" ON profiles FOR INSERT
  TO authenticated WITH CHECK (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "profiles_delete_admin" ON profiles FOR DELETE
  TO authenticated USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

-- ---------- CLASSES ----------
CREATE POLICY "classes_read" ON classes FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "classes_admin" ON classes FOR ALL
  TO authenticated USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

-- ---------- CLASS ENROLLMENTS ----------
CREATE POLICY "enrollments_read" ON class_enrollments FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "enrollments_admin" ON class_enrollments FOR ALL
  TO authenticated USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

-- ---------- SESSIONS ----------
CREATE POLICY "sessions_read" ON sessions FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "sessions_insert" ON sessions FOR INSERT
  TO authenticated WITH CHECK (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'teacher')
  );

CREATE POLICY "sessions_update" ON sessions FOR UPDATE
  TO authenticated USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'teacher')
  );

CREATE POLICY "sessions_delete" ON sessions FOR DELETE
  TO authenticated USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

-- ---------- ATTENDANCE RECORDS ----------
CREATE POLICY "attendance_read" ON attendance_records FOR SELECT
  TO authenticated USING (
    student_id = auth.uid()
    OR (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'teacher')
  );

CREATE POLICY "attendance_manage" ON attendance_records FOR ALL
  TO authenticated USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'teacher')
  );

-- ---------- TASKS ----------
CREATE POLICY "tasks_read" ON tasks FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "tasks_manage" ON tasks FOR ALL
  TO authenticated USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'teacher')
  );

-- ---------- TASK SUBMISSIONS ----------
-- Students can see their own submissions
CREATE POLICY "submissions_read_own" ON task_submissions FOR SELECT
  TO authenticated USING (student_id = auth.uid());

-- Teachers and admins can see all submissions
CREATE POLICY "submissions_read_staff" ON task_submissions FOR SELECT
  TO authenticated USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'teacher')
  );

-- Teachers/admins can insert submissions (when creating tasks)
CREATE POLICY "submissions_insert" ON task_submissions FOR INSERT
  TO authenticated WITH CHECK (
    student_id = auth.uid()
    OR (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'teacher')
  );

-- Students can update their own, staff can update all
CREATE POLICY "submissions_update" ON task_submissions FOR UPDATE
  TO authenticated USING (
    student_id = auth.uid()
    OR (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'teacher')
  );

-- Only staff can delete
CREATE POLICY "submissions_delete" ON task_submissions FOR DELETE
  TO authenticated USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'teacher')
  );

-- ============================================
-- VERIFY
-- ============================================
SELECT tablename, policyname FROM pg_policies 
WHERE schemaname = 'public' 
ORDER BY tablename, policyname;
