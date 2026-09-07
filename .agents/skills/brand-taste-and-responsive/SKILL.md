---
name: brand-taste-and-responsive
description: Comprehensive visual taste, information density, contextual sidebar architecture, and mobile responsiveness guidelines for the Sellr Brand portal.
---

# Brand Taste & Responsive Design System

This skill sets the visual design standards and technical patterns for the Sellr Brand portal, combining the core principles of the Designer Skills Pack (`critique-information-density`, `critique-visual-hierarchy`, `spacing-system`, `typography-scale`, and `responsive-design`).

---

## 1. Contextual Sidebar Architecture

The Brand portal operates in three distinct layout contexts:

1. **Dashboard Context** (`/brand/dashboard`, `/brand/create`):
   - Uses `<BrandSidebar />`.
   - Displays global navigation: Hub, Brand Campaigns, Launch UGC, Launch Clipping, Affiliate Settings (Campaigns, Catalog, CRM), Finance (Transaction Log), and Profile/Logout.

2. **Campaign Detail Context** (`/brand/dashboard/:id`, `/brand/affiliate-dashboard/:id`):
   - The global sidebar is **replaced** by the **Campaign Sidebar**!
   - In clipping/influencer campaigns: `<CampaignSidebar />` displays `SELLR.` logo, prominent `<- Back to Dashboard` navigation button, campaign title with type badge, and the Campaign Tabs (`Statistics`, `Content Verification`).
   - In affiliate campaigns: `<AffiliateCampaignSidebar />` displays `SELLR.` logo, `<- Back to Dashboard` button, campaign title with category badge, and the Affiliate Tabs (`Overview & Rules`, `Creators & Applications`).
   - **CRITICAL**: The main page content must NOT render a redundant inner campaign tabs box. The sidebar handles campaign navigation entirely, giving the workspace 100% of the horizontal space.

3. **Full-Width Utility Context** (`/brand/transactions`):
   - Render with `sidebar="none"`.
   - No left sidebar. The transaction history, KPI summary cards, filters, and wide data tables span the full canvas with a clean `<- Back to Dashboard` header.

---

## 2. Information Density & Anti-Zoom Standards ("Taste")

Avoid bloated, oversized, low-density UI elements that make the screen feel "too much zoomed":

- **Card Sizing & Padding**:
  - Use `p-4` or `p-4 sm:p-5` instead of bloated `p-6` or `p-8`.
  - Subtle borders: `border-zinc-200/80` or `border-gray-200`. Avoid neon or thick colored borders (e.g. avoid giant yellow outlines).
- **Typography Scale**:
  - Page Titles: `text-xl sm:text-2xl font-bold` (not `text-4xl`).
  - Stat Numbers: `text-xl sm:text-2xl font-extrabold` (not giant `text-3xl`/`text-4xl` taking up the whole card).
  - Stat Labels: `text-[11px] font-semibold uppercase tracking-wider text-gray-400`.
  - Body / Subtext: `text-xs text-gray-500`.
- **Top Performing Clips Card Structure**:
  - Prevent text collision: The status pill (`Underperforming`, `On Track`, `Outperforming`) and the percentage (`0.00%`) must have dedicated spacing or flex wrap/separation so they NEVER collide or overlap.
  - Metrics Grid: Compact 2x2 or 4-item pill grid (`p-2 rounded-lg bg-gray-50 text-xs`).
  - Rank Badges: Compact badge (`Rank #1` with subtle amber/gold crown, `#2` silver, `#3` bronze).
  - Action Button: Sleek, compact `size="sm"` button (`Watch Reel / Source`).

---

## 3. Mobile Viewport Standards (< 768px)

- **Touch & Drawer Navigation**:
  - Mobile header (`h-14` or `h-16`) with `SELLR.` Brand branding and hamburger trigger.
  - Drawer opens the active contextual sidebar (Campaign sidebar when in a campaign; Dashboard sidebar when on dashboard).
- **Grid Stacking**:
  - All multi-column grids (`grid-cols-2`, `grid-cols-4`, `grid-cols-3`) must collapse to `grid-cols-1` on mobile screens (`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`).
- **Horizontal Overflow Prevention**:
  - Every table must be enclosed within an `overflow-x-auto` wrapper.
  - Form inputs must use `w-full` on mobile, avoiding fixed widths like `max-w-[180px]`.
  - Container padding on mobile: `p-3 sm:p-4 md:p-6`.
