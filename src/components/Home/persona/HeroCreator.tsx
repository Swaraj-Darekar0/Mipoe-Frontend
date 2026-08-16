import React, { useEffect, useRef } from "react";
import gsap from "gsap";
import { personaContent } from "./personaContent";
import DomeGallery from "./DomeGallery";
import { DEFAULT_CLIPS } from "../UGCShowcase";

const content = personaContent.creator;
const galleryImages = DEFAULT_CLIPS.map((clip) => ({ src: clip.imageUrl, alt: clip.title }));

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
    }, rootRef);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={rootRef} id="hero" className="w-full min-h-screen bg-canvas overflow-hidden">
      {/* Desktop: gallery left, copy right. `md:flex-row-reverse` gets that
          from a DOM order of copy-then-gallery, which is also the order mobile
          needs (copy on top, gallery below) and the order a screen reader
          should hear — the headline before the decorative gallery. */}
      <div className="w-full max-w-7xl mx-auto px-6 md:px-8 min-h-screen flex flex-col md:flex-row-reverse items-center gap-8 md:gap-12">
        <div className="w-full md:w-1/2 shrink-0 pt-16 md:pt-0 flex flex-col items-center md:items-start text-center md:text-left">
          {/* Type scale steps down at lg vs the full-width version: the copy
              now lives in a half-width column, so the old 60px would push this
              headline past three lines. */}
          <h1 className="hero-rise font-semibold text-[34px] sm:text-[42px] lg:text-[48px] leading-[1.08] tracking-[-1.5px] text-ink">
          {content.hero.headline.map((segment, i) =>
            segment.emphasis ? (
              <span key={i} className="text-creator-pink">
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
            className="hero-rise mt-8 inline-flex items-center justify-center rounded-[8px] bg-creator-pink text-ink-deep font-medium text-[14px] px-6 py-3 hover:opacity-90 active:scale-[0.98] transition-all duration-200 ease-[cubic-bezier(0.32,0.72,0,1)]"
          >
            {content.hero.ctaLabel}
          </a>
        </div>

        {/* Gallery needs an explicit height because DomeGallery renders
            absolutely positioned. Mobile keeps the existing stacked band;
            desktop gets a tall column capped so it never outgrows the hero. */}
        <div className="relative w-full md:w-1/2 h-[380px] sm:h-[440px] md:h-[72vh] md:max-h-[640px] shrink-0">
          {/* fit 0.5 leaves clear margin on every side of the globe rather
              than letting it hug the column edges — the design breathes and
              the sphere reads as a deliberate object, not a cropped texture. */}
          <DomeGallery
            images={galleryImages}
            overlayBlurColor="#ffffff"
            grayscale={false}
            fit={0.5}
            minRadius={230}
          />
        </div>
      </div>
    </section>
  );
};

export default HeroCreator;
