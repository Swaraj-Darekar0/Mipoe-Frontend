# INDEX.md – Codebase Map

## Main Structure
- `/src/components/` – Shared and domain-specific React components
  - `/ui/` – UI primitives (buttons, dialogs, forms, etc.)
  - `/brand/`, `/creator/`, `/Home/` – Feature-specific components
- `/src/hooks/` – Custom React hooks for logic and state
- `/src/layouts/` – Layout wrappers for different user roles
- `/src/lib/` – API clients, utility functions, and third-party integrations
- `/src/pages/` – Route-level components (mapped to app routes)
- `/src/utils/` – Utility functions (e.g., image compression, route preloading)
- `/public/` – Static assets

## Folder Responsibilities
- **components/ui/**: Core UI building blocks (reusable, stateless)
- **components/brand/**: Brand dashboard, wallet, and profile modals
- **components/creator/**: Creator dashboard, campaign cards, notifications
- **components/Home/**: Landing page, marketing, and onboarding UI
- **hooks/**: Device detection, toast notifications, Instagram integration
- **layouts/**: Auth, Brand, and Creator layout wrappers
- **lib/**: API communication, Supabase client, shared utilities
- **pages/**: Route entry points (login, register, dashboards, error pages)
- **utils/**: Helper functions for payments, images, and routing
