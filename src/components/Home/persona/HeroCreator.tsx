import React, { useEffect, useRef } from "react";
import gsap from "gsap";
import { personaContent } from "./personaContent";
import CreatorRibbon from "./CreatorRibbon";
import { opticalScale, type HeadlineLine } from "./heroType";


const content = personaContent.creator;

/**
 * The headline is authored as LINES, not as inline segments, and that is a
 * requirement of the reference's typography rather than a convenience.
 *
 * In the reference every line is set at its own size so that all of them come
 * out to roughly the same measure — "the" is small, "community" is enormous —
 * which is what makes the block read as one mass instead of as centred text
 * with a ragged edge. You cannot do that with a single font-size and inline
 * spans; each line has to be its own element with its own size.
 *
 * This belongs in personaContent once the shape settles. Left here so the
 * relationship between the copy and the sizing rule stays visible.
 */
const HEADLINE_LINES: readonly HeadlineLine[] = [
  { text: "Your content already" },
  { text: "has an audience." },
  { text: "Get paid for it.", highlight: true },
];

/**
 * The headline's type scale. The MECHANISM lives in `heroType` — both personas
 * size their headline the same way — so what stays here is only the tuning
 * specific to this hero.
 *
 * The 84px ceiling is the point of it. The old ceiling was 54px, which was most
 * of why the block never read as the reference's mass: at 54px this is merely a
 * large heading rather than a wall of type. The 34px floor applies to the
 * driver, so the shortest line stays above ~27px.
 *
 * `--hero-line-cap` is a second ceiling, and a HEIGHT one rather than a width
 * one: see the clearance contract below for how the illustration hands the copy
 * its remaining room. The lower of the two wins, so the headline runs at its
 * full 84px wherever there is space and stands down on a short laptop instead
 * of ploughing through the character.
 */
const LEADING = 0.94;
const { lineSize, h1Factor } = opticalScale(HEADLINE_LINES, {
  charEm: 0.5,
  floorPx: 34,
  capPx: 84,
  leading: LEADING,
  capVar: "--hero-line-cap",
});

/**
 * The clearance contract between the copy and the illustration.
 *
 * The collision this fixes was never a spacing typo — it is geometry. The scene
 * renders with `preserveAspectRatio="xMidYMax meet"` over a 1200x580 viewBox, so
 * it scales by `min(W/1200, H/580)` and is pinned to the section's BOTTOM. On a
 * wide, short window the scale is WIDTH-limited, which means the character's
 * head climbs as the window gets wider and drops as the window gets taller.
 * Measured: at 1335x643 her hair topped out 310px into the section while the
 * copy needed 395px, so it overlapped by ~133px; at 1440x900 the same copy had
 * 39-317px to spare. A hardcoded padding cannot satisfy both.
 *
 * So the copy asks the scene where it starts, and sizes itself to fit:
 *
 *   illo-top   where the character's head lands, from the scale rule above.
 *              315 is her hair's distance from the viewBox bottom, measured off
 *              a render rather than derived — the asset has transparent padding,
 *              so the value in CreatorRibbon's `character` block is not it.
 *   copy-zone  the box the copy is allowed to occupy, i.e. everything above her
 *              minus the gap. The copy layer is given exactly this height and
 *              centres inside it, so the gap is structural: the copy cannot
 *              reach the illustration because its container stops short of it.
 *   line-cap   what is left for the headline once the fixed rows are paid for,
 *              divided by h1Factor (the h1's height per unit of driver size).
 *              This is what lets the headline stay at its full 84px wherever
 *              there is room and stand down on a short laptop instead of
 *              ploughing through her.
 *
 * COUPLING: 0.2625 and 0.4569 both encode that 315 against the 1200x580 viewBox.
 * If CreatorRibbon's DESKTOP scene changes its viewBox or moves the character,
 * re-measure and update them together. `--copy-fixed` is the subhead and CTA
 * rows including their margins; it is only a budgeting estimate, and erring high
 * costs headline size rather than correctness.
 */
const SCENE_CLEARANCE = {
  // The navbar reserves no layout height any more: it is a `fixed` pill
  // portalled out of the page content, so the hero owns the whole viewport and
  // the nav OVERLAYS its top strip rather than sitting above it. That strip has
  // to be paid for explicitly, and it is paid for here — as a token feeding the
  // budget below — rather than bolted on as padding the budget cannot see.
  // Measured, not guessed: the pill hangs 12px from the top (`top-3`) and is
  // 48px tall at md+, so its lower edge lands 60px into the section. 68 leaves
  // 8px of daylight under it.
  "--nav-clear": "68px",
  "--hero-h": "max(100svh, 660px)",
  "--illo-top": "max(calc(var(--hero-h) - 0.2625 * 100vw), calc(0.4569 * var(--hero-h)))",
  "--hero-gap": "clamp(28px, 4svh, 56px)",
  // Headroom at the TOP of the zone, and it is not decorative: a zone starting
  // at top:0 puts the first headline line under the nav pill. The floor is
  // therefore written as the nav clearance plus 16 of daylight, so the
  // relationship survives the pill being resized — change the pill and only
  // `--nav-clear` needs re-measuring.
  // The 16 is also the room the sticker layer wants: `.hero-sticker` elements
  // hang OUTWARD off the headline wrapper, so anything that lands above the
  // first line needs somewhere to go that is not the nav.
  "--copy-top": "clamp(calc(var(--nav-clear) + 16px), 9svh, 104px)",
  // Below lg the scene is a sized block UNDER the copy rather than a layer
  // behind it, so the room left for copy is whatever the block does not take —
  // less the nav strip, which down here is real padding on the section rather
  // than an offset on an absolute layer.
  // 1.1905 is the aspect-[420/500] the scene box is given, and 46svh its cap —
  // keep these two in step with the scene div's classes.
  "--flow-zone":
    "calc(var(--hero-h) - var(--nav-clear) - min(1.1905 * 100vw, 46svh) - var(--hero-gap))",
  // Whichever layout is active, the smaller budget is the safe one to size the
  // headline against, so one expression covers both without a breakpoint.
  "--copy-zone":
    "max(210px, min(calc(var(--illo-top) - var(--copy-top) - var(--hero-gap)), var(--flow-zone)))",
  "--copy-fixed": "128px",
  // Derived from the headline itself rather than hardcoded, so editing
  // HEADLINE_LINES cannot silently invalidate the budget.
  "--hero-line-cap": `calc((var(--copy-zone) - var(--copy-fixed)) / ${h1Factor.toFixed(3)})`,
} as React.CSSProperties;

const HeroCreator: React.FC = () => {
  const rootRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    // Matches HeroBrand's entrance so switching persona feels like one system.
    // Scoped + reverted so the crossfade can't leave orphaned tweens behind.
    const ctx = gsap.context(() => {
      gsap.from(".hero-rise", {
        y: 24,
        opacity: 0,
        duration: 0.85,
        ease: "power3.out",
        stagger: 0.1,
        clearProps: "transform,opacity",
      });
      // Full-bleed, so it fades rather than rises — sliding a layer that reaches
      // all four edges just reads as the page shifting.
      gsap.from(".hero-scene", {
        opacity: 0,
        duration: 1.1,
        delay: 0.25,
        ease: "power2.out",
        clearProps: "opacity",
      });
      // Stickers land last and land hard: they should read as being placed on
      // top after the fact, not as part of the same rise as the type.
      gsap.from(".hero-sticker", {
        scale: 0.4,
        opacity: 0,
        duration: 0.5,
        delay: 0.55,
        stagger: 0.07,
        ease: "back.out(2.4)",
        clearProps: "scale,opacity",
      });
    }, rootRef);
    return () => ctx.revert();
  }, []);

  return (
    // Two layouts, one component. At lg+ the scene is a full-bleed layer with the
    // copy floated over it, which is what lets the loop rise beside the headline.
    // Below that the arrangement breaks: the scene's height is capped by the
    // viewport WIDTH — it scales to fit, and portrait is always width-constrained
    // — so every pixel of extra height lands in one lump between the copy and the
    // illustration. On a 932pt device that lump was 265px. Narrow viewports
    // therefore go back to normal flow; see the two children below.
    <section
      ref={rootRef}
      id="hero"
      // The flow/overlay switch is at lg, NOT md, and that is deliberate:
      // CreatorRibbon swaps its DESKTOP scene for the COMPACT one at exactly
      // 1024px. Switching the copy to an overlay at md meant that between 768
      // and 1023 the copy floated over a scene laid out to different geometry,
      // which is why the CTA landed on the character there. Layout mode and
      // scene mode now change on the same line.
      // `pt` is the nav strip, and only below lg: down here the copy is in
      // normal flow, so the clearance has to be real space. At lg+ the copy is
      // an absolute layer offset by `--copy-top` instead, so the padding is
      // dropped and `inset-0` on the scene still means the whole section.
      className="relative w-full h-[100svh] min-h-[660px] bg-canvas overflow-hidden flex flex-col pt-[var(--nav-clear)] lg:block lg:pt-0"
      style={SCENE_CLEARANCE}
    >


      {/* Copy first in the DOM so the sub-lg column stacks copy-then-scene.
          Below lg `flex-1 justify-center` splits the leftover height above and
          below the copy instead of dumping it all in one gap underneath.
          Transparent to the pointer so the ribbon keeps the full hero as its
          canvas; only the CTA takes clicks back.

          At lg+ this is not pinned to the top with a fixed padding and left to
          fall where it may. It is inset by `--copy-top` and given exactly
          `--copy-zone` of height — the space between the nav and the character's
          head — then centres inside it. Both clearances are therefore properties
          of the box: the copy cannot reach the illustration or slide under the
          nav, because its container stops short of both. */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 md:px-8 flex flex-1 flex-col items-center justify-center text-center pointer-events-none lg:absolute lg:inset-x-0 lg:top-[var(--copy-top)] lg:h-[var(--copy-zone)] lg:flex-none">
        {/* Stickers hang off this wrapper, not off the section, so they track
            the headline as it reflows instead of drifting across it at
            intermediate widths. */}
        {/* `container-type: inline-size` is what makes `cqw` in lineSize resolve
            against this box. The max-widths are deliberately kept a good margin
            inside the padded page container: the stickers hang outward off this
            wrapper, and the section clips, so the slack either side IS the room
            the stickers live in. Widen these and the outer stickers get cut off
            — which is exactly what was happening at md. */}
        <div
          className="relative w-full max-w-[520px] md:max-w-[560px] lg:max-w-[700px]"
          style={{ containerType: "inline-size" }}
        >
          {/* `font-normal` is load-bearing, not a default: Abril Fatface ships a
              single weight, so any bold here is the browser smearing the face
              synthetically. It is already as fat as it gets. */}
          <h1 className="hero-rise font-fat font-normal text-ink tracking-[-0.012em]">
            {HEADLINE_LINES.map((line, i) => (
              // Leading BELOW 1. The reference sets its lines close enough that
              // descenders graze the line below, which is what fuses them into
              // one mass. Fat faces need this — at normal leading the huge stems
              // drift apart and the block falls back into being three sentences.
              <span
                key={i}
                className="block leading-[0.94]"
                style={{ fontSize: lineSize(i) }}
              >
                {line.highlight ? (
                  <span className="relative inline-block">
                    {/* The band is an absolute layer rather than padding, and
                        that is the fix for it. In the reference the block runs
                        well past the words on both sides; expressed as padding
                        that overhang lands in layout, so the line measures wider
                        and has to size itself DOWN to fit — the emphasised line
                        came out smaller than its neighbours, the opposite of the
                        intent. As a layer it bleeds past the measure for free
                        and the type keeps its size. */}
                    <span
                      className="absolute -left-[0.42em] -right-[0.42em] top-[0.06em] bottom-[0.08em] bg-creator-pink/45"
                      aria-hidden="true"
                    >
                      {/* Selection-handle dot at the leading corner. Solid, not
                          tinted — in the reference it reads as a control on the
                          band, so it has to be denser than the band itself. */}
                      <span className="absolute left-0 top-0 h-[0.3em] w-[0.3em] -translate-x-1/2 -translate-y-1/2 rounded-full bg-creator-pink" />
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

        <p className="hero-rise mt-5 md:mt-4 font-body text-[14px] md:text-[15px] leading-[1.55] text-slate max-w-[360px]">
          {content.hero.subheadline}
        </p>

        <a
          href={content.ctaHref}
          className="hero-rise pointer-events-auto mt-6 md:mt-5 inline-flex items-center justify-center rounded-[10px] border-[1.5px] border-[#241638] bg-[#caa6ec] text-ink-deep font-body font-medium text-[14px] px-5 py-2.5 hover:bg-[#bd93e7] active:scale-[0.98] transition-all duration-200 ease-[cubic-bezier(0.32,0.72,0,1)]"
        >
          {content.hero.ctaLabel}
        </a>

        {/* `content.hero.ctaFootnote` is deliberately NOT rendered. A small
            tagline under the CTA is a fifth text element in a hero that already
            carries headline, subhead and CTA, and it was spending ~30px of
            vertical room at exactly the point where the copy meets the
            character. The value it carried is already in the subheadline. Left
            in personaContent so other personas can still use it. */}
      </div>

      {/* `aspect` gives the scene its natural height; `max-h` stops it eating
          the copy's room on a short phone, where it letterboxes horizontally
          instead. Both are dropped on md+, where it goes full-bleed. */}
      <div className="hero-scene relative w-full shrink-0 aspect-[420/500] max-h-[46svh] lg:absolute lg:inset-0 lg:aspect-auto lg:max-h-none">
        <CreatorRibbon />
      </div>
    </section>
  );
};

export default HeroCreator;