import React, { useEffect, useRef } from "react";
import gsap from "gsap";

interface CreativeSocialMarketplaceProps {
  className?: string;
  onComplete?: () => void;
}

export const CreativeSocialMarketplace: React.FC<CreativeSocialMarketplaceProps> = ({
  className = "",
  onComplete,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const auraRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (!containerRef.current || !imageRef.current) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      gsap.set(imageRef.current, { opacity: 1, scale: 1, y: 0 });
      if (auraRef.current) gsap.set(auraRef.current, { opacity: 0.85, scale: 1 });
      onComplete?.();
      return;
    }

    const ctx = gsap.context(() => {
      // 1. Initial hidden/retracted states for graffiti pop
      gsap.set(imageRef.current, {
        opacity: 0,
        scale: 0.86,
        y: 20,
        transformOrigin: "center center",
      });
      if (auraRef.current) {
        gsap.set(auraRef.current, {
          opacity: 0,
          scale: 0.75,
          transformOrigin: "center center",
        });
      }

      // 2. Coordinated graffiti pop sequence timed for persona switch
      // 140ms delay allows Framer Motion's AnimatePresence crossfade to establish
      const tl = gsap.timeline({
        delay: 0.14,
        defaults: { ease: "power2.out" },
        onComplete: () => onComplete?.(),
      });

      // Step A: Yellow backdrop aura blooms
      if (auraRef.current) {
        tl.to(auraRef.current, {
          opacity: 0.9,
          scale: 1.05,
          duration: 0.35,
          ease: "power2.out",
        });
      }

      // Step B: Full typographic artwork pops up with tactile graffiti stamp bounce
      tl.to(
        imageRef.current,
        {
          opacity: 1,
          scale: 1,
          y: 0,
          duration: 0.45,
          ease: "back.out(2.2)", // Authentic graffiti stamp overshoot
        },
        "-=0.25"
      );
    }, containerRef);

    return () => ctx.revert();
  }, [onComplete]);

  return (
    <div
      ref={containerRef}
      className={`relative w-full select-none ${className}`}
      style={{ isolation: "isolate" }}
      aria-label="The Creative Social Marketplace"
    >
      {/* Background Backdrop Glow (Electric yellow radiance) */}
      <div
        ref={auraRef}
        aria-hidden="true"
        className="absolute -inset-x-8 -inset-y-6 top-[15%] h-[60%] -z-10 pointer-events-none rounded-full bg-[radial-gradient(ellipse_75%_55%_at_50%_50%,rgba(255,230,0,0.55)_0%,rgba(250,204,21,0.22)_50%,transparent_75%)] blur-2xl"
      />

      {/* High-Resolution Graphic Typography Asset */}
      <picture className="block w-full">
        <source srcSet="/creative_marketplace_hero.webp" type="image/webp" />
        <img
          ref={imageRef}
          src="/creative_marketplace_hero.png"
          alt="The Creative Social Marketplace"
          className="w-full h-auto object-contain select-none pointer-events-none drop-shadow-[0_10px_35px_rgba(250,204,21,0.15)]"
          draggable={false}
        />
      </picture>
    </div>
  );
};

export default CreativeSocialMarketplace;
