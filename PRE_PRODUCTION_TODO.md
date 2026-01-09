# Pre-Production Checklist

Items to address before going to production. None are blocking for MVP deployment.

---

## 1. Remove Debug Console Logs

**Location:** `src/context/AuthContext.jsx`

**Issue:** The AuthContext contains multiple `console.log` statements used during development for debugging authentication flow. These should be removed in production to:
- Keep browser console clean for users
- Avoid exposing internal auth state information
- Slightly improve performance

**Lines to remove or comment out:**
```javascript
// Line 13: console.log('[Auth] Fetching profile for user:', userId);
// Line 22: console.log('[Auth] Profile query complete. Data:', data, 'Error:', error);
// Line 29: console.log('[Auth] Profile fetched successfully:', data);
// Line 42: console.log('[Auth] Initializing auth...');
// Line 45: console.log('[Auth] Session check complete:', session ? 'exists' : 'none');
// Line 58: console.log('[Auth] Setting loading to false');
// Line 69: console.log('[Auth] Auth state changed:', event);
// Line 91: console.log('[Auth] Login attempt for:', email);
// Line 95: console.log('[Auth] Calling Supabase signInWithPassword...');
// Line 106: console.log('[Auth] Supabase auth successful, user:', data.user?.id);
// Line 110: console.log('[Auth] Now fetching profile...');
// Line 113: console.log('[Auth] Profile result:', userProfile);
// Line 116: console.log('[Auth] Profile not found!');
// Line 121: console.log('[Auth] User is deactivated');
// Line 126: console.log('[Auth] Login complete, role:', userProfile.role);
// Line 140: console.log('[Auth] Logging out...');
// Line 147: console.log('[Auth] Logged out successfully');
```

**Fix:** Either:
- Remove all console.log lines
- Or replace with a proper logging library (e.g., `loglevel`) that can be disabled in production

---

## 2. Add Unit/Integration Tests

**Issue:** No automated tests exist. While acceptable for MVP, tests should be added before scaling.

**Recommended Testing Stack:**
- **Vitest** - Fast unit testing (works great with Vite)
- **React Testing Library** - Component testing
- **MSW (Mock Service Worker)** - API mocking

**Priority Test Coverage:**
1. `AuthContext` - Login/logout flows
2. `ProtectedRoute` - Role-based access
3. Key pages - Dashboard data loading
4. Form submissions - Task submission, attendance marking

**Setup Commands:**
```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom
```

**Example test file structure:**
```
src/
├── __tests__/
│   ├── context/
│   │   └── AuthContext.test.jsx
│   ├── components/
│   │   └── ProtectedRoute.test.jsx
│   └── pages/
│       └── Login.test.jsx
```

---

## 3. File Upload Implementation (Future Feature)

**Current State:** The `task_submissions` table has a `file_url` column but Supabase Storage is not configured.

**To Implement:**
1. Create Supabase Storage bucket
2. Add RLS policies for storage
3. Update `TaskSubmission.jsx` with file upload UI
4. Handle file upload to Supabase Storage

---

## 4. Profile Page

**Current State:** Shows "Coming Soon" placeholder at `/profile` route.

**To Implement:**
- User profile view/edit
- Password change
- Profile picture upload

---

## Priority Order

| Item | Priority | Effort | Impact |
|------|----------|--------|--------|
| Remove console logs | High | 10 min | Security/Clean |
| Add basic tests | Medium | 2-4 hrs | Reliability |
| File uploads | Low | 4-6 hrs | Feature |
| Profile page | Low | 2-3 hrs | Feature |
