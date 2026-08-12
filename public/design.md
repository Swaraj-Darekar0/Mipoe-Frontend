# Design.md — Index Page Redesign (Brand / Creator Dual Portal)

> Prompt spec for the AI coordinator. Implements a persona-aware index page with a sticky nav that toggles the entire page UI between **Brand** mode and **Creator** mode. Reference images: `vyro-hero.png` (hero), `hypd-signal-grid.png` (brand motivation grid), `hypd-rangebar.png` (brand + creator earnings calculator).

---

## 0. Global Architecture

**File split (logical separation required):**
- `Navbar.tsx` (or equivalent) — shared component, persona-aware, sticky
- `BrandHome.tsx` (or `/brand` view) — full brand-mode page
- `CreatorHome.tsx` (or `/creator` view) — full creator-mode page
- Index page renders `Navbar` + conditionally renders `BrandHome` or `CreatorHome` based on active persona state

**Persona toggle behavior:**
- Two nav buttons: **"For Brands"** and **"For Creators"**
- Default state on load: pick one persona as default (recommend Creator, since that's likely the primary acquisition funnel — confirm with Swaraj if unsure)
- Clicking "For Brands" while in Creator mode → swaps entire page content to Brand UI, and the nav button that was "For Brands" now reads/behaves as "For Creators" (i.e., the nav always shows the *other* option as the CTA — clicking it takes you to the other persona)
- This swap should NOT be a route change necessarily — can be client-side state (persona: 'brand' | 'creator') so the nav stays sticky and mounted across the swap
- Transition between personas should have a smooth crossfade/slide (150–250ms) — avoid a jarring hard cut

**Sections per persona (in order):**
1. Hero (persona-specific copy, shared structural style)
2. Signaling Factor — horizontal scroll-triggered carousel (persona-specific steps)
3. Motivation Calculator — interactive range-bar earnings estimator (persona-specific formula)
4. FAQ — 5 Q&As (persona-specific content)

---

## 1. Hero Section
**Reference: Image 1 (VYRO)**

### Navbar (adapt VYRO's structure)
- Pill/rounded-full container, floating with padding from the top edge, NOT full-bleed — matches VYRO's inset white pill navbar
- Left: logo/wordmark
- Center: nav links
- Right: persona toggle button ("For Brands" / "For Creators") styled as a solid dark pill button (matches VYRO's black "Sign up" pill) — this replaces VYRO's Login/Sign up pair with our single persona-toggle CTA
- Keep it **sticky** across scroll and across persona swaps, per project requirement
- Background of navbar: white/light, high contrast against page background regardless of which persona's background color is active

### Layout
- Two-column hero: left = text block, right = visual (fanned/stacked mobile mockups showing content in-feed, as in reference)
- Left column headline: large, bold, multi-line, left-aligned, mixing regular-weight and bold-weight words for emphasis (VYRO does "Never Leave The **For** You **Feed**" — bold on key nouns). Adapt this treatment to our own headline copy per persona.
- Sub-headline: 1–2 sentence description in muted gray, regular weight, max-width constrained (~480px) below headline
- Primary CTA button below sub-headline (pill-shaped, dark fill, matches nav CTA styling)
- Right column: 5–7 phone-mockup cards fanned/overlapping at slight rotation angles, front card largest and fully visible, back cards partially cropped/faded — shows platform content in a social-feed style UI (likes, comments, shares icons visible) to reinforce "this is where your content lives"

### Color & Typography (adapt from VYRO, don't clone)
- Background: soft gradient, light tone (VYRO uses pale blue-to-mint) — carry this airy, optimistic light-mode feel into our Brand hero; for Creator hero, keep the same structural layout but this is where our existing Desi-Pop palette/accent colors should be layered in per our established brand aesthetic
- Font: bold geometric sans-serif for headline (heavy weight), clean sans for body — match what's already defined for the project's type system; do not introduce a new typeface family, just apply VYRO's *weight contrast* technique (regular + bold mixed in one heading)
- Keep our existing brand color identity — this reference is for **layout and typographic rhythm**, not literal color replacement

### Task for coordinator
Map our current hero content/assets into this structure. Do not invent new copy — flag to Swaraj which existing hero copy needs shortening/restructuring to fit the two-line bold-emphasis headline pattern.

---

## 2. Signaling Factor Section
**No direct visual reference — structural spec only**

### Behavior
- Horizontal-scrolling carousel, **scroll-triggered** (page scroll drives horizontal movement within a pinned/sticky section — scrollytelling pattern, e.g. via GSAP ScrollTrigger horizontal-scroll or Framer Motion `useScroll` + `translateX`)
- Section pins vertically while the user scrolls; vertical scroll input translates to horizontal panel movement until the carousel completes, then normal vertical scroll resumes
- Each panel = one step, image/illustration + short label, revealing a step-by-step "how you make money on this platform" narrative

### Brand version
- Steps walk through: how a brand sets up a campaign → gets matched with creators → content goes live → brand tracks performance/sales → brand earns ROI
- (Exact step count and copy TBD with Swaraj — placeholder 4–5 steps)

### Creator version
- Steps walk through: how a creator joins → links their store/content → posts campaign content → gets discovered/shared → earns commission/payout
- (Exact step count and copy TBD — placeholder 4–5 steps)

### Task for coordinator
Build the scroll-pin + horizontal-translate mechanism as a reusable component (`ScrollCarousel`) accepting an array of `{image, title, description}` steps, so it can be dropped into both Brand and Creator pages with different data.

---

## 3. Motivation / Earnings Calculator Section
**Reference: Image 3 (HYPD "how rich is rich?")**

### Visual style
- Dark background (near-black), full-bleed section, high contrast with light hero above it
- Centered headline with one word in accent gradient color (HYPD does "rich?" in coral/orange — pick our own accent color for the emphasis word)
- Small muted subtext under headline explaining the calculation basis
- Two labeled range sliders stacked vertically, each with:
  - Left-side min value label, right-side max value label (small, muted)
  - Slider track with gradient fill (color-coded per metric — e.g. red-to-white for one, purple-to-white for the other)
  - Current value shown as a bold label centered under the thumb
- Below both sliders: a large bold result statement with the computed number in an accent gradient color, using a template like "you could earn between **[X]** and **[Y]** more!"
- Small disclaimer/asterisk text under the result explaining the assumption basis
- Bottom row: a dashed-border pill showing a personalized URL/handle placeholder + a solid gradient CTA pill button side-by-side

### Brand version (inputs → output)
- Slider 1: **Investment amount** (₹ range — define min/max with Swaraj, e.g. ₹10K–₹5L)
- Slider 2: **Campaign scenario/scale** (e.g. number of creators engaged, or campaign duration — TBD)
- Output: estimated return range in ₹, live-recalculated as sliders move
- CTA: "Start a Campaign" or similar, linking to brand signup

### Creator version (inputs → output)
- Slider 1: **Follower count** (500 – 1M, matching reference pattern)
- Slider 2: **Monthly posts** (10 – 100, matching reference pattern)
- Optional slider 3 if desired: **Campaigns participated in per month**
- Output: estimated earnings range in ₹, live-recalculated as sliders move
- CTA: "Join as a Creator" linking to creator signup, alongside a `ourdomain.com/your_name` style handle preview input (dashed border, matches reference)

### Task for coordinator
- Build as a reusable `EarningsCalculator` component taking `{sliders: [{label, min, max, step, unit}], computeResult: (values) => {min, max}}` so brand/creator variants just pass different config + formula
- Formula (multiplier logic) for both versions: **flag to Swaraj for exact numbers** — do not invent real financial claims; use conservative placeholder logic (e.g. simple % range of follower count × posts, or % of investment) until real numbers are supplied
- All values must update live/interactively on drag, not just on release

---

## 4. FAQ Section

### Structure
- 5 questions per persona (Brand FAQ ≠ Creator FAQ — separate content sets, same component)
- Standard accordion pattern: click question → expands answer, collapses others (or allows multiple open — coordinator's call based on existing site pattern)
- Keep visual style consistent with whichever section precedes it (likely inherits the dark theme from the calculator section, or returns to light — coordinator to match existing site's FAQ treatment if one already exists)

### Task for coordinator
- Reuse existing FAQ component/pattern if the site already has one; otherwise build simple accordion
- Content (5 Q&As each for Brand and Creator) — **placeholder needed from Swaraj**, do not fabricate platform policy/pricing claims

---

## 5. Open Items Requiring Swaraj's Input Before Build
- [ ] Default persona on first load (Brand or Creator)
- [ ] Exact hero headline copy for both personas
- [ ] Signaling Factor step copy + step count (brand + creator)
- [ ] Earnings calculator real formulas/multipliers (brand + creator) — currently placeholder logic only
- [ ] Slider min/max ranges for brand investment scenario
- [ ] FAQ content (5 Q&As × 2 personas = 10 total)
- [ ] Accent gradient color choice for calculator section (currently referencing HYPD's coral/purple — confirm or replace with our palette)

---

## 6. Component Checklist for Coordinator
- [ ] `Navbar` — sticky, persona-aware toggle, shared across both modes
- [ ] `Hero` — persona-variant content, shared layout shell
- [ ] `ScrollCarousel` — reusable horizontal scroll-pin carousel
- [ ] `EarningsCalculator` — reusable dual-slider live calculator
- [ ] `FAQAccordion` — reusable accordion, persona-variant content
- [ ] `BrandHome` — composes Hero + ScrollCarousel + EarningsCalculator + FAQAccordion (brand config)
- [ ] `CreatorHome` — composes same components (creator config)
- [ ] Persona state management (context/store) shared between Navbar and Home views, with smooth transition on switch
