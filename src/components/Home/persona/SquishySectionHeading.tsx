import React, { useRef, useEffect } from "react";
import gsap from "gsap";

export interface SquishyWordProps {
  text: string;
  className?: string;
  radius?: number;
  weightRest?: number;
  weightNear?: number;
  isAlt?: boolean;
}

/**
 * Lightweight Variable Squishy Word Component
 * Uses pre-allocated GPU-only gsap.quickTo setters scoped to the local heading
 * container so idle words and page scrolling incur zero layout or CPU overhead.
 */
export const SquishyWord: React.FC<SquishyWordProps> = ({
  text,
  className = "",
  radius = 140,
}) => {
  const wordRef = useRef<HTMLSpanElement>(null);
  const charRefs = useRef<(HTMLSpanElement | null)[]>([]);

  useEffect(() => {
    const el = wordRef.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const validSpans = charRefs.current.filter((c): c is HTMLSpanElement => c !== null);
    if (!validSpans.length) return;

    // Gentle touch / click elastic micro-bounce on mobile
    const triggerRipple = () => {
      gsap.to(validSpans, {
        scaleX: 1.07,
        scaleY: 0.94,
        duration: 0.12,
        ease: "power2.out",
        stagger: 0.015,
        overwrite: "auto",
        onComplete: () => {
          gsap.to(validSpans, {
            scaleX: 1,
            scaleY: 1,
            duration: 0.42,
            ease: "elastic.out(1.1, 0.45)",
            stagger: 0.012,
            overwrite: "auto",
          });
        },
      });
    };

    el.addEventListener("pointerdown", triggerRipple, { passive: true });

    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
      return () => {
        el.removeEventListener("pointerdown", triggerRipple);
        gsap.killTweensOf(validSpans);
      };
    }

    // Listen on the nearest heading wrapper so proximity triggers smoothly as cursor enters the heading
    const scopeEl = el.parentElement ?? el;

    const charNodes = validSpans.map((span) => ({
      span,
      cx: 0,
      cy: 0,
      isAtRest: true,
      toX: gsap.quickTo(span, "scaleX", { duration: 0.2, ease: "power2.out" }),
      toY: gsap.quickTo(span, "scaleY", { duration: 0.2, ease: "power2.out" }),
    }));

    const measure = () => {
      for (let i = 0; i < charNodes.length; i++) {
        const rect = charNodes[i].span.getBoundingClientRect();
        charNodes[i].cx = rect.left + rect.width / 2;
        charNodes[i].cy = rect.top + rect.height / 2;
      }
    };

    let rafId: number | null = null;
    let mouseX = -9999;
    let mouseY = -9999;

    const updatePhysics = () => {
      for (let i = 0; i < charNodes.length; i++) {
        const item = charNodes[i];
        const dist = Math.hypot(mouseX - item.cx, mouseY - item.cy);

        if (dist < radius) {
          const factor = 1 - dist / radius;
          item.isAtRest = false;
          item.toX(1 + factor * 0.07);
          item.toY(1 - factor * 0.05);
        } else if (!item.isAtRest) {
          item.isAtRest = true;
          item.toX(1);
          item.toY(1);
        }
      }
      rafId = null;
    };

    const onMouseEnter = () => {
      measure();
    };

    const onMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      if (!rafId) {
        rafId = requestAnimationFrame(updatePhysics);
      }
    };

    const onMouseLeave = () => {
      mouseX = -9999;
      mouseY = -9999;
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
      for (let i = 0; i < charNodes.length; i++) {
        const item = charNodes[i];
        if (!item.isAtRest) {
          item.isAtRest = true;
          item.toX(1);
          item.toY(1);
        }
      }
    };

    scopeEl.addEventListener("pointerenter", onMouseEnter, { passive: true });
    scopeEl.addEventListener("mousemove", onMouseMove, { passive: true });
    scopeEl.addEventListener("mouseleave", onMouseLeave);

    return () => {
      el.removeEventListener("pointerdown", triggerRipple);
      scopeEl.removeEventListener("pointerenter", onMouseEnter);
      scopeEl.removeEventListener("mousemove", onMouseMove);
      scopeEl.removeEventListener("mouseleave", onMouseLeave);
      if (rafId) cancelAnimationFrame(rafId);
      gsap.killTweensOf(validSpans);
    };
  }, [radius, text]);

  charRefs.current = [];

  return (
    <span
      ref={wordRef}
      className={`inline-flex flex-nowrap cursor-pointer select-none ${className}`}
    >
      {text.split("").map((char, i) => {
        if (char === " ") {
          return <span key={i}>&nbsp;</span>;
        }
        return (
          <span
            key={i}
            ref={(node) => {
              charRefs.current[i] = node;
            }}
            className="inline-block transform-gpu origin-bottom"
          >
            {char}
          </span>
        );
      })}
    </span>
  );
};

export interface SquishyHeadingProps {
  text: string;
  className?: string;
  radius?: number;
  isAlt?: boolean;
}

export const SquishyHeading: React.FC<SquishyHeadingProps> = ({
  text,
  className = "",
  radius = 140,
  isAlt = false,
}) => {
  const words = text.split(" ");
  return (
    <span className={`inline-flex flex-wrap items-center gap-x-2 gap-y-1 ${className}`}>
      {words.map((word, idx) => (
        <React.Fragment key={idx}>
          <SquishyWord text={word} radius={radius} isAlt={isAlt} />
          {idx < words.length - 1 && <span>&nbsp;</span>}
        </React.Fragment>
      ))}
    </span>
  );
};

export default SquishyWord;
