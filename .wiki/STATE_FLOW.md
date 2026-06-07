# STATE_FLOW.md – Data Flow & State Management

## Overview
- **API Layer:** All backend communication is handled via `/src/lib/api.ts` (FastAPI backend).
- **State Management:**
  - **Zustand:** Used for global state (user, auth, session, etc.).
  - **React Query:** Used for data fetching, caching, and background updates.
- **Hooks:** Custom hooks in `/src/hooks/` encapsulate logic for device detection, toasts, and API integration.

## Data Flow
1. **Page/Container Component** triggers a data fetch (e.g., on mount or user action).
2. **API Call** is made via `/src/lib/api.ts` (using fetch/axios or React Query hooks).
3. **State Update:**
   - If using React Query, data is cached and available via hooks.
   - If using Zustand, state is updated directly and available app-wide.
4. **UI Components** receive data via props or context, rendering the latest state.

## Example
- **Login Flow & Cookie Session:**
  - `/src/pages/Login.tsx` calls login endpoint. On success, the backend sets an HttpOnly cookie session and returns user metadata (saved in `localStorage` for driving client-side UI).
  - **API Fetch (`api.ts`)**: Requests default to `options.credentials = 'include'` so cookies are sent automatically. If a request returns `401 Unauthorized`, the client clears user metadata and redirects to `/login`.
  - **OAuth Callback (`AuthCallback.tsx`)**: Exchanges Supabase Google login credentials with the FastAPI backend, which verifies the identity, sets the local `access_token` cookie, and registers metadata.

- **Creator Onboarding & Instagram Linkage Flow:**
  - `/src/pages/creator/CompleteProfile.tsx` collects `nickname`, `bio`, and `phone`.
  - The "Connect Instagram" button calls `getInstagramAuthUrl()` to get the Meta OAuth page URL (or Sandbox URL if credentials are not configured).
  - The Meta OAuth callback redirects back to the backend `/api/auth/meta/callback`, which exchanges the authorization code, verifies a linked Instagram Professional/Business account, saves the encrypted tokens to the database, and redirects the browser back to the onboarding page with `?success=true` or `?error=msg`.
  - **Developer Sandbox Mode**: If Meta app credentials are not set, the browser redirects to `/creator/complete-profile?mock_oauth=true`. This launches a modal allowing the developer to simulate a professional account linkage (calls `/api/auth/meta/mock-callback` with status success) or a personal account rejection.
  - Form submission is locked until the Instagram account is successfully linked and verified.

- **Brand Onboarding & Social Media Linkage Flow:**
  - `/src/components/brand/BrandOnboarding.tsx` performs PAN card validation and collects brand profile customizations.
  - **Logo File Upload Flow**: Brand onboarding replaces text inputs with an image file input (supporting source images up to 25MB). The frontend validates format (JPG, PNG, WebP) and size, then center-crops and compresses the image browser-side using HTML5 Canvas to an **up to 720x720px WebP** format. A local object URL is generated to render an instant live mockup preview. The tiny compressed WebP file (~50KB) is then uploaded to the backend upload endpoint `/api/brand/onboarding/logo`, which validates, re-encodes, and saves the file to Supabase storage.
  - Connecting Instagram and YouTube channels is **mandatory** for completing profile setup.
  - **Developer Sandbox Mode**: Connect buttons open a sandbox simulation modal allowing the user to select "Simulate OAuth Success" (which populates the profile fields with `@brand_instagram` / `Brand Official Channel` handles and saves them to the database) or "Simulate OAuth Failure" (resulting in connection cancel notifications).

## Maintenance
- Any new API endpoint or stateful feature must update this file with its data flow pattern.
