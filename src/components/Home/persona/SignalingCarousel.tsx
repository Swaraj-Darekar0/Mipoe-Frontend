import React, { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ScrollSmoother } from "gsap/ScrollSmoother";
import { MoreHorizontal } from "lucide-react";
import type { CarouselStep } from "./personaContent";

gsap.registerPlugin(ScrollTrigger, ScrollSmoother);

const TINT_CLASS: Record<CarouselStep["tint"], string> = {
  peach: "bg-tint-peach",
  rose: "bg-tint-rose",
  mint: "bg-tint-mint",
  lavender: "bg-tint-lavender",
  sky: "bg-tint-sky",
};

interface SignalingCarouselProps {
  label: string;
  intro: string;
  steps: CarouselStep[];
}

interface SlotStyle {
  x: number;
  z: number;
  rotateY: number;
  scale: number;
  opacity: number;
  zIndex: number;
  pointerEvents: "auto" | "none";
}

const getResponsiveGeometry = (w: number) => {
  if (w >= 1024) {
    return { sideOffset: 240, farOffset: 460, rotY: 18, zDepth: -50 };
  }
  if (w >= 768) {
    return { sideOffset: 200, farOffset: 390, rotY: 18, zDepth: -50 };
  }
  if (w >= 640) {
    return { sideOffset: 170, farOffset: 330, rotY: 16, zDepth: -45 };
  }
  return { sideOffset: 140, farOffset: 260, rotY: 15, zDepth: -40 };
};

const getSlot = (
  diff: number,
  sideOffset: number,
  farOffset: number,
  rotY: number,
  zDepth: number
): SlotStyle => {
  if (diff === 0) {
    // Center card: straight-on, full scale & opacity, top z-index
    return {
      x: 0,
      z: 0,
      rotateY: 0,
      scale: 1,
      opacity: 1,
      zIndex: 30,
      pointerEvents: "auto",
    };
  }
  if (diff === -1) {
    // Left card: peeking from left edge, rotated inward to the right
    return {
      x: -sideOffset,
      z: zDepth,
      rotateY: rotY,
      scale: 0.86,
      opacity: 0.45,
      zIndex: 15,
      pointerEvents: "auto",
    };
  }
  if (diff === 1) {
    // Right card: peeking from right edge, rotated inward to the left
    return {
      x: sideOffset,
      z: zDepth,
      rotateY: -rotY,
      scale: 0.86,
      opacity: 0.45,
      zIndex: 15,
      pointerEvents: "auto",
    };
  }
  if (diff < -1) {
    // Hidden offscreen left
    return {
      x: -farOffset,
      z: zDepth * 2,
      rotateY: rotY * 1.3,
      scale: 0.72,
      opacity: 0,
      zIndex: 5,
      pointerEvents: "none",
    };
  }
  // Hidden offscreen right (diff > 1)
  return {
    x: farOffset,
    z: zDepth * 2,
    rotateY: -rotY * 1.3,
    scale: 0.72,
    opacity: 0,
    zIndex: 5,
    pointerEvents: "none",
  };
};

const SignalingCarousel: React.FC<SignalingCarouselProps> = ({ label, intro, steps }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollTriggerRef = useRef<ScrollTrigger | null>(null);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);
  const activeIndexRef = useRef(0);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || steps.length === 0) return;

    const cards = cardsRef.current.filter(Boolean) as HTMLDivElement[];
    if (cards.length === 0) return;

    const { sideOffset, farOffset, rotY, zDepth } = getResponsiveGeometry(window.innerWidth);

    // Initialize all cards in 3D space for step 0
    cards.forEach((card, i) => {
      const slot = getSlot(i - 0, sideOffset, farOffset, rotY, zDepth);
      gsap.set(card, {
        xPercent: -50,
        yPercent: -50,
        x: slot.x,
        z: slot.z,
        rotateY: slot.rotateY,
        scale: slot.scale,
        opacity: slot.opacity,
        zIndex: slot.zIndex,
        pointerEvents: slot.pointerEvents,
        transformPerspective: 1200,
        transformStyle: "preserve-3d",
        force3D: true,
      });
    });

    // 600px of smooth scroll travel per card transition
    const scrollDistance = Math.max(1, steps.length - 1) * 600;

    // Detect if ScrollSmoother is active to pick the optimal pinType
    const smootherInstance = ScrollSmoother.get();
    const pinType = smootherInstance ? "transform" : "fixed";

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: container,
        start: "top top",
        end: () => `+=${scrollDistance}`,
        scrub: true, // 1:1 sync with ScrollSmoother's native easing (no double lag)
        pin: true,
        pinType,
        anticipatePin: 0, // Disabled: avoids premature pin fight with ScrollSmoother
        invalidateOnRefresh: true,
        fastScrollEnd: true,
        onUpdate: (self) => {
          const currentStep = Math.min(
            steps.length - 1,
            Math.max(0, Math.round(self.progress * (steps.length - 1)))
          );
          // Gated update: only update React state when step integer changes (for dot indicators)
          if (currentStep !== activeIndexRef.current) {
            activeIndexRef.current = currentStep;
            setActiveIndex(currentStep);
          }
        },
      },
    });

    scrollTriggerRef.current = tl.scrollTrigger ?? null;

    // Build the continuous 3D carousel timeline across steps
    const numSegments = steps.length - 1;
    for (let s = 0; s < numSegments; s++) {
      cards.forEach((card, i) => {
        const fromSlot = getSlot(i - s, sideOffset, farOffset, rotY, zDepth);
        const toSlot = getSlot(i - (s + 1), sideOffset, farOffset, rotY, zDepth);

        // Skip animating offscreen cards that remain completely hidden
        if (fromSlot.opacity === 0 && toSlot.opacity === 0) return;

        tl.to(
          card,
          {
            x: toSlot.x,
            z: toSlot.z,
            rotateY: toSlot.rotateY,
            scale: toSlot.scale,
            opacity: toSlot.opacity,
            zIndex: toSlot.zIndex,
            pointerEvents: toSlot.pointerEvents,
            ease: "power1.inOut",
            duration: 1,
          },
          s
        );
      });
    }

    // Refresh ScrollTrigger cleanly on window resize
    const handleResize = () => {
      ScrollTrigger.refresh();
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      tl.scrollTrigger?.kill();
      tl.kill();
    };
  }, [steps]);

  // Smooth scroll navigation to a target step
  const scrollToStep = (idx: number) => {
    const st = scrollTriggerRef.current;
    if (!st) return;

    const progressFraction = idx / Math.max(1, steps.length - 1);
    const targetY = st.start + progressFraction * (st.end - st.start);

    const smoother = ScrollSmoother.get();
    if (smoother) {
      smoother.scrollTo(targetY, true);
    } else {
      window.scrollTo({ top: targetY, behavior: "smooth" });
    }
  };

  // Content card rendering for each CarouselStep in exact Reel/Short format
  const renderStepContent = (step: CarouselStep) => (
    <div className="relative w-full h-full rounded-[20px] sm:rounded-[24px] md:rounded-[28px] bg-[#0c0c0e] p-2 sm:p-2.5 md:p-3 border border-black/10 dark:border-white/10 shadow-xl md:shadow-2xl flex flex-col overflow-hidden">
      {/* Inner Screen Canvas */}
      <div
        className={`relative flex-1 w-full h-full rounded-[14px] sm:rounded-[18px] md:rounded-[20px] ${TINT_CLASS[step.tint]} p-3.5 sm:p-5 md:p-6 flex flex-col justify-between overflow-hidden select-none border border-black/5`}
      >
        {/* Background watermark step number */}
        <span className="absolute -top-2 sm:-top-3 -right-1 text-[72px] sm:text-[90px] md:text-[110px] font-bold leading-none text-charcoal/8 select-none pointer-events-none font-display">
          {step.number}
        </span>

        {/* Top Bar: Minimal Step Pill & Menu Icon */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="inline-flex items-center px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full bg-charcoal/10 text-charcoal text-[10px] sm:text-[11px] font-bold tracking-wider uppercase font-mono">
              Step {step.number}
            </span>
            <span className="text-[10px] sm:text-[11px] font-mono font-semibold text-charcoal/50">
              0{step.number} / 05
            </span>
          </div>
          <button
            type="button"
            className="text-charcoal/40 hover:text-charcoal transition-colors p-1"
            aria-label="Options"
          >
            <MoreHorizontal className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        </div>

        {/* Center: Skill Step Title & Description */}
        <div className="relative z-10 my-auto py-1 sm:py-2">
          <h3 className="font-display font-bold text-[16px] sm:text-[19px] md:text-[22px] lg:text-[24px] leading-[1.22] text-charcoal tracking-tight">
            {step.title}
          </h3>
          <p className="mt-1.5 sm:mt-2.5 text-[11.5px] sm:text-[13px] md:text-[14px] leading-[1.5] sm:leading-[1.55] text-charcoal/85 line-clamp-3 sm:line-clamp-4 md:line-clamp-5">
            {step.description}
          </p>
        </div>

        {/* Bottom: Instagram Reels Style Creator Profile */}
        <div className="relative z-10 pt-2.5 sm:pt-3.5 border-t border-charcoal/10 flex flex-col gap-1 sm:gap-1.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <div className="size-5 sm:size-6 md:size-7 rounded-full bg-gradient-to-tr from-orange-500 via-pink-500 to-purple-600 p-[1px] sm:p-[1.5px] shrink-0 shadow-xs flex items-center justify-center">
                <div className="w-full h-full rounded-full bg-[#121216] flex items-center justify-center text-[8px] sm:text-[9px] md:text-[10px] font-bold text-white uppercase font-mono">
                  S
                </div>
              </div>
              <span className="text-[11px] sm:text-[12px] md:text-[12.5px] font-bold text-charcoal tracking-tight">
                @sellr.official
              </span>
            </div>
            <span className="px-2 sm:px-2.5 py-0.5 rounded-full bg-charcoal text-white text-[9.5px] sm:text-[10.5px] font-semibold shadow-xs">
              Follow
            </span>
          </div>

          <div className="flex items-center gap-1 sm:gap-1.5 text-[9px] sm:text-[10px] font-mono text-charcoal/60 truncate pl-0.5">
            <span>♫</span>
            <span className="truncate">Original audio • Step {step.number} briefing</span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <section id="signaling-factor" className="w-full bg-canvas border-t border-hairline">
      <div
        ref={containerRef}
        className="relative h-[100svh] max-h-[1050px] min-h-[580px] overflow-hidden flex flex-col justify-between pt-[74px] sm:pt-20 md:pt-24 lg:pt-28 pb-3 sm:pb-5 md:pb-8 will-change-transform"
      >
        {/* Section Header with deliberate negative space below the pinned PersonaNavbar */}
        <div className="px-5 sm:px-6 md:px-10 shrink-0 max-w-3xl mx-auto w-full text-center">
          <span className="inline-block text-[10.5px] sm:text-[11.5px] md:text-[12.5px] font-mono font-semibold uppercase tracking-[1.5px] text-slate/80">
            {label}
          </span>
          <h2 className="mt-1 sm:mt-1.5 font-semibold text-[18px] sm:text-[22px] md:text-[28px] lg:text-[32px] leading-[1.2] tracking-[-0.02em] text-ink max-w-xl mx-auto">
            {intro}
          </h2>
        </div>

        {/* 3D Perspective Reel Stack Stage */}
        <div className="relative flex-1 w-full flex items-center justify-center overflow-hidden [perspective:1200px] select-none my-auto">
          <div className="relative w-full max-w-4xl h-[360px] sm:h-[410px] md:h-[460px] lg:h-[490px] flex items-center justify-center [transform-style:preserve-3d]">
            {steps.map((step, i) => (
              <div
                key={step.number}
                ref={(el) => {
                  cardsRef.current[i] = el;
                }}
                onClick={() => {
                  if (i !== activeIndex) scrollToStep(i);
                }}
                className={`absolute w-[240px] sm:w-[275px] md:w-[310px] lg:w-[330px] h-[360px] sm:h-[410px] md:h-[460px] lg:h-[490px] flex flex-col overflow-hidden will-change-transform [transform-style:preserve-3d] ${
                  i === activeIndex ? "cursor-default" : "cursor-pointer"
                }`}
                style={{
                  top: "50%",
                  left: "50%",
                  transformOrigin: "center center",
                  backfaceVisibility: "hidden",
                }}
                title={i === activeIndex ? undefined : `Go to Step ${step.number}`}
              >
                {renderStepContent(step)}
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Dot Indicators with proper clearance */}
        <div className="flex items-center justify-center gap-1.5 sm:gap-2 pt-1 sm:pt-2 shrink-0">
          {steps.map((step, i) => (
            <button
              key={step.number}
              type="button"
              onClick={() => scrollToStep(i)}
              aria-label={`Go to step ${step.number}`}
              className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                i === activeIndex ? "w-5 sm:w-6 bg-ink" : "w-1.5 bg-hairline-strong hover:bg-slate"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default SignalingCarousel;


