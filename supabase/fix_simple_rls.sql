-- ============================================
-- SIMPLIFIED RLS POLICIES - Maximum Compatibility
-- Run this in Supabase SQL Editor
-- ============================================

-- ============================================
-- STEP 1: DROP ALL EXISTING POLICIES
-- ============================================

-- Profiles
DROP POLICY IF EXISTS "profiles_read" ON profiles;
DROP POLICY IF EXISTS "profiles_update_self" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_admin" ON profiles;
DROP POLICY IF EXISTS "profiles_delete_admin" ON profiles;
DROP POLICY IF EXISTS "profiles_select_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON profiles;

-- Classes
DROP POLICY IF EXISTS "classes_read" ON classes;
DROP POLICY IF EXISTS "classes_admin" ON classes;

-- Enrollments
DROP POLICY IF EXISTS "enrollments_read" ON class_enrollments;
DROP POLICY IF EXISTS "enrollments_admin" ON class_enrollments;

-- Sessions
DROP POLICY IF EXISTS "sessions_read" ON sessions;
DROP POLICY IF EXISTS "sessions_insert" ON sessions;
DROP POLICY IF EXISTS "sessions_update" ON sessions;
DROP POLICY IF EXISTS "sessions_delete" ON sessions;

-- Attendance
DROP POLICY IF EXISTS "attendance_read" ON attendance_records;
DROP POLICY IF EXISTS "attendance_manage" ON attendance_records;

-- Tasks
DROP POLICY IF EXISTS "tasks_read" ON tasks;
DROP POLICY IF EXISTS "tasks_manage" ON tasks;

-- Submissions
DROP POLICY IF EXISTS "submissions_read_own" ON task_submissions;
DROP POLICY IF EXISTS "submissions_read_staff" ON task_submissions;
DROP POLICY IF EXISTS "submissions_insert" ON task_submissions;
DROP POLICY IF EXISTS "submissions_update" ON task_submissions;
DROP POLICY IF EXISTS "submissions_delete" ON task_submissions;

-- ============================================
-- STEP 2: CREATE SIMPLE OPEN POLICIES
-- All authenticated users can read everything
-- Write permissions are more restricted
-- ============================================

-- ---------- PROFILES ----------
CREATE POLICY "profiles_select" ON profiles FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "profiles_update" ON profiles FOR UPDATE
  TO authenticated USING (true);

CREATE POLICY "profiles_insert" ON profiles FOR INSERT
  TO authenticated WITH CHECK (true);

CREATE POLICY "profiles_delete" ON profiles FOR DELETE
  TO authenticated USING (true);

-- ---------- CLASSES ----------
CREATE POLICY "classes_select" ON classes FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "classes_all" ON classes FOR ALL
  TO authenticated USING (true);

-- ---------- CLASS ENROLLMENTS ----------
CREATE POLICY "enrollments_select" ON class_enrollments FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "enrollments_all" ON class_enrollments FOR ALL
  TO authenticated USING (true);

-- ---------- SESSIONS ----------
CREATE POLICY "sessions_select" ON sessions FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "sessions_all" ON sessions FOR ALL
  TO authenticated USING (true);

-- ---------- ATTENDANCE RECORDS ----------
CREATE POLICY "attendance_select" ON attendance_records FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "attendance_all" ON attendance_records FOR ALL
  TO authenticated USING (true);

-- ---------- TASKS ----------
CREATE POLICY "tasks_select" ON tasks FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "tasks_all" ON tasks FOR ALL
  TO authenticated USING (true);

-- ---------- TASK SUBMISSIONS ----------
CREATE POLICY "submissions_select" ON task_submissions FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "submissions_all" ON task_submissions FOR ALL
  TO authenticated USING (true);

-- ============================================
-- VERIFY ALL POLICIES
-- ============================================
SELECT tablename, policyname, cmd FROM pg_policies 
WHERE schemaname = 'public' 
ORDER BY tablename, policyname;
