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
    <section ref={rootRef} id="hero" className="w-full min-h-screen flex flex-col bg-canvas overflow-hidden">
      <div className="w-full max-w-2xl mx-auto px-6 pt-16 md:pt-20 pb-8 flex flex-col items-center text-center shrink-0">
        <h1 className="hero-rise font-semibold text-[36px] sm:text-[48px] lg:text-[60px] leading-[1.08] tracking-[-1.5px] text-ink">
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

      <div className="relative flex-1 w-full min-h-[360px]">
        <DomeGallery images={galleryImages} overlayBlurColor="#ffffff" grayscale={false} />
      </div>
    </section>
  );
};

export default HeroCreator;
