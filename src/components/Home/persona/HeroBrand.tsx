import React, { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { personaContent } from "./personaContent";
import { opticalScale, type HeadlineLine } from "./heroType";
import BrandRibbon from "./BrandRibbon";
import { usePersona } from "./PersonaContext";

const content = personaContent.brand;

const HEADLINE_LINES: readonly HeadlineLine[] = [
  { text: "Your budget" },
  { text: "shouldn't gamble." },
  { text: "Buy verified reach.", highlight: true },
];

const LEADING = 0.94;
const { lineSize, h1Factor } = opticalScale(HEADLINE_LINES, {
  charEm: 0.5,
  floorPx: 28,
  capPx: 72,
  leading: LEADING,
  capVar: "--brand-line-cap",
});

const SCENE_CLEARANCE = {
  "--nav-clear": "68px",
  "--hero-h": "max(100svh, 660px)",
  // Mascot character head lands around y=262 (out of 580). 580 - 262 = 318, 318 / 1200 = 0.265.
  "--illo-top": "max(calc(var(--hero-h) - 0.265 * 100vw), calc(0.4517 * var(--hero-h)))",
  "--hero-gap": "clamp(20px, 3svh, 40px)",
  "--copy-top": "clamp(calc(var(--nav-clear) + 12px), 7svh, 88px)",
  "--flow-zone":
    "calc(var(--hero-h) - var(--nav-clear) - min(1.19 * 100vw, 46svh) - var(--hero-gap))",
  "--copy-zone":
    "max(180px, min(calc(var(--illo-top) - var(--copy-top) - var(--hero-gap)), var(--flow-zone)))",
  "--copy-fixed": "112px",
  "--brand-line-cap": `calc((var(--copy-zone) - var(--copy-fixed)) / ${h1Factor.toFixed(3)})`,
} as React.CSSProperties;

const HeroBrand: React.FC = () => {
  const rootRef = useRef<HTMLElement>(null);
  const {
    brandMode,
    toggleBrandMode,
    hasInteractedBrandPill,
    setHasInteractedBrandPill,
  } = usePersona();

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = gsap.context(() => {
      gsap.from(".hero-rise", {
        y: 24,
        opacity: 0,
        duration: 0.85,
        ease: "power3.out",
        stagger: 0.1,
        clearProps: "transform,opacity",
      });
      gsap.from(".hero-scene", {
        opacity: 0,
        duration: 1.1,
        delay: 0.2,
        ease: "power2.out",
        clearProps: "opacity",
      });
    }, rootRef);
    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={rootRef}
      id="hero"
      className="relative w-full h-[100svh] min-h-[660px] bg-canvas overflow-hidden flex flex-col pt-[var(--nav-clear)] lg:block lg:pt-0"
      style={SCENE_CLEARANCE}
    >
      {/* Brand Hero Copy Layer */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 md:px-8 flex flex-1 flex-col items-center justify-center text-center pointer-events-none lg:absolute lg:inset-x-0 lg:top-[var(--copy-top)] lg:h-[var(--copy-zone)] lg:flex-none">
        <div
          className="relative w-full max-w-[480px] md:max-w-[520px] lg:max-w-[600px]"
          style={{ containerType: "inline-size" }}
        >
          <h1 className="hero-rise font-fat font-normal text-ink tracking-[-0.012em]">
            {HEADLINE_LINES.map((line, i) => (
              <span
                key={i}
                className="block leading-[0.94]"
                style={{ fontSize: lineSize(i) }}
              >
                {line.highlight ? (
                  <span className="relative inline-block">
                    {/* Orange highlight band for Brand persona */}
                    <span
                      className="absolute -left-[0.42em] -right-[0.42em] top-[0.06em] bottom-[0.08em] bg-orange-500/30"
                      aria-hidden="true"
                    >
                      <span className="absolute left-0 top-0 h-[0.3em] w-[0.3em] -translate-x-1/2 -translate-y-1/2 rounded-full bg-orange-500" />
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

        <p className="hero-rise mt-4 md:mt-3.5 font-body text-[14px] md:text-[15px] leading-[1.5] text-slate max-w-[360px]">
          {content.hero.subheadline}
        </p>

        <a
          href={content.ctaHref}
          className="hero-rise pointer-events-auto mt-5 md:mt-4 inline-flex items-center justify-center rounded-[10px] border-[1.5px] border-[#100d0c] bg-[#f97316] text-[#100d0c] font-body font-bold text-[14px] px-6 py-2.5 shadow-[0_4px_14px_rgba(249,115,22,0.3)] hover:bg-[#ea580c] active:scale-[0.98] transition-all duration-200 ease-[cubic-bezier(0.32,0.72,0,1)]"
        >
          {content.hero.ctaLabel}
        </a>
      </div>

      {/* Brand Ribbon Scene (Replaces Lanyard). Continuous right->left looping ribbon with interactive pill */}
      <div className="hero-scene relative w-full shrink-0 aspect-[420/500] max-h-[46svh] lg:absolute lg:inset-0 lg:aspect-auto lg:max-h-none">
        <BrandRibbon
          mode={brandMode}
          onToggleMode={toggleBrandMode}
          hasInteractedPill={hasInteractedBrandPill}
          onPillInteraction={() => setHasInteractedBrandPill(true)}
        />
      </div>
    </section>
  );
};

export default HeroBrand;
