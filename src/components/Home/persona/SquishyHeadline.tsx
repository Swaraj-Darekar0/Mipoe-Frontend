import React, { useEffect, useRef } from "react";
import gsap from "gsap";
import { type HeadlineLine } from "./heroType";

interface SquishyHeadlineProps {
  lines: readonly HeadlineLine[];
  lineSize: (index: number) => string;
  containerRef: React.RefObject<HTMLElement | null>;
  highlightColor?: string;
  radius?: number;
}

export const SquishyHeadline: React.FC<SquishyHeadlineProps> = ({
  lines,
  lineSize,
  containerRef,
  highlightColor = "bg-creator-pink/30",
  radius = 155,
}) => {
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const charRefs = useRef<(HTMLSpanElement | null)[]>([]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !charRefs.current.length) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

    interface CharNode {
      el: HTMLSpanElement;
      cx: number;
      cy: number;
      isAtRest: boolean;
      toX: gsap.QuickToFunc;
      toY: gsap.QuickToFunc;
    }

    let charNodes: CharNode[] = [];
    let isMeasured = false;

    const buildNodes = () => {
      charNodes = charRefs.current
        .filter((el): el is HTMLSpanElement => el !== null)
        .map((el) => {
          const rect = el.getBoundingClientRect();
          return {
            el,
            cx: rect.left + rect.width / 2,
            cy: rect.top + rect.height / 2,
            isAtRest: true,
            toX: gsap.quickTo(el, "scaleX", { duration: 0.22, ease: "power2.out" }),
            toY: gsap.quickTo(el, "scaleY", { duration: 0.22, ease: "power2.out" }),
          };
        });
      isMeasured = true;
    };

    const remeasureCenters = () => {
      for (let i = 0; i < charNodes.length; i++) {
        const rect = charNodes[i].el.getBoundingClientRect();
        charNodes[i].cx = rect.left + rect.width / 2;
        charNodes[i].cy = rect.top + rect.height / 2;
      }
      isMeasured = true;
    };

    buildNodes();

    const onResize = () => {
      isMeasured = false;
    };

    let rafId: number | null = null;
    let targetX = -9999;
    let targetY = -9999;

    const updatePhysics = () => {
      if (!isMeasured) remeasureCenters();
      for (let i = 0; i < charNodes.length; i++) {
        const item = charNodes[i];
        const dist = Math.hypot(targetX - item.cx, targetY - item.cy);

        if (dist < radius) {
          const factor = 1 - dist / radius;
          item.isAtRest = false;
          item.toX(1 + factor * 0.07);
          item.toY(1 - factor * 0.048);
        } else if (!item.isAtRest) {
          item.isAtRest = true;
          item.toX(1);
          item.toY(1);
        }
      }
      rafId = null;
    };

    const onMouseEnter = () => {
      remeasureCenters();
    };

    const onMouseMove = (e: MouseEvent) => {
      targetX = e.clientX;
      targetY = e.clientY;
      if (!rafId) {
        rafId = requestAnimationFrame(updatePhysics);
      }
    };

    const onMouseLeave = () => {
      targetX = -9999;
      targetY = -9999;
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

    window.addEventListener("resize", onResize, { passive: true });
    container.addEventListener("mouseenter", onMouseEnter, { passive: true });
    container.addEventListener("mousemove", onMouseMove, { passive: true });
    container.addEventListener("mouseleave", onMouseLeave);

    return () => {
      window.removeEventListener("resize", onResize);
      container.removeEventListener("mouseenter", onMouseEnter);
      container.removeEventListener("mousemove", onMouseMove);
      container.removeEventListener("mouseleave", onMouseLeave);
      if (rafId) cancelAnimationFrame(rafId);
      charNodes.forEach((n) => gsap.killTweensOf(n.el));
    };
  }, [containerRef, radius, lines]);

  let charCounter = 0;
  charRefs.current = [];

  return (
    <h1
      ref={headlineRef}
      className="hero-rise text-ink select-none"
    >
      {lines.map((line, lineIdx) => {
        const isHighlight = Boolean(line.highlight);

        return (
          <span
            key={lineIdx}
            className={`block leading-[0.92] ${
              isHighlight
                ? "font-serif italic font-normal tracking-tight text-ink-deep"
                : "font-display font-extrabold uppercase tracking-tight text-ink"
            }`}
            style={{ fontSize: lineSize(lineIdx) }}
          >
            {isHighlight ? (
              <span className="relative inline-block px-[0.28em] py-[0.04em] mx-[0.06em] align-baseline">
                <span
                  className={`absolute inset-0 top-[0.06em] bottom-[0.04em] ${highlightColor} -rotate-[0.6deg] pointer-events-none select-none`}
                  style={{
                    borderRadius: "255px 25px 225px 20px / 20px 225px 20px 255px",
                  }}
                  aria-hidden="true"
                />
                <span className="relative z-10 inline-flex">
                  {line.text.split("").map((char, charIdx) => {
                    const currentIndex = charCounter++;
                    if (char === " ") {
                      return <span key={charIdx}>&nbsp;</span>;
                    }
                    return (
                      <span
                        key={charIdx}
                        ref={(el) => {
                          charRefs.current[currentIndex] = el;
                        }}
                        className="inline-block transform-gpu origin-bottom"
                      >
                        {char}
                      </span>
                    );
                  })}
                </span>
              </span>
            ) : (
              <span className="inline-flex">
                {line.text.split("").map((char, charIdx) => {
                  const currentIndex = charCounter++;
                  if (char === " ") {
                    return <span key={charIdx}>&nbsp;</span>;
                  }
                  return (
                    <span
                      key={charIdx}
                      ref={(el) => {
                        charRefs.current[currentIndex] = el;
                      }}
                      className="inline-block transform-gpu origin-bottom"
                    >
                      {char}
                    </span>
                  );
                })}
              </span>
            )}
          </span>
        );
      })}
    </h1>
  );
};

export default SquishyHeadline;
