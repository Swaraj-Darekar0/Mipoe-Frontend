import React, { useRef, useEffect } from "react";
import gsap from "gsap";
import { SquishyWord } from "./SquishySectionHeading";

export interface HighlightedTextProps {
  children: React.ReactNode;
  colorClass?: string; // e.g. "bg-creator-pink/30", "bg-lava/20", "bg-brand-blue/15"
  dotColorClass?: string; // deprecated, ignored
  textColorClass?: string; // default "text-ink-deep"
  className?: string;
  pillClassName?: string;
  isItalic?: boolean; // defaults to true for editorial heading style
  radius?: number;
  animated?: boolean; // defaults to true on Homepage; set false inside dashboards/portals
}

/**
 * Standard Project Highlighting Component
 * - Authentic single-color uneven chisel-tip marker highlighter
 * - Organic hand-drawn marker border-radius: 255px 25px 225px 20px / 20px 225px 20px 255px
 * - Homepage mode (animated=true): GSAP sweep, cursor proximity squish & SquishyWord letters
 * - Dashboard mode (animated=false): Pure static chisel marker wash with zero animation/GSAP
 */
export const HighlightedText: React.FC<HighlightedTextProps> = ({
  children,
  colorClass = "bg-creator-pink/30",
  textColorClass = "text-ink-deep",
  className = "",
  pillClassName = "",
  isItalic = true,
  radius = 140,
  animated = true,
}) => {
  const containerRef = useRef<HTMLSpanElement>(null);
  const pillRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!animated) return;
    const container = containerRef.current;
    const pill = pillRef.current;
    if (!container || !pill) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      gsap.set(pill, { scaleX: 1, rotate: -0.6 });
      return;
    }

    // 1. Initial Marker Sweep Reveal Animation
    const sweepTween = gsap.fromTo(
      pill,
      { scaleX: 0, rotate: -0.6, transformOrigin: "left center" },
      {
        scaleX: 1,
        rotate: -0.6,
        duration: 0.55,
        ease: "power3.out",
        delay: 0.1,
      }
    );

    const onPointerDown = () => {
      gsap.to(pill, {
        scaleX: 1.04,
        scaleY: 0.96,
        duration: 0.12,
        ease: "power2.out",
        overwrite: "auto",
        onComplete: () => {
          gsap.to(pill, {
            scaleX: 1,
            scaleY: 1,
            duration: 0.4,
            ease: "elastic.out(1.1, 0.45)",
            overwrite: "auto",
          });
        },
      });
    };
    container.addEventListener("pointerdown", onPointerDown, { passive: true });

    // 2. Subtle local hover reaction on marker wash (no global scroll/pointer listeners)
    if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
      const toX = gsap.quickTo(pill, "scaleX", { duration: 0.22, ease: "power2.out" });
      const toY = gsap.quickTo(pill, "scaleY", { duration: 0.22, ease: "power2.out" });
      const toRot = gsap.quickTo(pill, "rotate", { duration: 0.22, ease: "power2.out" });

      const onMouseEnter = () => {
        toX(1.03);
        toY(0.975);
        toRot(-1.1);
      };

      const onMouseLeave = () => {
        toX(1);
        toY(1);
        toRot(-0.6);
      };

      container.addEventListener("mouseenter", onMouseEnter, { passive: true });
      container.addEventListener("mouseleave", onMouseLeave);

      return () => {
        sweepTween.kill();
        container.removeEventListener("mouseenter", onMouseEnter);
        container.removeEventListener("mouseleave", onMouseLeave);
        container.removeEventListener("pointerdown", onPointerDown);
        gsap.killTweensOf(pill);
      };
    }

    return () => {
      sweepTween.kill();
      container.removeEventListener("pointerdown", onPointerDown);
      gsap.killTweensOf(pill);
    };
  }, [radius, animated]);

  // If animated and children is a string, wrap it in SquishyWord; otherwise render crisp static text
  const renderedContent =
    animated && typeof children === "string" ? (
      <SquishyWord text={children} isAlt={isItalic} radius={radius} />
    ) : (
      children
    );

  return (
    <span
      ref={containerRef}
      className={`relative inline-block px-[0.28em] py-[0.04em] mx-[0.06em] align-baseline whitespace-nowrap select-none ${
        animated ? "cursor-pointer" : ""
      } ${className}`}
    >
      {/* Chisel-Tip Highlighter Wash */}
      <span
        ref={pillRef}
        className={`absolute inset-0 top-[0.06em] bottom-[0.04em] ${colorClass} pointer-events-none select-none ${
          animated ? "transform-gpu will-change-transform" : "-rotate-[0.6deg]"
        } ${pillClassName}`}
        style={{
          borderRadius: "255px 25px 225px 20px / 20px 225px 20px 255px",
          transformOrigin: "center center",
        }}
        aria-hidden="true"
      />

      {/* Highlighted Text Content */}
      <span
        className={`relative z-10 ${
          isItalic ? "font-serif italic font-normal tracking-tight" : ""
        } ${textColorClass}`}
      >
        {renderedContent}
      </span>
    </span>
  );
};

export default HighlightedText;
