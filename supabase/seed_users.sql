-- ============================================
-- SEED DATA: Test Users
-- Run this AFTER schema.sql and rls_policies.sql
-- ============================================

-- IMPORTANT: First, create users in Supabase Auth Dashboard:
-- 1. Go to Authentication > Users > Add user
-- 2. Create these users with email/password:
--    - admin@tuitionhub.com / Admin123!
--    - teacher@tuitionhub.com / Teacher123!
--    - student@tuitionhub.com / Student123!
-- 3. Then run this SQL to set their roles

-- Update the profiles with correct roles
-- (The trigger creates profiles with 'student' role by default)

-- Get the user IDs from auth.users and update profiles
DO $$
DECLARE
  admin_id UUID;
  teacher_id UUID;
  student_id UUID;
BEGIN
  -- Get admin user ID
  SELECT id INTO admin_id FROM auth.users WHERE email = 'admin@tuitionhub.com';
  IF admin_id IS NOT NULL THEN
    UPDATE profiles SET role = 'admin', name = 'Admin User' WHERE id = admin_id;
    RAISE NOTICE 'Admin user updated: %', admin_id;
  END IF;

  -- Get teacher user ID
  SELECT id INTO teacher_id FROM auth.users WHERE email = 'teacher@tuitionhub.com';
  IF teacher_id IS NOT NULL THEN
    UPDATE profiles SET role = 'teacher', name = 'John Teacher' WHERE id = teacher_id;
    RAISE NOTICE 'Teacher user updated: %', teacher_id;
  END IF;

  -- Get student user ID
  SELECT id INTO student_id FROM auth.users WHERE email = 'student@tuitionhub.com';
  IF student_id IS NOT NULL THEN
    UPDATE profiles SET role = 'student', name = 'Alex Student' WHERE id = student_id;
    RAISE NOTICE 'Student user updated: %', student_id;
  END IF;
END $$;

-- Verify the profiles
SELECT id, name, email, role, is_active FROM profiles;
