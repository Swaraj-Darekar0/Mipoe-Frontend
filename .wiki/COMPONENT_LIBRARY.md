# COMPONENT_LIBRARY.md – Shared UI Components

## Key UI Primitives (in `/src/components/ui/`)
- **Button (`button.tsx`)**: Standard button, supports variants and loading state.
- **Input (`input.tsx`)**: Text input, with label and error support.
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

## Domain-Specific Brand Components (in `/src/components/brand/`)
- **BrandOnboarding (`BrandOnboarding.tsx`)**: Standalone multi-step compliance wizard containing PAN inputs, disabled/locked states on verification success, a manual override Edit toggle, a secure brand logo image file uploader (supporting files up to 25MB, performing client-side center-cropping and 480x480px WebP pre-compression, and displaying an instant live circular avatar mockup preview card), and mandatory Instagram and YouTube OAuth connection buttons utilizing simulated sandbox connection flow modals.
- **ClipsListTable (`ClipsListTable.tsx`)**: Top-row tabular view displaying all submitted, pending, and accepted clips for a selected campaign, with a compact popover filter for approval state and view-count ordering; by default it prioritizes non-approved clips before approved reels, then ranks by highest views.
- **ReelPlayFrame (`ReelPlayFrame.tsx`)**: Bottom-left player preview displaying cached video thumbnails (with og:image S3 bucket url) and center play overlays.
- **ReelMetricsPanel (`ReelMetricsPanel.tsx`)**: Bottom-right panel showing backend-supplied `view_count`, `like_count`, and `comment_count` metrics, dynamic outperforming/on-track/underperforming performance indicators, and composed charts mapping view growth against engagement rates over custom intervals.

## Page-Level Notes
- **Brand Campaign Analytics (`/src/pages/brand/CampaignAnalytics.tsx`)**: The statistics tab includes a "Top Performing Clips" section that ranks accepted reels by live engagement rate (`(likes + comments) / views`) and exposes a popover breakdown for each reel’s views, likes, and comments.
- **Creator Submissions (`/src/pages/creator/Submissions.tsx`)**: The submissions list now uses a dark, responsive table/card hybrid with filter controls for approval state and view-count ordering; accepted clips are pinned to the top by default and mobile users get stacked cards instead of a cramped table.

## Usage
- Always import from `/src/components/ui/` for shared primitives.
- Prefer composition over duplication—extend primitives for custom needs.
- Domain-specific widgets should reside in `/src/components/brand/` or `/src/components/creator/` folders.
- Check this file before creating new UI components.
