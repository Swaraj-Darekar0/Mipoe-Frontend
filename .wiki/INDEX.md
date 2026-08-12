# INDEX.md – Codebase Map

## Main Structure
- `/src/components/` – Shared and domain-specific React components
  - `/ui/` – UI primitives (`Stepper.tsx`, `button.tsx`, `dialog.tsx`, `input.tsx`, `ImageCropInput.tsx`, etc.)
  - `/brand/`, `/creator/`, `/Home/` – Feature-specific components
- `/src/hooks/` – Custom React hooks for logic and state
- `/src/layouts/` – Layout wrappers for different user roles
- `/src/lib/` – API clients, utility functions, and third-party integrations
- `/src/pages/` – Route-level components (mapped to app routes)
- `/src/utils/` – Utility functions (e.g., image compression, route preloading)
- `/public/` – Static assets

## Key System Directives
- **Onboarding UI Standard**: ALL onboarding workflows (Brand Onboarding, Affiliate Technical Onboarding, Creator Profile Completion, and any future onboarding flows) MUST use the `<Stepper />` UI component from `/src/components/ui/Stepper.tsx`.
- See `COMPONENT_LIBRARY.md` for detailed component architecture and onboarding step mappings.

## Folder Responsibilities
- **components/ui/**: Core UI building blocks (reusable, stateless primitives including `<Stepper />`)
- **components/brand/**: Brand dashboard, wallet, onboarding (`BrandOnboarding.tsx`, `AffiliateOnboarding.tsx`)
- **components/creator/**: Creator dashboard, campaign cards, notifications
- **components/Home/**: Landing page, marketing, and onboarding UI
- **hooks/**: Device detection, toast notifications, Instagram integration
- **layouts/**: Auth, Brand, and Creator layout wrappers
- **lib/**: API communication, Supabase client, shared utilities
- **pages/**: Route entry points (login, register, dashboards, creator `CompleteProfile.tsx`)
- **utils/**: Helper functions for payments, images, and routing
