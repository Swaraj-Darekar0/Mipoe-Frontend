import React, { Suspense, useEffect, useRef } from "react";
import gsap from "gsap";
import { personaContent } from "./personaContent";

const Lanyard = React.lazy(() => import("./Lanyard"));

const content = personaContent.brand;

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
    <section ref={rootRef} id="hero" className="relative w-full min-h-screen bg-canvas overflow-hidden">
      {/* Full-bleed lanyard layer. It spans the entire hero rather than sitting
          in its own half-width box, so the strap and card can swing across the
          full width — including over the copy on the left — without ever
          hitting a container edge and getting clipped mid-component.
          The canvas extends slightly ABOVE the section so its top edge lands
          *behind* the floating navbar. Lanyard pins the strap's anchor to the
          canvas top edge, so the strap always originates from behind the navbar
          with no gap — the offset only needs to be big enough that the top edge
          clears the navbar, not tuned per screen size.
          It is deliberately small: the navbar floats with a 16px gap above it,
          so pushing the canvas much higher would expose the strap in that
          transparent strip above the navbar.
          The nudge right is `md:` only — on mobile the lanyard must hang from
          the centre, and an unprefixed shift pushed it off-centre there. */}
      <div className="absolute -top-8 inset-x-0 bottom-0 z-0 md:translate-x-20">
        <Suspense fallback={null}>
          <Lanyard />
        </Suspense>
      </div>

      {/* Copy layer sits above the canvas but stays fully transparent, so the
          strap remains visible running behind it across the whole width.
          `pointer-events-none` keeps the canvas draggable everywhere; only the
          CTA re-enables pointer events. */}
      <div className="relative z-10 pointer-events-none w-full max-w-7xl mx-auto px-6 md:px-8 py-16 md:py-0 min-h-screen flex flex-col md:flex-row items-center gap-10 md:gap-8">
        <div className="w-full md:w-1/2 flex flex-col items-center md:items-start text-center md:text-left">

          {/* 30px on the smallest screens keeps this headline to 3 lines. At
              36px it wrapped to 4, which is a font-size error rather than a
              copy-length one — the hero should read in one glance. */}
          <h1 className="hero-rise font-semibold text-[30px] sm:text-[42px] lg:text-[60px] leading-[1.08] tracking-[-1.5px] text-ink">
            {content.hero.headline.map((segment, i) =>
              segment.emphasis ? (
                <span key={i} className="text-brand-teal">
                  {segment.text}
                </span>
              ) : (
                <React.Fragment key={i}>{segment.text}</React.Fragment>
              )
            )}
          </h1>

          <p className="hero-rise mt-6 text-[16px] md:text-[18px] leading-[1.5] text-slate max-w-[480px]">
            {content.hero.subheadline}
          </p>

          <a
            href={content.ctaHref}
            className="hero-rise pointer-events-auto mt-8 inline-flex items-center justify-center rounded-[8px] bg-brand-teal text-white font-medium text-[14px] px-6 py-3 hover:opacity-90 active:scale-[0.98] transition-all duration-200 ease-[cubic-bezier(0.32,0.72,0,1)]"
          >
            {content.hero.ctaLabel}
          </a>
        </div>
      </div>
    </section>
  );
};

export default HeroBrand;
