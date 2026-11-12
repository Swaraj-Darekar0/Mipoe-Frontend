import React, { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import gsap from "gsap";
import { personaContent } from "./personaContent";
import CreatorRibbon from "./CreatorRibbon";
import { opticalScale, type HeadlineLine } from "./heroType";
import CursorStickerTrail from "./CursorStickerTrail";
import SquishyHeadline from "./SquishyHeadline";
import SlidingScribbleButton from "./SlidingScribbleButton";


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
  const sceneRef = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    
    const rootEl = rootRef.current;
    const sceneEl = sceneRef.current;

    // Fast, crisp entrance for typography and CTA without blocking hero artwork.
    const ctx = gsap.context(() => {
      gsap.from(".hero-rise", {
        y: 18,
        opacity: 0,
        duration: 0.45,
        ease: "power2.out",
        stagger: 0.05,
        clearProps: "transform,opacity",
      });

      // Desktop 3D cursor tilt on scene and mascot
      if (rootEl && sceneEl && window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
        const xTo = gsap.quickTo(sceneEl, "rotationY", { duration: 0.6, ease: "power3" });
        const yTo = gsap.quickTo(sceneEl, "rotationX", { duration: 0.6, ease: "power3" });
        const zTo = gsap.quickTo(sceneEl, "z", { duration: 0.6, ease: "power3" });

        const onMouseMove = (e: MouseEvent) => {
          const rect = rootEl.getBoundingClientRect();
          const xRel = (e.clientX - rect.left) / rect.width - 0.5; // -0.5 to 0.5
          const yRel = (e.clientY - rect.top) / rect.height - 0.5; // -0.5 to 0.5

          xTo(xRel * 12); // -6deg to +6deg
          yTo(-yRel * 10);
          zTo(20);

          // Subtle headline proximity tracking
          if (headlineRef.current) {
            const hRect = headlineRef.current.getBoundingClientRect();
            const hCenter = hRect.left + hRect.width / 2;
            const dist = Math.abs(e.clientX - hCenter);
            if (dist < 320) {
              const spread = (1 - dist / 320) * 0.02;
              headlineRef.current.style.letterSpacing = `${-0.02 + spread}em`;
            } else {
              headlineRef.current.style.letterSpacing = "-0.02em";
            }
          }
        };

        const onMouseLeave = () => {
          xTo(0);
          yTo(0);
          zTo(0);
          if (headlineRef.current) {
            headlineRef.current.style.letterSpacing = "-0.02em";
          }
        };

        rootEl.addEventListener("mousemove", onMouseMove, { passive: true });
        rootEl.addEventListener("mouseleave", onMouseLeave);

        return () => {
          rootEl.removeEventListener("mousemove", onMouseMove);
          rootEl.removeEventListener("mouseleave", onMouseLeave);
        };
      }
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
      {/* Refined Volume Cursor Sticker Trail */}
      <CursorStickerTrail containerRef={rootRef} spacing={85} />


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
          <SquishyHeadline
            lines={HEADLINE_LINES}
            lineSize={lineSize}
            containerRef={rootRef}
            highlightColor="bg-creator-pink/30"
          />
        </div>

        <p className="hero-rise mt-5 md:mt-4 font-body text-[14px] md:text-[15px] leading-[1.55] text-slate max-w-[360px]">
          {content.hero.subheadline}
        </p>

        <SlidingScribbleButton
          href={content.ctaHref}
          label={content.hero.ctaLabel}
          accentColor="#ff77cd"
          className="hero-rise mt-6 md:mt-5"
        />
      </div>

      {/* 3D Perspective Parallax Scene */}
      <div 
        ref={sceneRef}
        className="hero-scene relative w-full shrink-0 aspect-[420/500] max-h-[46svh] lg:absolute lg:inset-0 lg:aspect-auto lg:max-h-none perspective-1200 transform-style-3d will-change-transform"
      >
        <CreatorRibbon />
      </div>
    </section>
  );
};

export default HeroCreator;