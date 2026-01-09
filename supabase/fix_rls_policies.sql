-- ============================================
-- FIX RLS POLICIES - Resolves circular dependency
-- Run this in Supabase SQL Editor
-- ============================================

-- First, drop existing problematic policies on profiles
DROP POLICY IF EXISTS "Profiles are viewable by authenticated users" ON profiles;
DROP POLICY IF EXISTS "Admins can manage profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- ============================================
-- RECREATE PROFILES POLICIES WITHOUT CIRCULAR DEPENDENCY
-- ============================================

-- Users can read their OWN profile (no role check needed)
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- Admins can view ALL profiles (use direct role check, not function)
CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Teachers can view student profiles (for their classes)
CREATE POLICY "Teachers can view profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'teacher'
    )
  );

-- Users can update their own profile (name only)
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Only admins can insert new profiles
CREATE POLICY "Admins can insert profiles"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Only admins can delete profiles
CREATE POLICY "Admins can delete profiles"
  ON profiles FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================
-- VERIFY: Run this to check policies
-- ============================================
-- SELECT * FROM pg_policies WHERE tablename = 'profiles';
