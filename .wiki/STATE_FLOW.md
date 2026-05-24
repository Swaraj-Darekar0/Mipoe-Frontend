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
- **Login Flow:**
  - `/src/pages/Login.tsx` uses a hook to call the login API.
  - On success, updates Zustand store with user/session info.
  - UI updates to reflect authenticated state.

## Maintenance
- Any new API endpoint or stateful feature must update this file with its data flow pattern.
