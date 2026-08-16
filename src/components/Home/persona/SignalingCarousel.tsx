import React, { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { CarouselStep } from "./personaContent";

gsap.registerPlugin(ScrollTrigger);

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

const SignalingCarousel: React.FC<SignalingCarouselProps> = ({ label, intro, steps }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const container = containerRef.current;
    const track = trackRef.current;
    if (!container || !track) return;

    const distance = () => Math.max(0, track.scrollWidth - container.clientWidth);

    const tween = gsap.to(track, {
      x: () => -distance(),
      ease: "none",
      scrollTrigger: {
        trigger: container,
        start: "top top",
        end: () => `+=${distance()}`,
        scrub: true,
        pin: true,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          const idx = Math.round(self.progress * (steps.length - 1));
          setActiveIndex(idx);
        },
      },
    });

    const onResize = () => ScrollTrigger.refresh();
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
      tween.scrollTrigger?.kill();
      tween.kill();
    };
  }, [steps]);

  return (
    <section id="signaling-factor" className="w-full bg-canvas border-t border-hairline">
      <div ref={containerRef} className="relative h-screen overflow-hidden flex flex-col">
        <div className="px-6 md:px-10 pt-10 md:pt-14 pb-6 shrink-0">
          <span className="text-[13px] font-semibold uppercase tracking-[1px] text-slate">{label}</span>
          <h2 className="mt-2 font-semibold text-[26px] md:text-[36px] leading-[1.2] tracking-[-0.5px] text-ink">
            {intro}
          </h2>
        </div>

        <div className="relative flex-1 overflow-hidden">
          <div ref={trackRef} className="flex h-full will-change-transform">
            {steps.map((step) => (
              <div key={step.number} className="w-screen h-full shrink-0 flex items-center px-6 md:px-16">
                <div
                  className={`relative w-full max-w-2xl overflow-hidden rounded-[16px] ${TINT_CLASS[step.tint]} p-8 md:p-12 shadow-[0_4px_12px_rgba(15,15,15,0.08)]`}
                >
                  <span className="absolute -top-6 right-2 text-[140px] md:text-[180px] font-semibold leading-none text-charcoal/10 select-none">
                    {step.number}
                  </span>
                  <span className="relative text-[13px] font-semibold uppercase tracking-[1px] text-charcoal/60">
                    Step {step.number}
                  </span>
                  <h3 className="relative mt-3 font-semibold text-[24px] md:text-[28px] leading-[1.25] text-charcoal">
                    {step.title}
                  </h3>
                  <p className="relative mt-4 text-[16px] leading-[1.55] text-charcoal max-w-md">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 pb-8 md:pb-10 shrink-0">
          {steps.map((step, i) => (
            <span
              key={step.number}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === activeIndex ? "w-6 bg-ink" : "w-1.5 bg-hairline-strong"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default SignalingCarousel;
