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
- **utils/**: Helper functions for payments (`src/utils/payments/` with modular `onramp/`, `razorpay/`, and `cashfree/` SDK loaders), image compression, and route preloading
- **Web 2.5 Architecture**: Non-custodial ERC-4337 smart accounts on Base L2 provisioned seamlessly via **Crossmint** (self-serve staging, 1,000 free MAWs, gas paymaster) with hot-swap compatibility for Okto via `WALLET_PROVIDER`.
  - **Creator Auth Overhaul**: Completely passwordless 1-click onboarding for creators via Google OAuth and Phone / WhatsApp OTP (`Login.tsx`, `Register.tsx`). Corporate email/password login preserved for Brands.
  - **Creator Guest Mode (PLG)**: Unauthenticated creators can explore active campaigns on `/creator/campaigns` and the Creator Hub without 401 redirects. Private tabs (`/creator/wallet`, `/creator/submissions`, `/creator/profile`, `/creator/affiliate-analytics`, `/creator/store`) display `<GuestLockedView />` with in-context Google/wallet sign-in and returnUrl redirection.
  - **Brand Onboarding Friction Elimination**: Step 2 PAN verification removed completely from `BrandOnboarding.tsx`. Brand onboarding transitions seamlessly to verified status without third-party PAN API blockers.
  - **B2B GST & Tax Invoices (ITC)**: Dedicated tab at `/brand/dashboard?tab=tax_invoices` (`TaxInvoicesTab.tsx`) allowing registered businesses to enter their 15-digit GSTIN (auto-extracting PAN), and generate/download GSTR-1 compliant B2B tax invoices with CGST/SGST/IGST breakdowns for Input Tax Credit claims.
  - **Brand Unspent Fund Refund & Withdrawal Engine**: In `/brand/transactions` (`Transactions.tsx`), modal dialog allows brands to refund unspent deposits back to corporate UPI/Bank. Enforces unallocated pool invariant against active campaign locks and applies 0% TDS exemption (capital return).
  - **Statutory TDS & Form 26Q**: Prior to first withdrawal, educational PAN modal enforces Section 194S compliance (1% standard TDS vs 20% Section 206AA penalty) for quarterly Form 26Q filing (`Wallet.tsx`).
  - **DPDP Act 2023 Account Erasure**: Danger Zone in `Profile.tsx` offering complete personal data deletion via `DELETE /api/auth/account` while preserving pseudonymized on-chain audit ledger compliance.
  - **Zero-Fee UPI Onramp**: Option B Onramp.money widget integration in `AddFunds.tsx` for instant zero-fee brand deposits.
  - **BaseScan Explorer Transparency**: Direct explorer links to Base Sepolia testnet on `AddFunds.tsx` and `Wallet.tsx` for real-time auditability.
