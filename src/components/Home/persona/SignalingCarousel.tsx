import React, { useEffect, useRef, useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ScrollSmoother } from "gsap/ScrollSmoother";
import { MoreHorizontal, X, ChevronUp, Check, Sparkles, ExternalLink } from "lucide-react";
import type { CarouselStep } from "./personaContent";

gsap.registerPlugin(ScrollTrigger, ScrollSmoother);

// High-contrast neutral palette (zero pink)
const TINT_CLASS: Record<CarouselStep["tint"], string> = {
  peach: "bg-[#ffffff]",
  rose: "bg-[#fbfbfd]",
  mint: "bg-[#ffffff]",
  lavender: "bg-[#fbfbfd]",
  sky: "bg-[#ffffff]",
};

const TINT_BORDER: Record<CarouselStep["tint"], string> = {
  peach: "border-black/5",
  rose: "border-black/5",
  mint: "border-black/5",
  lavender: "border-black/5",
  sky: "border-black/5",
};

interface SignalingCarouselProps {
  label: string;
  intro: string;
  steps: CarouselStep[];
  persona?: "creator" | "brand";
}

// Real Sellr Platform UI Snippets tailored to each persona and step
const renderPlatformSnippet = (stepNumber: string, persona: "creator" | "brand" = "creator") => {
  if (persona === "brand") {
    switch (stepNumber) {
      case "01":
      case "1":
        return (
          <div className="w-full min-w-0 rounded-2xl bg-[#141416] text-white p-2.5 sm:p-3 border border-white/10 shadow-md select-none">
            <div className="flex items-center justify-between pb-1.5 border-b border-white/10 text-[9px] font-mono min-w-0">
              <span className="text-white/60 truncate">sellr.in/brand</span>
              <span className="text-emerald-400 font-bold flex items-center gap-1 shrink-0 ml-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live Campaign ✓
              </span>
            </div>
            <div className="mt-2 min-w-0">
              <div className="text-xs font-bold text-white tracking-tight truncate">
                Urban Vault • Tech Audio UGC Drop
              </div>
              <div className="mt-0.5 flex items-baseline gap-1.5 font-mono min-w-0">
                <span className="text-sm font-bold text-emerald-400 shrink-0">₹1,50,000</span>
                <span className="text-[8.5px] text-white/60 truncate">Budget • ₹0.10 / view</span>
              </div>
            </div>
            <div className="mt-1.5 w-full bg-white/10 h-1 rounded-full overflow-hidden">
              <div className="bg-orange-500 h-full rounded-full w-full" />
            </div>
            <div className="mt-2 flex items-center justify-between min-w-0">
              <span className="text-[8.5px] text-white/60 font-mono truncate">15,00,000 Views Target</span>
              <span className="px-2 py-0.5 rounded-md bg-orange-500 text-white text-[9px] font-bold font-mono shadow-xs shrink-0 ml-1">
                Active ⚡
              </span>
            </div>
          </div>
        );

      case "02":
      case "2":
        return (
          <div className="w-full min-w-0 rounded-2xl bg-[#141416] text-white p-2.5 sm:p-3 border border-white/10 shadow-md select-none">
            <div className="flex items-center justify-between pb-1.5 border-b border-white/10 text-[9px] font-mono min-w-0">
              <span className="text-white/60 truncate">Creator Pool</span>
              <span className="px-1.5 py-0.5 rounded-full bg-orange-500/20 text-orange-400 font-bold uppercase text-[8px] shrink-0">
                48 Creators In Review
              </span>
            </div>
            <div className="mt-2 flex items-center gap-2 min-w-0">
              <div className="size-6 sm:size-7 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-500 p-[1.5px] shrink-0">
                <div className="w-full h-full rounded-full bg-[#1e1e24] flex items-center justify-center text-white font-bold text-[9.5px] font-mono">
                  R
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-white truncate">@rohit.reels (240K)</div>
                <div className="text-[8.5px] text-white/60 font-mono truncate">6.8% Eng • Tech & Audio</div>
              </div>
              <span className="px-1.5 py-0.5 rounded-md bg-emerald-500 text-black font-bold text-[8.5px] font-mono shrink-0">
                Approved ✓
              </span>
            </div>
            <div className="mt-2 pt-1 border-t border-white/5 flex items-center justify-between text-[8.5px] font-mono text-white/70 min-w-0">
              <span className="truncate">Audience Match: <strong className="text-white">94% Gen-Z</strong></span>
              <span className="text-sky-400 font-bold shrink-0 ml-1">Auto-Matched</span>
            </div>
          </div>
        );

      case "03":
      case "3":
        return (
          <div className="w-full min-w-0 rounded-2xl bg-[#141416] text-white p-2.5 sm:p-3 border border-white/10 shadow-md select-none">
            <div className="flex items-center justify-between pb-1.5 border-b border-white/10 text-[9px] font-mono min-w-0">
              <span className="text-white/60 truncate">Live Campaign UGC</span>
              <span className="text-emerald-400 font-semibold flex items-center gap-1 shrink-0 ml-1">
                <Sparkles className="w-3 h-3 text-emerald-400" />
                34 Clips Live
              </span>
            </div>
            <div className="mt-2 min-w-0">
              <div className="text-[8.5px] text-white/60 font-mono mb-1 truncate">Native Reel Streaming:</div>
              <div className="px-2 py-1 rounded-lg bg-black/50 border border-white/15 text-[9.5px] font-mono text-white/90 truncate flex items-center justify-between min-w-0">
                <span className="truncate">instagram.com/reel/D8xM...</span>
                <span className="text-[8.5px] text-emerald-400 font-bold font-mono shrink-0 ml-1">420K views</span>
              </div>
            </div>
            <div className="mt-2 flex items-center justify-between min-w-0">
              <div className="text-[8.5px] text-white/60 font-mono truncate">
                Authentic UGC • Zero scripts
              </div>
              <span className="px-2 py-0.5 rounded-md bg-white/20 text-white text-[9px] font-bold font-mono shrink-0 ml-1">
                Live Feed
              </span>
            </div>
          </div>
        );

      case "04":
      case "4":
        return (
          <div className="w-full min-w-0 rounded-2xl bg-[#141416] text-white p-2.5 sm:p-3 border border-white/10 shadow-md select-none">
            <div className="flex items-center justify-between pb-1.5 border-b border-white/10 text-[9px] font-mono min-w-0">
              <span className="text-white/60 truncate">Campaign Performance</span>
              <span className="text-emerald-400 font-bold shrink-0 ml-1">Live Tracking</span>
            </div>
            <div className="mt-2 flex items-baseline justify-between min-w-0">
              <div className="min-w-0">
                <div className="text-[8.5px] text-white/60 font-mono">Attributed Revenue</div>
                <div className="text-sm sm:text-base font-bold text-emerald-400 font-mono tracking-tight truncate">₹2,84,000</div>
              </div>
              <div className="text-right shrink-0 ml-1">
                <div className="text-[8px] text-white/70 font-mono font-semibold">Spend: ₹52,040</div>
                <div className="text-[8.5px] text-amber-400 font-mono font-bold">5.4x ROAS</div>
              </div>
            </div>
            <div className="mt-2 pt-1 border-t border-white/10 flex items-center justify-between min-w-0">
              <div className="text-[8.5px] text-white/70 font-mono truncate">
                Reach: <span className="text-white font-semibold">520,400 Verified Views</span>
              </div>
              <span className="px-2 py-0.5 rounded-md bg-white/15 text-white font-bold text-[9px] font-mono shadow-xs shrink-0 ml-1">
                Real-Time
              </span>
            </div>
          </div>
        );

      case "05":
      case "5":
      default:
        return (
          <div className="w-full min-w-0 rounded-2xl bg-[#141416] text-white p-2.5 sm:p-3 border border-white/10 shadow-md select-none">
            <div className="flex items-center justify-between pb-1.5 border-b border-white/10 text-[9px] font-mono min-w-0">
              <span className="text-white/60 truncate">Campaign Settlement</span>
              <span className="text-emerald-400 font-bold shrink-0 ml-1">Zero Waste Billing ✓</span>
            </div>
            <div className="mt-2 flex items-baseline justify-between min-w-0">
              <div className="min-w-0">
                <div className="text-[8.5px] text-white/60 font-mono">Delivered Performance</div>
                <div className="text-sm sm:text-base font-bold text-white font-mono tracking-tight truncate">1.5M Verified Views</div>
              </div>
              <div className="text-right shrink-0 ml-1">
                <div className="text-[8px] text-emerald-400 font-mono font-semibold">100% Target Met</div>
                <div className="text-[8px] text-white/50 font-mono">₹0 Upfront Risk</div>
              </div>
            </div>
            <div className="mt-2 pt-1 border-t border-white/10 flex items-center justify-between min-w-0">
              <div className="text-[8.5px] text-white/70 font-mono truncate">
                Billed: <span className="text-white font-semibold">₹1,50,000 (CPV Only)</span>
              </div>
              <span className="px-2 py-0.5 rounded-md bg-emerald-500 text-black font-bold text-[9px] font-mono shadow-xs shrink-0 ml-1">
                Settled ⚡
              </span>
            </div>
          </div>
        );
    }
  }

  // Creator platform snippets
  switch (stepNumber) {
    case "01":
    case "1":
      return (
        <div className="w-full min-w-0 rounded-2xl bg-[#141416] text-white p-2.5 sm:p-3 border border-white/10 shadow-md select-none">
          <div className="flex items-center justify-between pb-1.5 border-b border-white/10 text-[9px] font-mono min-w-0">
            <span className="text-white/60 truncate">sellr.in/creator</span>
            <span className="text-emerald-400 font-bold flex items-center gap-1 shrink-0 ml-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Verified ✓
            </span>
          </div>
          <div className="mt-2 flex items-center gap-2 min-w-0">
            <div className="size-6 sm:size-7 rounded-full bg-gradient-to-tr from-amber-500 via-orange-500 to-pink-500 p-[1.5px] shrink-0">
              <div className="w-full h-full rounded-full bg-[#1e1e24] flex items-center justify-center text-white font-bold text-[9.5px] font-mono">
                S
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold text-white truncate">@swaraj.reels</div>
              <div className="text-[8.5px] text-white/60 font-mono truncate">Instagram & YouTube Linked</div>
            </div>
            <span className="px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[8.5px] font-mono font-bold shrink-0">
              Active
            </span>
          </div>
          <div className="mt-2 pt-1 border-t border-white/5 flex items-center justify-between text-[8.5px] font-mono text-white/70 min-w-0">
            <span className="truncate">Gatekeeping: <strong className="text-white">None (0+)</strong></span>
            <span className="text-orange-400 font-bold shrink-0 ml-1">Instant Access</span>
          </div>
        </div>
      );

    case "02":
    case "2":
      return (
        <div className="w-full min-w-0 rounded-2xl bg-[#141416] text-white p-2.5 sm:p-3 border border-white/10 shadow-md select-none">
          <div className="flex items-center justify-between text-[9px] font-mono pb-1.5 border-b border-white/10 min-w-0">
            <span className="px-1.5 py-0.5 rounded-full bg-orange-500/20 text-orange-400 font-bold uppercase text-[8px] shrink-0">
              Active UGC Brief
            </span>
            <span className="text-white/60 text-[8.5px] shrink-0 ml-1">74% Budget Left</span>
          </div>
          <div className="mt-2 min-w-0">
            <div className="text-xs font-bold text-white tracking-tight truncate">
              Urban Vault • Tech Audio Drop
            </div>
            <div className="mt-0.5 flex items-baseline gap-1.5 font-mono min-w-0">
              <span className="text-sm font-bold text-emerald-400 shrink-0">₹500</span>
              <span className="text-[8.5px] text-white/60 truncate">/ 10,000 verified views</span>
            </div>
          </div>
          <div className="mt-1.5 w-full bg-white/10 h-1 rounded-full overflow-hidden">
            <div className="bg-orange-500 h-full rounded-full w-3/4" />
          </div>
          <div className="mt-2 flex items-center justify-between min-w-0">
            <span className="text-[8.5px] text-white/60 font-mono truncate">1 Clip Brief</span>
            <span className="px-2 py-0.5 rounded-md bg-orange-500 text-white text-[9px] font-bold font-mono shadow-xs shrink-0 ml-1">
              Apply Now ⚡
            </span>
          </div>
        </div>
      );

    case "03":
    case "3":
      return (
        <div className="w-full min-w-0 rounded-2xl bg-[#141416] text-white p-2.5 sm:p-3 border border-white/10 shadow-md select-none">
          <div className="flex items-center justify-between pb-1.5 border-b border-white/10 text-[9px] font-mono min-w-0">
            <span className="text-white/60 truncate">Submit Clip URL</span>
            <span className="text-sky-400 font-semibold flex items-center gap-1 shrink-0 ml-1">
              <Sparkles className="w-3 h-3 text-sky-400" />
              Live Tracking
            </span>
          </div>
          <div className="mt-2 min-w-0">
            <div className="text-[8.5px] text-white/60 font-mono mb-1 truncate">Reel / YouTube Short:</div>
            <div className="px-2 py-1 rounded-lg bg-black/50 border border-white/15 text-[9.5px] font-mono text-white/90 truncate flex items-center justify-between min-w-0">
              <span className="truncate">https://instagram.com/reel/D8xM...</span>
              <Check className="w-3 h-3 text-emerald-400 shrink-0 ml-1" />
            </div>
          </div>
          <div className="mt-2 flex items-center justify-between min-w-0">
            <div className="text-[8.5px] text-white/60 font-mono truncate">
              Real views verified hourly
            </div>
            <span className="px-2 py-0.5 rounded-md bg-white/20 text-white text-[9px] font-bold font-mono shrink-0 ml-1">
              Submit Clip
            </span>
          </div>
        </div>
      );

    case "04":
    case "4":
      return (
        <div className="w-full min-w-0 rounded-2xl bg-[#141416] text-white p-2.5 sm:p-3 border border-white/10 shadow-md select-none">
          <div className="flex items-center justify-between pb-1.5 border-b border-white/10 text-[9px] font-mono min-w-0">
            <span className="text-white/60 truncate">Sellr Creator Wallet</span>
            <span className="text-emerald-400 font-bold shrink-0 ml-1">Instant Payouts</span>
          </div>
          <div className="mt-2 flex items-baseline justify-between min-w-0">
            <div className="min-w-0">
              <div className="text-[8.5px] text-white/60 font-mono">Available Balance</div>
              <div className="text-sm sm:text-base font-bold text-white font-mono tracking-tight truncate">₹38,450.00</div>
            </div>
            <div className="text-right shrink-0 ml-1">
              <div className="text-[8px] text-emerald-400 font-mono font-semibold">+₹4,200 today</div>
              <div className="text-[8px] text-white/50 font-mono">CPV + Affiliate</div>
            </div>
          </div>
          <div className="mt-2 pt-1 border-t border-white/10 flex items-center justify-between min-w-0">
            <div className="text-[8.5px] text-white/70 font-mono truncate">
              UPI: <span className="text-white font-semibold">swaraj@okaxis</span>
            </div>
            <span className="px-2 py-0.5 rounded-md bg-emerald-500 text-black font-bold text-[9px] font-mono shadow-xs shrink-0 ml-1">
              Withdraw ⚡
            </span>
          </div>
        </div>
      );

    case "05":
    case "5":
    default:
      return (
        <div className="w-full min-w-0 rounded-2xl bg-[#141416] text-white p-2.5 sm:p-3 border border-white/10 shadow-md select-none">
          <div className="flex items-center justify-between pb-1.5 border-b border-white/10 text-[9px] font-mono min-w-0">
            <span className="text-white/60 truncate">Creator Public Store</span>
            <span className="text-amber-400 font-bold shrink-0 ml-1">Top 5% ★</span>
          </div>
          <div className="mt-2 flex items-center gap-2 min-w-0">
            <div className="size-6 sm:size-7 rounded-full bg-gradient-to-tr from-purple-500 to-orange-500 p-[1.5px] shrink-0">
              <div className="w-full h-full rounded-full bg-[#181820] flex items-center justify-center text-white font-bold text-[9.5px] font-mono">
                S
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold text-white truncate">sellr.in/store/swaraj</div>
              <div className="text-[8.5px] text-white/60 font-mono truncate">14 Live Brand Deals Curated</div>
            </div>
            <span className="px-1.5 py-0.5 rounded-full bg-white/15 text-[8px] font-mono text-white/90 shrink-0">
              Live
            </span>
          </div>
          <div className="mt-2 pt-1 border-t border-white/10 flex items-center justify-between text-[8.5px] min-w-0">
            <span className="text-white/60 font-mono truncate">Store Conv: 4.8%</span>
            <span className="text-orange-400 font-bold font-mono flex items-center gap-0.5 shrink-0 ml-1">
              Share Store <ExternalLink className="w-2.5 h-2.5" />
            </span>
          </div>
        </div>
      );
  }
};

// ============================================================================
// MOBILE VIEWPORT COMPONENT (Instagram Stories Analogy: Tap & 10s Auto-Advance)
// ============================================================================
const MobileSignalingCarousel: React.FC<SignalingCarouselProps> = ({ label, intro, steps, persona }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isInView, setIsInView] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [timerResetCount, setTimerResetCount] = useState(0);

  const setPaused = useCallback((val: boolean) => {
    setIsPaused(val);
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => setIsInView(entry.isIntersecting),
      { threshold: 0.2 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const handleNextStory = useCallback(() => {
    setActiveIndex((prev) => (prev + 1) % steps.length);
    setTimerResetCount((c) => c + 1);
  }, [steps.length]);

  const handlePrevStory = useCallback(() => {
    setActiveIndex((prev) => (prev > 0 ? prev - 1 : 0));
    setTimerResetCount((c) => c + 1);
  }, []);

  const scrollToStep = useCallback((idx: number) => {
    const safeIndex = Math.min(steps.length - 1, Math.max(0, idx));
    setActiveIndex(safeIndex);
    setTimerResetCount((c) => c + 1);
  }, [steps.length]);

  const currentStep = steps[activeIndex] || steps[0];

  return (
    <div ref={containerRef} className="w-full bg-canvas py-10 sm:py-14 overflow-hidden">
      <div className="flex flex-col items-center justify-between w-full max-w-sm mx-auto px-2 min-h-[560px] sm:min-h-[620px] gap-3.5">
        <div className="text-center max-w-sm mx-auto shrink-0">
          <span className="inline-block text-[10px] sm:text-[11px] font-mono font-semibold uppercase tracking-[1.5px] text-slate/80">
            {label}
          </span>
          <h2 className="mt-0.5 font-semibold text-[17px] sm:text-[20px] leading-tight tracking-[-0.02em] text-ink">
            {intro}
          </h2>
        </div>

        {/* Slender, centered iPhone mockup for mobile */}
        <div className="relative w-full flex-1 min-h-0 flex items-center justify-center my-auto select-none">
          <div
            className="relative rounded-[2.75rem] bg-[#121318] p-[3px] ring-1 ring-white/15 shadow-[0_25px_70px_-20px_rgba(0,0,0,0.65)] overflow-visible shrink-0"
            style={{
              height: "clamp(400px, 58svh, 510px)",
              width: "calc(clamp(400px, 58svh, 510px) / 2.048)",
              minHeight: "clamp(400px, 58svh, 510px)",
              maxHeight: "clamp(400px, 58svh, 510px)",
              minWidth: "calc(clamp(400px, 58svh, 510px) / 2.048)",
              maxWidth: "calc(clamp(400px, 58svh, 510px) / 2.048)",
              transform: "translate3d(0, 0, 0)",
              backfaceVisibility: "hidden",
            }}
          >
            {/* Left Buttons: Action + Volume */}
            <div className="absolute -left-[2.5px] top-[17%] h-4 w-[2.5px] rounded-l-full bg-[#25252a]" />
            <div className="absolute -left-[2.5px] top-[26%] h-10 w-[2.5px] rounded-l-full bg-[#25252a]" />
            <div className="absolute -left-[2.5px] top-[37%] h-10 w-[2.5px] rounded-l-full bg-[#25252a]" />
            {/* Right Buttons: Power + Camera Control */}
            <div className="absolute -right-[2.5px] top-[29%] h-13 w-[2.5px] rounded-r-full bg-[#25252a]" />
            <div className="absolute -right-[2px] top-[67%] h-9 w-[2px] rounded-r-full bg-[#222226]" />

            {/* Inner Screen */}
            <div className="relative w-full h-full rounded-[2.6rem] overflow-hidden bg-white ring-1 ring-white/10 flex flex-col justify-between min-w-0 min-h-0 border border-black/5 select-none">
              {/* Dynamic Island */}
              <div
                className="absolute top-2 inset-x-0 mx-auto w-[28%] max-w-[72px] h-[17px] rounded-full bg-black z-40 flex items-center justify-center pointer-events-none ring-1 ring-white/5 shadow-inner"
                style={{ left: 0, right: 0, margin: "0 auto" }}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#111116] ml-auto mr-1.5 shrink-0 border border-white/5" />
              </div>

              {/* Pinned Top Story Header & 5-Segment Progress Bar */}
              <div className="relative z-30 pt-8.5 px-3.5 pb-1 shrink-0 flex flex-col gap-1.5 select-none bg-white">
                <div className="relative w-full flex items-center gap-1 pt-0.5 px-0.5 shrink-0 pointer-events-auto">
                  {steps.map((_, i) => (
                    <div
                      key={i}
                      onClick={(e) => {
                        e.stopPropagation();
                        scrollToStep(i);
                      }}
                      className="h-1 flex-1 rounded-full bg-charcoal/15 overflow-hidden cursor-pointer"
                      title={`Step ${i + 1}`}
                    >
                      {i < activeIndex ? (
                        <div className="h-full w-full bg-charcoal rounded-full" />
                      ) : i === activeIndex ? (
                        <div
                          key={`mobile-active-${activeIndex}-${timerResetCount}`}
                          className="h-full bg-charcoal rounded-full story-bar-active"
                          style={{
                            animationPlayState: isInView && !isPaused ? "running" : "paused",
                          }}
                          onAnimationEnd={handleNextStory}
                        />
                      ) : (
                        <div className="h-full w-0 bg-charcoal rounded-full" />
                      )}
                    </div>
                  ))}
                </div>

                <div className="relative flex items-center justify-between pt-1 pb-0.5 shrink-0">
                  <div className="flex items-center gap-2">
                    <div className="size-6 rounded-full bg-charcoal flex items-center justify-center text-white text-[9.5px] font-mono font-bold shadow-xs">
                      s.
                    </div>
                    <div className="flex flex-col leading-tight">
                      <span className="font-mono font-bold text-[12px] text-charcoal tracking-tight">
                        {persona === "brand" ? "sellr.in/brand" : "sellr.in"}
                      </span>
                      <span className="text-[9.5px] font-mono font-semibold text-charcoal/60">
                        Step {currentStep.number} / 05
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-charcoal/50">
                    <button type="button" className="p-1 hover:text-charcoal transition-colors" aria-label="Menu">
                      <MoreHorizontal className="w-3.5 h-3.5" />
                    </button>
                    <button type="button" className="p-1 hover:text-charcoal transition-colors" aria-label="Close">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Middle Story Canvas with smooth Animated transition */}
              <div className="relative z-10 flex-1 min-h-0 w-full overflow-hidden my-auto flex flex-col justify-center">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeIndex}
                    initial={{ opacity: 0, x: 28 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -28 }}
                    transition={{ duration: 0.28, ease: "easeOut" }}
                    className={`w-full h-full flex flex-col justify-center px-3.5 py-1.5 relative overflow-hidden select-none ${TINT_CLASS[currentStep.tint]}`}
                  >
                    <span className="absolute -top-2 -right-1 text-[60px] font-bold leading-none text-charcoal/[0.04] select-none pointer-events-none font-display">
                      {currentStep.number}
                    </span>

                    <div className="relative z-10 my-auto py-1 flex flex-col gap-2 min-h-0 justify-center">
                      <div className="shrink-0">
                        <span className="inline-block text-[9px] font-mono font-bold uppercase tracking-wider text-charcoal/50">
                          Step {currentStep.number} • Walkthrough
                        </span>
                        <h3 className="mt-0.5 font-display font-bold text-[15.5px] leading-tight text-charcoal tracking-tight">
                          {currentStep.title}
                        </h3>
                      </div>

                      <div className="w-full my-0.5 shrink-0 pointer-events-auto" onClick={(e) => e.stopPropagation()}>
                        {renderPlatformSnippet(currentStep.number, persona)}
                      </div>

                      <p className="text-[10.5px] leading-snug text-charcoal/80 shrink-0">
                        {currentStep.description}
                      </p>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Mobile Instagram Tap Overlays */}
              <div
                className="absolute inset-0 z-20 flex pointer-events-none"
                onTouchStart={() => setPaused(true)}
                onTouchEnd={() => setPaused(false)}
                onMouseDown={() => setPaused(true)}
                onMouseUp={() => setPaused(false)}
                onMouseLeave={() => setPaused(false)}
              >
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePrevStory();
                  }}
                  className="w-[40%] h-full pointer-events-auto cursor-pointer"
                  aria-label="Previous story"
                />
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNextStory();
                  }}
                  className="w-[60%] h-full pointer-events-auto cursor-pointer"
                  aria-label="Next story"
                />
              </div>

              {/* Bottom CTA */}
              <div className="relative z-30 pt-1 pb-3 px-3.5 flex flex-col items-center justify-center shrink-0 w-full select-none bg-white pointer-events-auto">
                <ChevronUp className="w-4 h-4 text-charcoal/80 animate-bounce -mb-0.5 pointer-events-none" />
                <a
                  href="/login?role=creator"
                  onClick={(e) => e.stopPropagation()}
                  className="w-full max-w-[170px] py-1.5 px-3 rounded-xl bg-[#f2f2f5] hover:bg-[#eaebee] border border-black/8 shadow-[0_3px_12px_rgba(0,0,0,0.06)] flex items-center justify-center text-charcoal text-[11px] font-mono font-bold tracking-tight transition-all active:scale-95 cursor-pointer"
                >
                  <span>sellr.in</span>
                </a>
              </div>

              {/* Home Bar */}
              <div
                className="absolute bottom-1.5 inset-x-0 mx-auto w-18 h-1 rounded-full bg-charcoal/25 z-40 pointer-events-none"
                style={{ left: 0, right: 0, margin: "0 auto" }}
              />
            </div>
          </div>
        </div>

        {/* Bottom Dot Indicators */}
        <div className="flex items-center justify-center gap-1.5 shrink-0 pt-1">
          {steps.map((step, i) => (
            <button
              key={step.number}
              type="button"
              onClick={() => scrollToStep(i)}
              aria-label={`Go to step ${step.number}`}
              className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                i === activeIndex ? "w-6 bg-ink" : "w-1.5 bg-hairline-strong hover:bg-slate"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// DESKTOP VIEWPORT COMPONENT (Scroll-Driven Pinning + 10s Timer + Vertical Slide)
// ============================================================================
const DesktopSignalingCarousel: React.FC<SignalingCarouselProps> = ({ label, intro, steps, persona }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollTriggerRef = useRef<ScrollTrigger | null>(null);
  const activeIndexRef = useRef(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [isInView, setIsInView] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [timerResetCount, setTimerResetCount] = useState(0);

  const setPaused = useCallback((val: boolean) => {
    setIsPaused(val);
  }, []);

  // IntersectionObserver to only run auto-advance when section is in view
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => setIsInView(entry.isIntersecting),
      { threshold: 0.2 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Jump to specific step, smoothly scrolling the window
  const scrollToStep = useCallback((idx: number) => {
    const safeIndex = Math.min(steps.length - 1, Math.max(0, idx));
    setDirection(safeIndex >= activeIndexRef.current ? 1 : -1);
    setActiveIndex(safeIndex);
    activeIndexRef.current = safeIndex;
    setTimerResetCount((c) => c + 1);

    if (scrollTriggerRef.current) {
      const st = scrollTriggerRef.current;
      const progressFraction = (safeIndex + 0.5) / steps.length;
      const targetY = st.start + progressFraction * (st.end - st.start);
      const smoother = ScrollSmoother.get();
      if (smoother) {
        smoother.scrollTo(targetY, true);
      } else {
        window.scrollTo({ top: targetY, behavior: "smooth" });
      }
    }
  }, [steps.length]);

  // When the 10-second timer completes on desktop, advance to next story via scrollToStep
  const handleDesktopTimerComplete = useCallback(() => {
    const next = (activeIndexRef.current + 1) % steps.length;
    scrollToStep(next);
  }, [scrollToStep, steps.length]);

  // Desktop scroll-driven progression using ScrollTrigger with matchMedia
  useEffect(() => {
    const container = containerRef.current;
    if (!container || steps.length < 2) return;

    const scrollDistance = Math.max(1, steps.length - 1) * 600;

    const mm = gsap.matchMedia();
    mm.add("(min-width: 1024px)", () => {
      const st = ScrollTrigger.create({
        trigger: container,
        start: "top top",
        end: () => `+=${scrollDistance}`,
        pin: true,
        anticipatePin: 0,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          const next = Math.min(
            steps.length - 1,
            Math.max(0, Math.floor(self.progress * steps.length))
          );

          if (next !== activeIndexRef.current) {
            setDirection(next >= activeIndexRef.current ? 1 : -1);
            activeIndexRef.current = next;
            setActiveIndex(next);
            setTimerResetCount((c) => c + 1);
          }
        },
      });

      scrollTriggerRef.current = st;

      return () => {
        st.kill();
        scrollTriggerRef.current = null;
      };
    });

    return () => mm.revert();
  }, [steps.length]);

  const currentStep = steps[activeIndex] || steps[0];

  return (
    <div
      ref={containerRef}
      className="relative w-full h-[100svh] max-h-[1020px] min-h-[680px] bg-canvas overflow-hidden flex flex-col justify-center"
    >
      {/* Center Top Pill Badge without dirty blur */}
      <div
        className="absolute top-20 lg:top-24 inset-x-0 mx-auto w-fit z-20 flex items-center justify-center pointer-events-none"
        style={{ left: 0, right: 0, margin: "0 auto" }}
      >
        <div className="relative pointer-events-auto inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/95 backdrop-blur-md border border-hairline-strong text-charcoal text-[11px] font-mono font-semibold uppercase tracking-wider whitespace-nowrap shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
          <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
          {label}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-5 sm:px-8 md:px-12 w-full h-full flex flex-col justify-center">
        {/* Two Column Grid */}
        <div className="relative w-full grid grid-cols-2 gap-8 lg:gap-14 items-center max-w-6xl mx-auto px-6">
          {/* Left Section: Smooth Vertical Sliding Title */}
          <div className="flex flex-col justify-center min-h-[180px] lg:min-h-[220px] relative pr-6">
            <div className="relative z-10 min-h-[150px] flex flex-col justify-center overflow-hidden">
              <AnimatePresence mode="popLayout" custom={direction}>
                <motion.div
                  key={activeIndex}
                  custom={direction}
                  variants={{
                    enter: (dir: number) => ({
                      opacity: 0,
                      y: dir >= 0 ? 36 : -36,
                    }),
                    center: {
                      opacity: 1,
                      y: 0,
                    },
                    exit: (dir: number) => ({
                      opacity: 0,
                      y: dir >= 0 ? -36 : 36,
                    }),
                  }}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                >
                  <div className="text-[12px] font-mono font-semibold uppercase tracking-[1.8px] text-slate/80 mb-3">
                    Step {currentStep.number}
                  </div>
                  <h2 className="font-display font-bold text-[36px] lg:text-[44px] xl:text-[50px] leading-[1.08] text-ink tracking-[-0.03em]">
                    {currentStep.title}
                  </h2>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* Right Section: Stationary Phone Mockup with Vertical Inner Sliding */}
          <div className="flex items-center justify-center relative">
            <div
              className="relative shrink-0 flex items-center justify-center select-none will-change-transform"
              onMouseEnter={() => setPaused(true)}
              onMouseLeave={() => setPaused(false)}
              style={{
                height: "clamp(480px, 68svh, 590px)",
                width: "calc(clamp(480px, 68svh, 590px) / 2.048)",
                minHeight: "clamp(480px, 68svh, 590px)",
                maxHeight: "clamp(480px, 68svh, 590px)",
                minWidth: "calc(clamp(480px, 68svh, 590px) / 2.048)",
                maxWidth: "calc(clamp(480px, 68svh, 590px) / 2.048)",
                transform: "translate3d(0, 0, 0)",
                backfaceVisibility: "hidden",
              }}
            >
              <div className="relative w-full h-full rounded-[2.85rem] bg-[#121318] p-[3px] ring-1 ring-white/15 shadow-[0_25px_70px_-15px_rgba(0,0,0,0.35)] overflow-visible">
                {/* Left Buttons: Action + Volume */}
                <div className="absolute -left-[2.5px] top-[17%] h-5 w-[2.5px] rounded-l-full bg-[#25252a]" />
                <div className="absolute -left-[2.5px] top-[26%] h-11 w-[2.5px] rounded-l-full bg-[#25252a]" />
                <div className="absolute -left-[2.5px] top-[37%] h-11 w-[2.5px] rounded-l-full bg-[#25252a]" />
                {/* Right Buttons: Power + Camera Control */}
                <div className="absolute -right-[2.5px] top-[29%] h-14 w-[2.5px] rounded-r-full bg-[#25252a]" />
                <div className="absolute -right-[2px] top-[67%] h-11 w-[2px] rounded-r-full bg-[#222226]" />

                {/* Inner Screen */}
                <div className="relative w-full h-full rounded-[2.7rem] overflow-hidden bg-white ring-1 ring-white/10 flex flex-col justify-between min-w-0 min-h-0 border border-black/5 select-none">
                  {/* Dynamic Island */}
                  <div
                    className="absolute top-2.5 inset-x-0 mx-auto w-[28%] max-w-[72px] h-[18px] rounded-full bg-black z-40 flex items-center justify-center pointer-events-none ring-1 ring-white/5 shadow-inner"
                    style={{ left: 0, right: 0, margin: "0 auto" }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-[#111116] ml-auto mr-1.5 shrink-0 border border-white/5" />
                  </div>

                  {/* Pinned Top Story Header & 5-Segment Progress Bar */}
                  <div className="relative z-30 pt-9.5 px-4 pb-1 shrink-0 flex flex-col gap-1.5 select-none bg-white">
                    <div className="relative w-full flex items-center gap-1 pt-0.5 px-0.5 shrink-0 pointer-events-auto">
                      {steps.map((_, i) => (
                        <div
                          key={i}
                          onClick={(e) => {
                            e.stopPropagation();
                            scrollToStep(i);
                          }}
                          className="h-1 flex-1 rounded-full bg-charcoal/15 overflow-hidden cursor-pointer"
                          title={`Step ${i + 1}`}
                        >
                          {i < activeIndex ? (
                            <div className="h-full w-full bg-charcoal rounded-full" />
                          ) : i === activeIndex ? (
                            <div
                              key={`desktop-active-${activeIndex}-${timerResetCount}`}
                              className="h-full bg-charcoal rounded-full story-bar-active"
                              style={{
                                animationPlayState: isInView && !isPaused ? "running" : "paused",
                              }}
                              onAnimationEnd={handleDesktopTimerComplete}
                            />
                          ) : (
                            <div className="h-full w-0 bg-charcoal rounded-full" />
                          )}
                        </div>
                      ))}
                    </div>

                    <div className="relative flex items-center justify-between pt-1 pb-0.5 shrink-0">
                      <div className="flex items-center gap-2">
                        <div className="size-6 rounded-full bg-charcoal flex items-center justify-center text-white text-[9.5px] font-mono font-bold shadow-xs">
                          s.
                        </div>
                        <div className="flex flex-col leading-tight">
                          <span className="font-mono font-bold text-[12px] text-charcoal tracking-tight">
                            {persona === "brand" ? "sellr.in/brand" : "sellr.in"}
                          </span>
                          <span className="text-[9.5px] font-mono font-semibold text-charcoal/60">
                            Step {currentStep.number} / 05
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-charcoal/50">
                        <button type="button" className="p-1 hover:text-charcoal transition-colors" aria-label="Menu">
                          <MoreHorizontal className="w-3.5 h-3.5" />
                        </button>
                        <button type="button" className="p-1 hover:text-charcoal transition-colors" aria-label="Close">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Middle Story Canvas with smooth Vertical Animated transition */}
                  <div className="relative z-10 flex-1 min-h-0 w-full overflow-hidden my-auto flex flex-col justify-center">
                    <AnimatePresence mode="popLayout" custom={direction}>
                      <motion.div
                        key={activeIndex}
                        custom={direction}
                        variants={{
                          enter: (dir: number) => ({
                            opacity: 0,
                            y: dir >= 0 ? 36 : -36,
                          }),
                          center: {
                            opacity: 1,
                            y: 0,
                          },
                          exit: (dir: number) => ({
                            opacity: 0,
                            y: dir >= 0 ? -36 : 36,
                          }),
                        }}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                        className={`w-full h-full flex flex-col justify-center px-4 py-1.5 relative overflow-hidden select-none ${TINT_CLASS[currentStep.tint]}`}
                      >
                        <span className="absolute -top-2 -right-1 text-[75px] font-bold leading-none text-charcoal/[0.04] select-none pointer-events-none font-display">
                          {currentStep.number}
                        </span>

                        <div className="relative z-10 my-auto py-1 flex flex-col gap-2 min-h-0 justify-center">
                          <div className="shrink-0">
                            <span className="inline-block text-[9px] font-mono font-bold uppercase tracking-wider text-charcoal/50">
                              Step {currentStep.number} • Walkthrough
                            </span>
                            <h3 className="mt-0.5 font-display font-bold text-[17px] leading-tight text-charcoal tracking-tight">
                              {currentStep.title}
                            </h3>
                          </div>

                          <div className="w-full my-0.5 shrink-0 pointer-events-auto" onClick={(e) => e.stopPropagation()}>
                            {renderPlatformSnippet(currentStep.number, persona)}
                          </div>

                          <p className="text-[11px] leading-snug text-charcoal/80 shrink-0">
                            {currentStep.description}
                          </p>
                        </div>
                      </motion.div>
                    </AnimatePresence>
                  </div>

                  {/* Bottom CTA */}
                  <div className="relative z-30 pt-1 pb-3.5 px-4 flex flex-col items-center justify-center shrink-0 w-full select-none bg-white pointer-events-auto">
                    <ChevronUp className="w-4 h-4 text-charcoal/80 animate-bounce -mb-0.5 pointer-events-none" />
                    <a
                      href={persona === "brand" ? "/login?role=brand" : "/login?role=creator"}
                      onClick={(e) => e.stopPropagation()}
                      className="w-full max-w-[170px] py-1.5 px-3 rounded-xl bg-[#f2f2f5] hover:bg-[#eaebee] border border-black/8 shadow-[0_3px_12px_rgba(0,0,0,0.06)] flex items-center justify-center text-charcoal text-[11px] font-mono font-bold tracking-tight transition-all active:scale-95 cursor-pointer"
                    >
                      <span>{persona === "brand" ? "sellr.in/brand" : "sellr.in"}</span>
                    </a>
                  </div>

                  {/* Home Bar */}
                  <div
                    className="absolute bottom-2 inset-x-0 mx-auto w-24 h-1 rounded-full bg-charcoal/25 z-40 pointer-events-none"
                    style={{ left: 0, right: 0, margin: "0 auto" }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// MAIN COMPONENT (Tailwind Separated Viewports)
// ============================================================================
const SignalingCarousel: React.FC<SignalingCarouselProps> = (props) => {
  return (
    <section id="signaling-factor" className="w-full bg-canvas border-t border-hairline">
      {/* Scoped CSS animation for the active 10s progress bar on both viewports */}
      <style>{`
        @keyframes fillProgressBar {
          from { width: 0%; }
          to { width: 100%; }
        }
        .story-bar-active {
          animation: fillProgressBar 10s linear forwards;
        }
      `}</style>

      {/* Mobile Viewport - Pure Tailwind block lg:hidden */}
      <div className="block lg:hidden w-full">
        <MobileSignalingCarousel {...props} />
      </div>

      {/* Desktop Viewport - Pure Tailwind hidden lg:block */}
      <div className="hidden lg:block w-full">
        <DesktopSignalingCarousel {...props} />
      </div>
    </section>
  );
};

export default SignalingCarousel;


