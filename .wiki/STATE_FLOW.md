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

## Maintenance
- Any new API endpoint or stateful feature must update this file with its data flow pattern.
