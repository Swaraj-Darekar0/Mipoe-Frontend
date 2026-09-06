import React, { Suspense, useEffect, useRef } from "react";
import gsap from "gsap";
import { personaContent } from "./personaContent";
import { opticalScale, type HeadlineLine } from "./heroType";
import { mobileCardTopCss } from "./lanyardGeometry";

const Lanyard = React.lazy(() => import("./Lanyard"));

const content = personaContent.brand;

/**
 * Authored as LINES for the same reason the creator hero is: each line is sized
 * toward a shared measure so the block fuses into one mass. See `heroType`.
 *
 * The last line is the signal, not part of the sentence. It is much longer than
 * the others, and the optical sizing turns that into hierarchy for free: at 31
 * characters against the 14 above it, it lands at 45% of their size, so it reads
 * as a caption under the headline rather than a fourth shout. That is the job the
 * slanted pill used to do, and it does it inside the type block instead of
 * beside it.
 */
const HEADLINE_LINES: readonly HeadlineLine[] = [
  { text: "Stop buying ads" },
  { text: "nobody trusts." },
  { text: "Buy real reach" },
  { text: "you only pay for verified views", highlight: true },
];

/**
 * The type scale, and `charEm` is the number that matters here.
 *
 * It is the display face's average mixed-case advance, and it is what the whole
 * measure-fitting formula divides by, so it belongs to the FACE and not to
 * taste. Measured with canvas `measureText` over these exact lines: Helvetica
 * Bold runs 0.4697 to 0.5185 per character, worst case on "Stop buying ads".
 * 0.515 against a worst case of 0.5185 less the 0.02em of negative tracking
 * leaves the longest line filling ~97% of its measure: tight, with enough margin
 * that editing the copy cannot silently overflow the column and get clipped by
 * the section.
 *
 * Do not copy the creator hero's 0.5 here. That value is Abril Fatface, which
 * measures 0.456 on the same strings, and using it for Helvetica would size
 * every line ~4% too large.
 *
 * LEADING is looser than the creator hero's 0.94 because this type is stroked.
 * At 0.94 the black outlines of adjacent lines collide and the block turns into
 * a smear, which is the opposite of what the stroke is for. It has to stay in
 * step with the `leading-[1.02]` class on each line: this constant only sizes
 * the height budget, the class does the rendering.
 */
const LEADING = 1.02;
const { lineSize, h1Factor } = opticalScale(HEADLINE_LINES, {
  charEm: 0.515,
  floorPx: 30,
  capPx: 76,
  leading: LEADING,
  capVar: "--brand-line-cap",
});

/**
 * Blue fill, black outline.
 *
 * `paint-order: stroke fill` is doing real work, not decoration.
 * `-webkit-text-stroke` centres the stroke on the glyph outline, so on its own
 * half of it paints INSIDE the letterform and thins the face — the exact
 * legibility cost we switched to Helvetica to avoid. Painting the stroke first
 * puts the fill back on top, leaving a clean outline entirely outside the glyph.
 * The visible thickness is therefore about half the declared width.
 *
 * Declared in `em` so it tracks the optical sizing: the 34px caption line gets a
 * proportionally finer outline than the 76px headline, instead of one absolute
 * width that is heavy on one and invisible on the other.
 */
const STROKE: React.CSSProperties = {
  WebkitTextStroke: "0.055em var(--color-ink-deep)",
  paintOrder: "stroke fill",
};

/**
 * The vertical rhythm, and why it is a scale rather than a set of margins.
 *
 * Below md this hero is a stack with a heavy object at the bottom of it, and the
 * card hangs at a FRACTION of the viewport height rather than a fixed offset. So
 * every phone puts the card somewhere different, and fixed `mt-` values meant
 * the copy kept its own spacing while the space underneath absorbed the entire
 * difference: 233px of dead room between the CTA and the card on a 390x844
 * screen, and a near-collision on a short one.
 *
 *   card-top   where the card's top edge lands, built by `lanyardGeometry` from
 *              the same constants Lanyard scales the card with. It used to be a
 *              hardcoded 0.2344 here, which was only ever correct for one card
 *              size and silently wrong the moment the card grew.
 *   zone-src   the bottom of the band, and the ONLY thing that changes between
 *              the two layouts: the card below md, the viewport at md+ where the
 *              card has moved beside the copy. It is set in classes rather than
 *              here because an inline custom property beats any `md:` rule
 *              regardless of the media query, so a cap computed inline could
 *              never be released by one. Switching the INPUT works; switching
 *              the result does not.
 *   copy-zone  the band the copy owns: everything between the navbar and
 *              `--zone-src`, less the gap. The copy layer is given exactly this
 *              height and centres inside it, so the room above and below the
 *              copy is always equal and the clearance to the card is structural
 *              rather than hoped for.
 *   step       one unit of vertical rhythm, scaling with viewport HEIGHT. Every
 *              gap in the stack is a multiple of it, so a short phone tightens
 *              the whole stack proportionally instead of tightening whichever
 *              gap happened to be largest.
 *   line-cap   what is left for the headline once the fixed rows are paid for,
 *              derived from h1Factor so editing HEADLINE_LINES cannot silently
 *              invalidate the budget.
 *
 * `--copy-fixed` is the CTA row plus the two steps above it. It errs high on
 * purpose: erring high costs headline size, erring low costs correctness.
 */
const COPY_RHYTHM = {
  // Matches the creator hero: the nav is a fixed pill that reserves no layout
  // height, so its 60px lower edge has to be paid for here.
  "--nav-clear": "68px",
  "--step": "clamp(9px, 1.6svh, 18px)",
  "--hero-gap": "clamp(28px, 6svh, 72px)",
  "--card-top": mobileCardTopCss(),
  "--copy-zone": "max(210px, calc(var(--zone-src) - var(--nav-clear) - var(--hero-gap)))",
  "--copy-fixed": "calc(48px + 2 * var(--step))",
  "--brand-line-cap": `calc((var(--copy-zone) - var(--copy-fixed)) / ${h1Factor.toFixed(3)})`,
} as React.CSSProperties;

const HeroBrand: React.FC = () => {
  const rootRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    // Scoped to this section and reverted on unmount, so the persona crossfade
    // can't leave orphaned tweens behind. `clearProps` hands styling back to
    // the stylesheet once the entrance finishes.
    const ctx = gsap.context(() => {
      gsap.from(".hero-rise", {
        y: 24,
        opacity: 0,
        duration: 0.85,
        ease: "power3.out",
        stagger: 0.1,
        clearProps: "transform,opacity",
      });
    }, rootRef);
    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={rootRef}
      id="hero"
      // Both `--zone-src` values are classes, never inline: see COPY_RHYTHM for
      // why the switch has to happen on the budget's input rather than on the
      // cap it produces.
      className="relative w-full h-[100svh] min-h-[640px] bg-canvas overflow-hidden [--zone-src:var(--card-top)] md:[--zone-src:100svh]"
      style={COPY_RHYTHM}
    >
      {/* Full-bleed lanyard layer. It spans the entire hero rather than sitting
          in its own half-width box, so the strap and card can swing across the
          full width, including over the copy on the left, without ever hitting a
          container edge and getting clipped mid-component.
          The canvas is FLUSH with the section, and that is load-bearing. The
          navbar is a fixed pill portalled out of the page, so it reserves no
          layout height and this section starts at the very top of the viewport,
          which means this canvas's top edge and the top of the display are the
          same line. Lanyard parks the strap's anchor just outside that edge, so
          the strap is cut by the top of the screen and reads as hanging from it.
          The nudge right is `md:` only: on mobile the lanyard must hang from the
          centre, and an unprefixed shift pushed it off-centre there. */}
      <div className="absolute inset-0 z-0 md:translate-x-20">
        <Suspense fallback={null}>
          <Lanyard />
        </Suspense>
      </div>

      {/* Copy layer. Transparent to the pointer so the strap stays visible
          running behind it and the canvas stays draggable across the whole hero;
          only the CTA takes clicks back.
          Below md it is given the measured band between the navbar and the card
          and centres inside it. At md+ the card is beside the copy rather than
          under it, so the layer just fills the section and centres in that. */}
      <div className="absolute inset-x-0 top-[var(--nav-clear)] h-[var(--copy-zone)] md:top-0 md:h-full z-10 pointer-events-none flex items-center">
        <div className="w-full max-w-7xl mx-auto px-5 md:px-8">
          <div className="w-full md:w-1/2 flex flex-col items-center text-center md:items-start md:text-left">
            {/* `container-type: inline-size` is what makes the `cqw` inside
                lineSize resolve against this box rather than the viewport. */}
            <div
              className="w-full max-w-[520px] md:max-w-none"
              style={{ containerType: "inline-size" }}
            >
              {/* Helvetica Bold, not the creator hero's Abril Fatface. A fat
                  didone is a poster face: it carries mass at 76px and turns to
                  mush at the caption line's 34px, and its thin-to-thick
                  modulation fights the outline stroke. Helvetica holds an even
                  weight at every size in the block, which is the whole point of
                  the switch.
                  700 rather than a heavier weight on purpose: Arial Black is a
                  separate FAMILY, not a weight of Arial, so `font-weight: 900`
                  on this stack gets synthesised smearing on Windows instead of a
                  real face. 700 is the heaviest weight that is genuinely present
                  everywhere the stack resolves. */}
              <h1 className="hero-rise font-helvetica font-bold text-brand-blue tracking-[-0.02em]">
                {HEADLINE_LINES.map((line, i) => (
                  <span
                    key={i}
                    // The stroke lives on the LINE, not on the h1: it is declared
                    // in `em`, and on the h1 those em would resolve against the
                    // inherited 16px instead of each line's own size, collapsing
                    // to a hairline.
                    className="block leading-[1.02]"
                    style={{ fontSize: lineSize(i), ...STROKE }}
                  >
                    {line.highlight ? (
                      // The tilt is the reference's slanted container, kept now
                      // that the line has moved inside the headline. It is safe
                      // here where it would not be on `.hero-rise`: the entrance
                      // tween writes an inline transform to the h1 and strips it
                      // again, which would have overridden a rotation for the
                      // length of the tween and then snapped it in.
                      <span className="relative inline-block -rotate-[1.2deg]">
                        {/* The band is an absolute layer rather than padding. As
                            padding the overhang lands in layout, so the line
                            measures wider and sizes itself DOWN to fit, and the
                            emphasised line comes out SMALLER than its
                            neighbours: the opposite of the intent. As a layer it
                            bleeds past the measure for free. */}
                        <span
                          className="absolute -left-[0.42em] -right-[0.42em] top-[0.06em] bottom-[0.08em] bg-highlight"
                          aria-hidden="true"
                        >
                          {/* Selection-handle dot at the leading corner, solid
                              ink rather than a tint: it reads as a control on
                              the band, so it has to be denser than the band. */}
                          <span className="absolute left-0 top-0 h-[0.3em] w-[0.3em] -translate-x-1/2 -translate-y-1/2 rounded-full bg-ink-deep" />
                        </span>
                        <span className="relative">{line.text}</span>
                      </span>
                    ) : (
                      line.text
                    )}
                  </span>
                ))}
              </h1>
            </div>

            {/* TWO cascade workarounds here, both fighting global rules rather
                than expressing a preference. Neither should be "tidied".

                `border-[#1a1a1a]` instead of `border-ink-deep`: index.css
                carries a bare `* { @apply border-border }` which beats named
                border-colour utilities, so `border-ink-deep` silently renders as
                the default grey. Arbitrary values win. The creator hero's CTA is
                written the same way for the same reason.

                `text-canvas!` instead of `text-canvas`: something injects an
                UNLAYERED `a { color: inherit }` (Tailwind's own preflight copy
                is correctly inside `@layer base`; this second one is in no layer
                at all, and unlayered rules outrank every layered utility). So
                colour utilities do not work on ANY anchor in this app, and
                without the important flag this white label rendered as inherited
                near-black on a blue fill: 2.6:1, unreadable. Worth fixing at the
                source, at which point the flag can come off.

                The outline matches the stroke on the headline, so the CTA reads
                as the same drawn object rather than a UI control that wandered
                in from another page. */}
            <a
              href={content.ctaHref}
              className="hero-rise pointer-events-auto mt-[calc(2*var(--step))] inline-flex items-center justify-center rounded-[10px] border-[1.5px] border-[#1a1a1a] bg-brand-blue text-canvas! font-body font-semibold text-[14px] md:text-[15px] px-5 py-2.5 md:px-6 md:py-3 hover:bg-[#2450c9] active:scale-[0.98] transition-all duration-200 ease-[cubic-bezier(0.32,0.72,0,1)]"
            >
              {content.hero.ctaLabel}
            </a>

            {/* Two things are deliberately NOT rendered here.
                `content.hero.subheadline`, because the highlighted caption line
                carries the one thing it was landing ("pay only when results
                hit") in five words instead of thirteen. And the slanted pill
                that used to sit here, because its copy is now the headline's
                last line: keeping both put the same sentence on screen twice.
                The subheadline stays in personaContent because the calculator
                and FAQ copy still read against it. */}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroBrand;
