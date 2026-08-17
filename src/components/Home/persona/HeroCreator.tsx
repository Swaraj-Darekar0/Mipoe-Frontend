import React, { useEffect, useRef } from "react";
import gsap from "gsap";
import { personaContent } from "./personaContent";
import CreatorRibbon from "./CreatorRibbon";
import { SerifTag } from "./hero_Creator_comp/Stickers";

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
const HEADLINE_LINES: readonly { text: string; highlight?: boolean }[] = [
  { text: "Your content already" },
  { text: "has an audience." },
  { text: "Get paid for it.", highlight: true },
];

/**
 * Optical line sizing. Each line is sized toward a common measure — longer line,
 * smaller type — so the lines fuse into one block instead of reading as centred
 * text with a ragged edge.
 *
 * Container units, not `vw`, and the swap is a bug fix rather than a
 * refactor. The block's width is capped by `max-w`, so beyond that cap a
 * vw-based size keeps growing while the box it is meant to be filling stops —
 * on a wide monitor the old formula sized the type past its own wrapper. `cqw`
 * measures the thing the type is actually being fitted to, which also means the
 * relationship holds at every width with no resize listener and no breakpoints.
 *
 * The formula is just `len × CHAR_EM × size = 100cqw` solved for size, where
 * CHAR_EM is Abril Fatface's average mixed-case advance.
 *
 * The old ceiling was 54px, which was most of why the block never read as the
 * reference's mass: at 54px this is merely a large heading. The px floor stays
 * because the face clogs below ~30px — counters fill in, the hairline serifs
 * vanish — so on a phone the optical variation is deliberately given up to keep
 * it legible.
 */
const CHAR_EM = 0.5;
const CAP_PX = 84;
const LEADING = 0.94;

/**
 * Per-line sizes are a RATIO against the largest line, and one shared driver
 * carries the clamp. Clamping each line independently looks equivalent and is
 * not: as soon as the cap binds, every line lands on the cap, all three come out
 * the same size, and the block collapses back into ragged centred text — the
 * exact look the optical sizing exists to avoid. Scaling proportionally keeps
 * every line on the same measure whether the driver is the container width, the
 * height budget, or the hard ceiling.
 */
const LINE_CQW = HEADLINE_LINES.map((l) => 100 / (CHAR_EM * l.text.length));
const MAX_CQW = Math.max(...LINE_CQW);
/** Height of the whole h1 as a multiple of the driver size. Feeds the budget. */
const H1_FACTOR = LINE_CQW.reduce((sum, c) => sum + c / MAX_CQW, 0) * LEADING;
/** The floor applies to the driver, so the shortest line stays above ~27px. */
const lineSize = (i: number) =>
  `calc(${(LINE_CQW[i] / MAX_CQW).toFixed(4)} * clamp(34px, min(${MAX_CQW.toFixed(
    2
  )}cqw, var(--hero-line-cap)), ${CAP_PX}px))`;

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
 *              divided by H1_FACTOR (the h1's height per unit of driver size).
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
  "--hero-h": "max(calc(100svh - 3.5rem), 660px)",
  "--illo-top": "max(calc(var(--hero-h) - 0.2625 * 100vw), calc(0.4569 * var(--hero-h)))",
  "--hero-gap": "clamp(28px, 4svh, 56px)",
  // Headroom at the TOP of the zone, and it is not decorative. The navbar is a
  // floating pill whose lower edge sits a few px BELOW the section's top, so a
  // zone starting at top:0 puts the first headline line under the nav. The green
  // serif tag then hangs above the headline again on top of that. Reserving the
  // space here rather than as padding keeps it inside the budget below.
  // The 40px floor is measured, not guessed: the nav pill's lower edge lands
  // 16px inside the section, and the green tag hangs ~10px above the headline on
  // a short window, so a 32px floor left only 8px of daylight. 40 gives ~14.
  "--copy-top": "clamp(40px, 5svh, 56px)",
  // Below lg the scene is a sized block UNDER the copy rather than a layer
  // behind it, so the room left for copy is whatever the block does not take.
  // 1.1905 is the aspect-[420/500] the scene box is given, and 46svh its cap —
  // keep these two in step with the scene div's classes.
  "--flow-zone": "calc(var(--hero-h) - min(1.1905 * 100vw, 46svh) - var(--hero-gap))",
  // Whichever layout is active, the smaller budget is the safe one to size the
  // headline against, so one expression covers both without a breakpoint.
  "--copy-zone":
    "max(210px, min(calc(var(--illo-top) - var(--copy-top) - var(--hero-gap)), var(--flow-zone)))",
  "--copy-fixed": "128px",
  // Derived from the headline itself rather than hardcoded, so editing
  // HEADLINE_LINES cannot silently invalidate the budget.
  "--hero-line-cap": `calc((var(--copy-zone) - var(--copy-fixed)) / ${H1_FACTOR.toFixed(3)})`,
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
      className="relative w-full h-[calc(100svh-3.5rem)] min-h-[660px] bg-canvas overflow-hidden flex flex-col lg:block"
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