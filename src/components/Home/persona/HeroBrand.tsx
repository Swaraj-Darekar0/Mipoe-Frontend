import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import gsap from "gsap";
import { personaContent } from "./personaContent";
import { opticalScale, type HeadlineLine } from "./heroType";
import BrandRibbon from "./BrandRibbon";
import { usePersona } from "./PersonaContext";
import HeroCursorVideo from "./HeroCursorVideo";
import SquishyHeadline from "./SquishyHeadline";
import SlidingScribbleButton from "./SlidingScribbleButton";

const content = personaContent.brand;

const HEADLINE_LINES: readonly HeadlineLine[] = [
  { text: "Stop burning ad spend" },
  { text: "on zero-trust ads." },
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
  const sceneRef = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const {
    brandMode,
    toggleBrandMode,
    hasInteractedBrandPill,
    setHasInteractedBrandPill,
  } = usePersona();

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const rootEl = rootRef.current;
    const sceneEl = sceneRef.current;

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
          const xRel = (e.clientX - rect.left) / rect.width - 0.5;
          const yRel = (e.clientY - rect.top) / rect.height - 0.5;

          xTo(xRel * 12);
          yTo(-yRel * 10);
          zTo(20);

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
    <section
      ref={rootRef}
      id="hero"
      className="relative w-full h-[100svh] min-h-[660px] bg-canvas overflow-hidden flex flex-col pt-[var(--nav-clear)] lg:block lg:pt-0"
      style={SCENE_CLEARANCE}
    >
      {/* Floating Video Cursor Follower (Desktop only: hidden lg:block to eliminate hover animations on mobile) */}
      <div className="hidden lg:block pointer-events-none">
        <HeroCursorVideo containerRef={rootRef} />
      </div>
      {/* Brand Hero Copy Layer (z-30 ensures heading text and CTA buttons sit strictly in front of video) */}
      <div className="relative z-30 w-full max-w-7xl mx-auto px-6 md:px-8 flex flex-1 flex-col items-center justify-center text-center pointer-events-none lg:absolute lg:inset-x-0 lg:top-[var(--copy-top)] lg:h-[var(--copy-zone)] lg:flex-none">
        <div
          className="relative w-full max-w-[480px] md:max-w-[520px] lg:max-w-[600px]"
          style={{ containerType: "inline-size" }}
        >
          <SquishyHeadline
            lines={HEADLINE_LINES}
            lineSize={lineSize}
            containerRef={rootRef}
            highlightColor="bg-orange-500/25"
          />
        </div>

        <p className="hero-rise mt-4 md:mt-3.5 font-body text-[14px] md:text-[15px] leading-[1.5] text-slate max-w-[360px]">
          {content.hero.subheadline}
        </p>

        <SlidingScribbleButton
          href={content.ctaHref}
          label={content.hero.ctaLabel}
          accentColor="#ff5f04"
          className="hero-rise mt-5 md:mt-4 pointer-events-auto"
        />
      </div>

      {/* Brand Ribbon Scene with 3D Perspective Parallax (z-20 ensures mascot character sits in front of cursor video) */}
      <div 
        ref={sceneRef}
        className="hero-scene relative z-20 w-full shrink-0 aspect-[420/500] max-h-[46svh] lg:absolute lg:inset-0 lg:aspect-auto lg:max-h-none perspective-1200 transform-style-3d will-change-transform"
      >
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
