# Pre-Production Checklist

Items to address before going to production.

---

## ✅ COMPLETED

### 1. Remove Debug Console Logs ✅
**Status:** DONE (2026-01-12)

Removed all 15 debug `console.log` statements from `src/context/AuthContext.jsx`.
Kept only `console.error` calls for error tracking.

### 2. Replace Native confirm() Dialogs ✅
**Status:** DONE (2026-01-12)

- Created `ConfirmModal` component (`src/components/common/ConfirmModal.jsx`)
- Updated `AdminClasses.jsx` - uses ConfirmModal for class deactivation
- Updated `ClassStudents.jsx` - uses ConfirmModal for student removal

---

## 🟡 NON-CRITICAL (Future Improvements)

### 3. Add Unit/Integration Tests

**Priority:** Medium | **Effort:** 2-4 hrs | **Impact:** Reliability

**Issue:** No automated tests exist. While acceptable for MVP, tests should be added before scaling.

**Recommended Testing Stack:**
- **Vitest** - Fast unit testing (works great with Vite)
- **React Testing Library** - Component testing
- **MSW (Mock Service Worker)** - API mocking

**Setup Commands:**
```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom
```

**Priority Test Coverage:**
1. `AuthContext` - Login/logout flows
2. `ProtectedRoute` - Role-based access
3. Key pages - Dashboard data loading
4. Form submissions - Task submission, attendance marking

---

### 4. Add Error Logging Service

**Priority:** Medium | **Effort:** 1-2 hrs | **Impact:** Debugging in production

**Issue:** Console.error logs are only visible in browser console. In production, you won't see user errors.

**Recommended Services:**
- **Sentry** - Error tracking with stack traces
- **LogRocket** - Session replay + error tracking
- **Vercel Analytics** - Built-in if using Vercel

**Implementation:**
```bash
npm install @sentry/react
```

---

### 5. Form Validation Enhancement

**Priority:** Low | **Effort:** 2-3 hrs | **Impact:** UX

**Current State:** Forms use basic HTML validation (`required` attribute).

**Improvements:**
- Add client-side validation messages
- Email format validation
- URL format validation for live links
- Date validation (no past dates for new sessions)

**Options:**
- React Hook Form + Zod
- Formik + Yup
- Custom validation functions

---

### 6. File Upload Implementation

**Priority:** Low | **Effort:** 4-6 hrs | **Impact:** Feature

**Current State:** The `task_submissions` table has a `file_url` column but Supabase Storage is not configured.

**To Implement:**
1. Create Supabase Storage bucket called `submissions`
2. Add RLS policies for storage:
   - Students can upload to their own folder
   - Teachers can read student uploads
3. Update `TaskSubmission.jsx` with file upload UI
4. Add file type/size validation
5. Handle file upload to Supabase Storage

---

### 7. Profile Page Implementation

**Priority:** Low | **Effort:** 2-3 hrs | **Impact:** Feature

**Current State:** Shows "Coming Soon" placeholder at `/profile` route.

**To Implement:**
- User profile view
- Name editing
- Password change functionality
- Profile picture upload (requires Supabase Storage)

---

### 8. Rate Limiting Awareness

**Priority:** Low | **Effort:** 1 hr | **Impact:** Security

**Issue:** No client-side rate limiting awareness for failed login attempts.

**Improvements:**
- Track failed login attempts
- Show warning after 3 failed attempts
- Implement exponential backoff on retries
- Consider CAPTCHA after multiple failures

---

### 9. Accessibility (a11y) Improvements

**Priority:** Low | **Effort:** 3-4 hrs | **Impact:** Inclusivity

**Improvements:**
- Add `aria-labels` to icon-only buttons
- Ensure proper focus management in modals
- Add keyboard navigation support
- Test with screen readers
- Add skip-to-content link

---

### 10. Performance Optimizations

**Priority:** Low | **Effort:** 2-3 hrs | **Impact:** Speed

**Improvements:**
- Lazy load routes with `React.lazy()`
- Add image optimization
- Implement data caching strategy
- Add pagination for large lists (students, sessions)
- Use `useMemo` / `useCallback` where beneficial

---

## Priority Summary

| Item | Priority | Status |
|------|----------|--------|
| Remove debug logs | Critical | ✅ DONE |
| Replace confirm() dialogs | Critical | ✅ DONE |
| Add tests | Medium | 🟡 TODO |
| Error logging service | Medium | 🟡 TODO |
| Form validation | Low | 🟡 TODO |
| File uploads | Low | 🟡 TODO |
| Profile page | Low | 🟡 TODO |
| Rate limiting | Low | 🟡 TODO |
| Accessibility | Low | 🟡 TODO |
| Performance | Low | 🟡 TODO |
