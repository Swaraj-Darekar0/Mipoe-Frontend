# Design.md — Index Page Redesign (Brand / Creator Dual Portal)

> Prompt spec for the AI coordinator. Implements a persona-aware index page with a sticky nav that toggles the entire page UI between **Brand** mode and **Creator** mode. Structural references: `vyro-hero.png` (hero layout), `hypd-signal-grid.png` (brand motivation grid), `hypd-rangebar.png` (earnings calculator mechanic). **Visual system (color, type, shape, elevation): Notion**, applied in full — this replaces the project's prior orange/black palette. Treat every color, font-size, radius, and shadow value below as the literal spec, not inspiration.

**Design philosophy for this pass:** one confident brand color, used sparingly and consistently, against a mostly-neutral canvas — restraint over decoration. Every accent color earns its place by carrying meaning (a specific persona, a specific state), never applied just to fill space. This is a deliberate move away from a busier orange/black scheme toward something that reads as edited, not decorated.

---

## 0. Global Architecture

**File split (logical separation required):**
- `Navbar.tsx` (or equivalent) — shared component, persona-aware, sticky
- `BrandHome.tsx` (or `/brand` view) — full brand-mode page
- `CreatorHome.tsx` (or `/creator` view) — full creator-mode page
- Index page renders `Navbar` + conditionally renders `BrandHome` or `CreatorHome` based on active persona state
- `design-tokens.(ts|css)` — single source of truth for the token set in Section 1 below; every component pulls from here, nothing hardcodes a hex value inline

**Persona toggle behavior:**
- Two nav buttons: **"For Brands"** and **"For Creators"**
- Default state on load: pick one persona as default (recommend Creator, since that's likely the primary acquisition funnel — confirm with Swaraj if unsure)
- Clicking "For Brands" while in Creator mode → swaps entire page content to Brand UI, and the nav button that was "For Brands" now reads/behaves as "For Creators" (i.e., the nav always shows the *other* option as the CTA — clicking it takes you to the other persona)
- This swap should NOT be a route change necessarily — can be client-side state (persona: 'brand' | 'creator') so the nav stays sticky and mounted across the swap
- Transition between personas should have a smooth crossfade/slide (**180ms ease**, per Notion's recommended transition timing) — avoid a jarring hard cut

**Sections per persona (in order):**
1. Hero (persona-specific copy, shared structural style)
2. Signaling Factor — horizontal scroll-triggered carousel (persona-specific steps)
3. Motivation Calculator — interactive range-bar earnings estimator (persona-specific formula)
4. FAQ — 5 Q&As (persona-specific content)

---

## 1. Design Tokens (Notion System — Applied Wholesale)

This section **replaces** all prior orange/black color references anywhere else in this document or in the existing codebase. Two persona accents are introduced (Section 1.3) since we need brand/creator to feel distinct within one otherwise-neutral system — everything else is Notion's palette verbatim.

### 1.1 Colors

```
primary:            #5645d4   — signature purple, dominant CTA only
primary-pressed:     #4534b3
primary-deep:         #3a2a99
on-primary:            #ffffff

brand-navy:      #0a1530   — dark hero/section band background
brand-navy-deep:  #070f24
brand-navy-mid:    #1a2a52

link-blue:         #0075de   — inline text links ONLY, never buttons
link-blue-pressed:  #005bab

card-tint-peach:     #ffe8d4
card-tint-rose:       #fde0ec
card-tint-mint:        #d9f3e1
card-tint-lavender:     #e6e0f5
card-tint-sky:           #dcecfa
card-tint-yellow:         #fef7d6
card-tint-yellow-bold:     #f9e79f
card-tint-cream:            #f8f5e8
card-tint-gray:               #f0eeec

canvas:        #ffffff   — page background, card surfaces
surface:        #f6f5f4   — subtle section backgrounds
surface-soft:    #fafaf9
hairline:         #e5e3df   — 1px borders, dividers
hairline-soft:     #ede9e4
hairline-strong:    #c8c4be   — input borders

ink-deep:   #000000
ink:         #1a1a1a   — headlines, primary body
charcoal:     #37352f   — body emphasis, text-on-tint
slate:         #5d5b54
steel:          #787671   — footer links, tertiary text
stone:           #a4a097
muted:            #bbb8b1

on-dark:        #ffffff
on-dark-muted:   #a4a097

semantic-success: #1aae39
semantic-warning:  #dd5b00
semantic-error:     #e03131
```

### 1.2 Persona Accent Colors (new — not from Notion, needed for brand/creator differentiation)
Notion's system has no built-in concept of "two audiences," so we introduce exactly two accent colors, borrowed from Notion's own brand spectrum so they still feel native to the palette rather than bolted on:
- **Brand persona accent** → `brand-blue` (`#2b5ce6`) — Brand-mode active states, Brand slider fill, Brand CTA, and the fill of the Brand hero's display type (which is outlined in `ink-deep` via `-webkit-text-stroke`). Replaced `brand-teal` (`#2a9d99`); that token no longer exists.
- **Highlight** → `highlight` (`#ffe94a`) — the default marker colour behind emphasised display lines, in either persona. Distinct from `tint-yellow` (`#fef7d6`), which is a pale surface wash for cards and is too light to read as a marker stroke.
- **Creator persona accent** → `brand-pink` (`#ff64c8`) — used for Creator-mode active states, Creator slider fill, Creator badge
- `primary` purple stays reserved for the ONE universal action that exists regardless of persona (e.g. the main nav CTA, if we keep one neutral "Get Started"). If every CTA is persona-specific, purple can be dropped entirely in favor of the two accents — coordinator's call, but pick one rule and apply it everywhere, don't mix.

### 1.3 Typography

Font family: **Notion Sans** (Inter-based). Fallback stack: `Inter, -apple-system, system-ui, 'Segoe UI', Helvetica, sans-serif`. This **replaces** whatever typeface the project currently uses for headings and body — one family, weight does the differentiating work.

| Token | Size | Weight | Line Height | Letter Spacing | Use here |
|---|---|---|---|---|---|
| `hero-display` | 80px | 600 | 1.05 | -2px | Hero headline (desktop) |
| `display-lg` | 56px | 600 | 1.10 | -1px | Calculator section headline |
| `heading-1` | 48px | 600 | 1.15 | -0.5px | Section openers (Signaling Factor intro) |
| `heading-2` | 36px | 600 | 1.20 | -0.5px | Subsection headlines |
| `heading-3` | 28px | 600 | 1.25 | 0 | Carousel step titles |
| `heading-4` | 22px | 600 | 1.30 | 0 | Feature tile titles |
| `heading-5` | 18px | 600 | 1.40 | 0 | FAQ questions |
| `subtitle` | 18px | 400 | 1.50 | 0 | Hero sub-headline |
| `body-md` | 16px | 400 | 1.55 | 0 | Primary body copy |
| `body-md-medium` | 16px | 500 | 1.55 | 0 | Body emphasis |
| `body-sm` | 14px | 400 | 1.50 | 0 | Secondary/disclaimer text |
| `body-sm-medium` | 14px | 500 | 1.50 | 0 | Button labels, nav links |
| `caption-bold` | 13px | 600 | 1.40 | 0 | Badge labels |
| `micro-uppercase` | 11px | 600 | 1.40 | 1px | Slider min/max labels |
| `button-md` | 14px | 500 | 1.30 | 0 | All button text |

**Rule, non-negotiable:** headline weight is always 600, body is always 400, nothing in between except where the table explicitly says `-medium` (500). No italics, no light weights — this is where the "edited, not decorated" discipline shows up most.

### 1.4 Shape

| Token | Value | Use |
|---|---|---|
| `xs` | 4px | Tag chips |
| `sm` | 6px | Type badges |
| `md` | **8px** | **Buttons, inputs — rectangular, NOT pill** |
| `lg` | 12px | Cards, calculator panel, mockup frames |
| `xl` | 16px | Larger feature panels |
| `xxl` | 20px | Featured showcases |
| `full` | 9999px | Status badges, tab pills ONLY — never regular buttons |

**This is the one deliberate break from the VYRO reference below**: VYRO's nav/CTA buttons are pill-shaped. Notion's discipline is rectangular 8px buttons everywhere, pills reserved for tabs and badges. We are following Notion's rule system throughout, so **every button in this spec — nav CTA, hero CTA, calculator CTA — is an 8px-radius rectangle**, not a pill. The persona toggle in the nav can still use the pill-tab component (`pill-tab` / `pill-tab-active`), since that's a tab-switch control, not an action button — that distinction is exactly what keeps the system internally consistent instead of arbitrary.

### 1.5 Elevation

| Level | Shadow | Use |
|---|---|---|
| 0 | none, `hairline` border only | Default cards, table rows |
| 1 | `rgba(15,15,15,0.04) 0px 1px 2px 0px` | Hover-elevated tiles |
| 2 | `rgba(15,15,15,0.08) 0px 4px 12px 0px` | Feature/step cards |
| 3 | `rgba(15,15,15,0.20) 0px 24px 48px -8px` | Hero phone-mockup stack |
| 4 | `rgba(15,15,15,0.16) 0px 16px 48px -8px` | Modals, dropdowns |

### 1.6 Spacing
4px base unit. Section rhythm: `96px` between major page sections on desktop, tightening to `64px` on tablet, `48px` on mobile. Container max-width `1280px`, `32px` gutters.

---

## 2. Hero Section
**Structural reference: Image 1 (VYRO)** — layout and typographic weight-contrast technique only. **All color, type, shape values below are Notion tokens per Section 1.**

### Navbar
- Rectangular container (not pill — see 1.4), sticky, floating with padding from the top edge on desktop, full-bleed on mobile
- Background `canvas` (#ffffff), bottom border `1px solid hairline`, height ~64px
- Left: logo/wordmark in `heading-5` weight
- Center: nav links, `body-sm-medium`, text `steel`
- Right: persona toggle rendered as `pill-tab` / `pill-tab-active` pair (this is the one pill element we keep — see 1.4 rationale), active state background `ink-deep`, text `on-dark`
- Stays sticky across scroll and across persona swaps

### Layout
- Two-column hero on `brand-navy` (#0a1530) background — dark hero band, matching Notion's signature treatment, replacing VYRO's light mint gradient
- Left column: headline in `hero-display` (80px/600), text `on-dark`, mixing weight is no longer the emphasis technique — instead use the **persona accent color** on the key noun (e.g., "Never Leave The **Feed**" with "Feed" in `brand-teal` for Brand mode or `brand-pink` for Creator mode). This achieves the same emphasis effect as VYRO's bold-word technique but through Notion's color-accent logic instead of weight-mixing, keeping to the "one weight for headlines" rule in 1.3
- Sub-headline: `subtitle` token, text `on-dark-muted`, max-width ~480px
- Primary CTA: `button-primary` if using the universal purple rule, or a persona-accent-filled rectangular button (8px radius) if using the persona-only rule — pick one per 1.2 and apply everywhere
- Right column: phone-mockup stack, Elevation Level 3 shadow, cards at `rounded.lg` (12px) corners — matches Notion's `workspace-mockup-card` treatment applied to a stack instead of a single card

### Task for coordinator
Map existing hero copy into this structure. Flag to Swaraj which existing copy needs shortening for the 80px display size at desktop (this is a large, confident headline — expect to cut copy, not compress it).

---

## 3. Signaling Factor Section
**No direct visual reference — structural spec only**

### Behavior
- Horizontal-scrolling carousel, scroll-triggered (pinned section, vertical scroll drives horizontal translate — e.g. GSAP ScrollTrigger or Framer Motion `useScroll`)
- Section background: `surface` (#f6f5f4), a quiet neutral so the pastel step cards inside it carry the color
- Each step renders as a `card-feature` variant using one of Notion's pastel tints (`card-tint-peach`, `card-tint-mint`, `card-tint-sky`, `card-tint-lavender`, `card-tint-rose`, `card-tint-yellow`) — cycle through tints in a fixed order across steps so it reads as a designed sequence, not random color
- Step title `heading-3`, text `charcoal`; step description `body-md`, text `charcoal`

### Brand version
Steps: campaign setup → creator matching → content goes live → performance tracking → ROI. 4–5 steps, copy TBD with Swaraj.

### Creator version
Steps: join → link store/content → post campaign content → get discovered/shared → earn payout. 4–5 steps, copy TBD.

### Task for coordinator
Build `ScrollCarousel` accepting `{image, title, description, tint}[]` so tint assignment is data-driven, not hardcoded per persona.

---

## 4. Motivation / Earnings Calculator Section
**Structural reference: Image 3 (HYPD "how rich is rich?")** — slider mechanic and layout only; all visual treatment below is Notion tokens.

### Visual style
- Background `brand-navy-deep` (#070f24) — darkest tone in the system, for maximum contrast against the neutral sections above/below it
- Headline `display-lg` (56px/600), text `on-dark`, with the emphasis word in the active persona's accent color (`brand-teal` for Brand, `brand-pink` for Creator) — same accent-word technique as the hero, kept consistent site-wide
- Subtext: `body-sm`, text `on-dark-muted`
- Sliders: track fill uses the persona accent color at full saturation fading to `on-dark-muted` at the unfilled portion; value label in `heading-4`, text `on-dark`; min/max labels in `micro-uppercase`, text `on-dark-muted`
- Result statement: `heading-1` (48px/600), computed numbers in the persona accent color, surrounding text `on-dark`
- Disclaimer: `body-sm`, `on-dark-muted`
- Bottom row: handle-preview input styled as `text-input` with `hairline-strong` dashed border, `canvas`-on-dark contrast card; CTA button rectangular `button-primary`-style but filled with the persona accent instead of purple (persona-specific action, per the 1.2 rule)

### Brand version
- Slider 1: Investment amount (₹, range TBD with Swaraj)
- Slider 2: Campaign scale/duration (TBD)
- Output: estimated return range in ₹
- CTA: "Start a Campaign"

### Creator version
- Slider 1: Follower count (500–1M)
- Slider 2: Monthly posts (10–100)
- Output: estimated earnings range in ₹
- CTA: "Join as a Creator"

### Task for coordinator
- Build reusable `EarningsCalculator` taking `{sliders, computeResult, accentColor}` so Brand/Creator only differ by config
- Formula/multiplier logic: **flag to Swaraj**, do not invent real financial claims — placeholder logic only until real numbers are supplied
- Live recalculation on drag, not just on release

---

## 5. FAQ Section

### Structure
- Background `canvas`, returning to light after the dark calculator section — matches Notion's pattern of alternating dark hero/feature bands with light documentation-style sections
- Each item uses `faq-accordion-item`: `canvas` background, `rounded.md` (8px), bottom border `1px solid hairline`, question in `heading-5`, answer in `body-md` text `slate`
- 5 questions per persona, separate content sets, same component
- Standard single-open accordion pattern (click to expand, others collapse) — matches Notion's understated documentation feel rather than an all-open list

### Task for coordinator
Content (5 Q&As × 2 personas) — placeholder needed from Swaraj, do not fabricate platform policy/pricing claims.

---

## 6. Open Items Requiring Swaraj's Input Before Build
- [ ] Confirm persona-accent rule: does `primary` purple survive anywhere, or do Brand/Creator accents (teal/pink) replace it entirely? (Section 1.2)
- [ ] Default persona on first load (Brand or Creator)
- [ ] Exact hero headline copy for both personas (expect trimming for 80px display size)
- [ ] Signaling Factor step copy + step count (brand + creator)
- [ ] Earnings calculator real formulas/multipliers (brand + creator)
- [ ] Slider min/max ranges for brand investment scenario
- [ ] FAQ content (5 Q&As × 2 personas = 10 total)
- [ ] Sign off on dropping the orange/black palette entirely in favor of the Notion token set above — this is a full palette replacement, not an addition

---

## 7. Component Checklist for Coordinator
- [ ] `design-tokens` file — single source for Section 1, imported everywhere, no inline hex values
- [ ] `Navbar` — sticky, rectangular container, pill-tab persona toggle
- [ ] `Hero` — dark navy band, 80px display headline, accent-word emphasis, phone-mockup stack at Elevation 3
- [ ] `ScrollCarousel` — reusable horizontal scroll-pin carousel, pastel-tint step cards
- [ ] `EarningsCalculator` — reusable dual-slider live calculator, persona-accent theming
- [ ] `FAQAccordion` — reusable single-open accordion, persona-variant content
- [ ] `BrandHome` — composes Hero + ScrollCarousel + EarningsCalculator + FAQAccordion (brand config, teal accent)
- [ ] `CreatorHome` — composes same components (creator config, pink accent)
- [ ] Persona state management (context/store) shared between Navbar and Home views, 180ms crossfade on switch
- [ ] Audit existing codebase for any remaining orange/black hardcoded values and migrate to tokens