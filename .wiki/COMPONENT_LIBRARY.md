# COMPONENT_LIBRARY.md – Shared UI Components & Design Standards

## Key UI Primitives (in `/src/components/ui/`)
- **Stepper (`Stepper.tsx`, `Stepper.css`)**: **Mandatory Onboarding UI Standard**. Open-source React Bits animated step wizard component built with `framer-motion` slide transitions, automatic height resize detection via `ResizeObserver`, step indicators, progress connectors, and step labels. **All onboarding flows MUST use this component.**
- **Button (`button.tsx`)**: Standard button, supports variants and loading state.
- **Input (`input.tsx`)**: Text input, with label and error support.
- **ImageCropInput (`ImageCropInput.tsx`)**: Centralized image uploader with aspect ratio cropping (1:1 logo, 3:1 banner) and 5MB size validation.
- **Dialog (`dialog.tsx`)**: Modal dialog, composable for custom content.
- **Card (`card.tsx`)**: Card container for grouping content.
- **Table (`table.tsx`)**: Table component for data display.
- **Tabs (`tabs.tsx`)**: Tabbed navigation UI.
- **Toast/Toaster (`toast.tsx`, `toaster.tsx`)**: Notification system for feedback.
- **Avatar (`avatar.tsx`)**: User or brand avatar display.
- **Badge (`badge.tsx`)**: Status or label badge.
- **Accordion (`accordion.tsx`)**: Expand/collapse content sections.
- **Switch (`switch.tsx`)**: Toggle switch for boolean values.
- **Popover (`popover.tsx`)**: Floating content container.
- **Dropdown Menu (`dropdown-menu.tsx`)**: Menu for actions or navigation.

---

## 🚀 Onboarding Stepper UI Standard

All onboarding workflows in Mipoe (Brand Onboarding, Affiliate Onboarding, Creator Onboarding, and any future onboarding flows) **must** be implemented using the `<Stepper />` UI primitive (`/src/components/ui/Stepper.tsx`).

### Standardized Onboarding Flows:

1. **Brand Onboarding (`BrandOnboarding.tsx`)**:
   - **Step 1: Account**: Registered brand account details and active status.
   - **Step 2: Verification**: Official PAN card number, holder name, business address, and Cashfree verification check.
   - **Step 3: Profile Setup**: Business category (Personal Agency, Product Based, SaaS Based), website URL, brand description, mandatory logo upload, and Instagram/YouTube sandbox connections.
   - **Step 4: Compliance Review**: Animated ticking clock review progress, admin feedback on rejection, or account verification completion.

2. **Affiliate Onboarding (`AffiliateOnboarding.tsx`)**:
   - **Step 1: Gateway Selection**: Choose payment processor (Stripe, Razorpay, PayU, Cashfree) or custom API integration.
   - **Step 2: Integration Method**: Select architecture (Backend Server API, Serverless Edge, Database Webhooks, Client-side JS).
   - **Step 3: Setup & Boilerplate**: Generate secret keys, view dynamic webhook checklist & copy framework code snippets (Node.js, Python, PHP, Go, cURL).
   - **Step 4: Sandbox Connection Test**: Trigger test webhook ping, view live telemetry logs in the terminal console, and verify connection.

3. **Creator Onboarding (`CompleteProfile.tsx`)**:
   - **Step 1: Creator Bio & Info**: Nickname, bio description, phone number.
   - **Step 2: Social Media Verification**: Connect Instagram Professional account / YouTube channel via OAuth or sandbox simulator.
   - **Step 3: Payout Setup**: Configure UPI ID or Bank account details (account holder name, account number, IFSC code).
   - **Step 4: Review & Launch**: Summary review, regulatory consent, and launch into Creator Hub.

---

## Domain-Specific Brand Components (in `/src/components/brand/`)
- **BrandOnboarding (`BrandOnboarding.tsx`)**: Multi-step compliance wizard powered by `<Stepper />`.
- **AffiliateOnboarding (`AffiliateOnboarding.tsx`)**: Multi-step technical gateway and webhook integration wizard.
- **ClipsListTable (`ClipsListTable.tsx`)**: Tabular view displaying submitted, pending, and accepted clips for a selected campaign.
- **ReelPlayFrame (`ReelPlayFrame.tsx`)**: Player preview displaying cached video thumbnails.
- **ReelMetricsPanel (`ReelMetricsPanel.tsx`)**: Panel showing view counts, likes, comments, and engagement charts.
- **SaasCampaignBuilder (`SaasCampaignBuilder.tsx`)**: Form builder for launching SaaS-specific affiliate campaigns.
- **AffiliateCRM (`AffiliateCRM.tsx`)**: Aggregated partner dashboard listing affiliate creators and code performance.

---

## Usage Guidelines
- Always import from `/src/components/ui/` for shared primitives.
- **Any new onboarding workflow MUST use `<Stepper />`** from `/src/components/ui/Stepper.tsx` for consistent UX across the application.
- Prefer composition over duplication—extend primitives for custom needs.
- Domain-specific widgets should reside in `/src/components/brand/` or `/src/components/creator/` folders.
