# End-to-End Supabase Auth & RBAC Implementation Plan

This plan details the steps to fully resolve the broken authentication flow, implement Role-Based Access Control (RBAC), set up automatic profile creation via Postgres triggers, and ensure a production-ready Next.js + Supabase setup.

## Proposed Changes

### 1. Database & Migrations
Create a new migration (`20260828000002_auth_trigger_rbac.sql`) to:
- **RBAC**: Add a `role text default 'owner'` column to the `public.profiles` table.
- **Auto-Profile Creation**: Create a Postgres function and trigger on the `auth.users` table so that whenever a user signs up via Supabase Auth, a row is automatically inserted into `public.profiles` using their email/metadata.
- **RLS Review**: Ensure existing RLS policies on `profiles`, `projects`, `media_assets`, `audit_reports`, `brand_deals`, and `ai_ideas` properly restrict operations to `auth.uid() = user_id`.

### 2. Supabase Configuration
- **Remove Mocks**: Remove the fallback `mock-project` URL in `src/lib/supabase.ts`.
- **Environment UI Guard**: If `NEXT_PUBLIC_SUPABASE_URL` is missing, the app will render a clear "Missing Configuration" UI instead of failing silently.
- **Callback Route**: Implement `src/app/auth/callback/route.ts` to securely exchange the OAuth/Magic Link auth code for a session and redirect back to the app.

### 3. Authentication Context (`auth-context.tsx`)
- Enhance `AuthProvider` to handle full state lifecycle: `loading`, `session`, and `user`.
- Add explicit methods for: `signInWithEmail`, `signUpWithEmail`, `signInWithGoogle`, `signInWithMagicLink`, and `signOut`.
- Expose RBAC helper functions: `canEditContent`, `canManageDeals`, `canViewAnalytics` based on the user profile's role.

### 4. Login Screen & UI Cleanup
- **Login Component (`login.tsx`)**: 
  - Fix any broken text encoding/mojibake.
  - Implement full forms for Email/Password Sign Up and Sign In, alongside Google OAuth and Magic Link.
  - Add robust loading indicators and inline error messages.
  - Provide helper text if Google OAuth fails.
- **App Gating (`page.tsx`)**:
  - Handle the rendering tree: Config Missing Guard -> Login Screen -> Setup/Onboarding Guard -> Main App.

## Verification Plan
1. **Lint Check**: Run `npm run lint`.
2. **Build Check**: Run `npm run build`.
3. **Checklist Delivery**: Provide the requested manual configuration checklist for the Supabase Dashboard (Google Provider, Redirect URLs, Site URL).
