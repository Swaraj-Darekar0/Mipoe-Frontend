import React, { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { MoreHorizontal, X, ChevronUp, Check, Sparkles, ExternalLink } from "lucide-react";
import type { CarouselStep } from "./personaContent";

gsap.registerPlugin(ScrollTrigger);

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
}

const SignalingCarousel: React.FC<SignalingCarouselProps> = ({ label, intro, steps }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollTriggerRef = useRef<ScrollTrigger | null>(null);
  const activeIndexRef = useRef(0);
  const [activeIndex, setActiveIndex] = useState(0);

  // Viewport detection
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth < 1024 : false
  );

  // In-view detection for 10s auto-advance
  const [isInView, setIsInView] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const isPausedRef = useRef(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // IntersectionObserver to only auto-advance when section is in view
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInView(entry.isIntersecting);
      },
      { threshold: 0.2 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // 10-second auto-advance timer when in view and not paused
  useEffect(() => {
    // Mobile is fully scroll-driven; auto-advancing would fight the user's scroll position.
    if (!isInView || isMobile) return;

    const timer = setInterval(() => {
      if (!isPausedRef.current) {
        setActiveIndex((prev) => {
          const next = (prev + 1) % steps.length;
          activeIndexRef.current = next;
          return next;
        });
      }
    }, 10000);

    return () => clearInterval(timer);
  }, [isInView, isMobile, steps.length]);

  // Scroll-driven progression. Desktop uses a single pinned ScrollTrigger;
  // mobile uses native page scrolling so touch/trackpad scrolling stays natural.
  useEffect(() => {
    const container = containerRef.current;
    if (!container || steps.length < 2) return;

    if (isMobile) {
      const updateFromScroll = () => {
        const rect = container.getBoundingClientRect();
        const scrollable = Math.max(1, container.offsetHeight - window.innerHeight);
        const progress = Math.min(1, Math.max(0, -rect.top / scrollable));
        const next = Math.min(
          steps.length - 1,
          Math.max(0, Math.round(progress * (steps.length - 1)))
        );

        if (next !== activeIndexRef.current) {
          activeIndexRef.current = next;
          setActiveIndex(next);
        }
      };

      let raf = 0;
      const onScroll = () => {
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(updateFromScroll);
      };

      updateFromScroll();
      window.addEventListener("scroll", onScroll, { passive: true });
      window.addEventListener("resize", onScroll);

      return () => {
        cancelAnimationFrame(raf);
        window.removeEventListener("scroll", onScroll);
        window.removeEventListener("resize", onScroll);
      };
    }

    const scrollDistance = Math.max(1, steps.length - 1) * 650;
    const st = ScrollTrigger.create({
      trigger: container,
      start: "top top",
      end: () => `+=${scrollDistance}`,
      scrub: 0.65,
      pin: true,
      anticipatePin: 1,
      invalidateOnRefresh: true,
      onUpdate: (self) => {
        const currentStep = Math.min(
          steps.length - 1,
          Math.max(0, Math.round(self.progress * (steps.length - 1)))
        );

        if (currentStep !== activeIndexRef.current) {
          activeIndexRef.current = currentStep;
          setActiveIndex(currentStep);
        }
      },
    });

    scrollTriggerRef.current = st;

    return () => {
      st.kill();
      scrollTriggerRef.current = null;
    };
  }, [steps, isMobile]);

  // Touch is intentionally left to the browser. Mobile progression is driven by
  // native vertical scrolling rather than tap-to-advance interactions.

  // Jump to a specific step. On mobile this scrolls through the native page;
  // on desktop it seeks inside the pinned ScrollTrigger range.
  const scrollToStep = (idx: number) => {
    const safeIndex = Math.min(steps.length - 1, Math.max(0, idx));
    setActiveIndex(safeIndex);
    activeIndexRef.current = safeIndex;

    if (!isMobile && scrollTriggerRef.current) {
      const st = scrollTriggerRef.current;
      const progressFraction = safeIndex / Math.max(1, steps.length - 1);
      const targetY = st.start + progressFraction * (st.end - st.start);
      window.scrollTo({ top: targetY, behavior: "smooth" });
      return;
    }

    if (isMobile && containerRef.current) {
      const scrollable = Math.max(1, containerRef.current.offsetHeight - window.innerHeight);
      const targetY =
        containerRef.current.offsetTop +
        (safeIndex / Math.max(1, steps.length - 1)) * scrollable;
      window.scrollTo({ top: targetY, behavior: "smooth" });
    }
  };

  // Real Sellr Platform UI Snippets tailored to each step
  const renderPlatformSnippet = (stepNumber: string) => {
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

  // Story Inner Screen Canvas
  const renderStoryScreen = (step: CarouselStep) => (
    <div
      className={`relative w-full h-full ${TINT_CLASS[step.tint]} pt-8 pb-3.5 px-3.5 sm:px-4 flex flex-col justify-between overflow-hidden select-none border ${TINT_BORDER[step.tint]} rounded-[36px]`}
    >
      {/* Scoped CSS animation for the active 10s progress bar */}
      <style>{`
        @keyframes fillProgressBar {
          from { width: 0%; }
          to { width: 100%; }
        }
        .story-bar-active {
          animation: fillProgressBar 10s linear forwards;
        }
      `}</style>

      {/* Subtle watermark step number */}
      <span className="absolute -top-3 -right-1 text-[60px] sm:text-[75px] font-bold leading-none text-charcoal/[0.04] select-none pointer-events-none font-display">
        {step.number}
      </span>

      {/* Top 5-Segment Story Progress Bars */}
      <div className="relative z-10 w-full flex items-center gap-1 pt-0.5 px-0.5 shrink-0">
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
                key={`active-${activeIndex}`}
                className="h-full bg-charcoal rounded-full story-bar-active"
                style={{
                  animationPlayState: isInView && !isPaused ? "running" : "paused",
                }}
              />
            ) : (
              <div className="h-full w-0 bg-charcoal rounded-full" />
            )}
          </div>
        ))}
      </div>

      {/* Story Header: Brand Name and Step Count Only */}
      <div className="relative z-10 flex items-center justify-between pt-1.5 pb-1 shrink-0">
        <div className="flex items-center gap-2">
          <div className="size-6 rounded-full bg-charcoal flex items-center justify-center text-white text-[9.5px] font-mono font-bold shadow-xs">
            s.
          </div>
          <div className="flex flex-col leading-tight">
            <span className="font-mono font-bold text-[12px] text-charcoal tracking-tight">
              sellr.in
            </span>
            <span className="text-[9.5px] font-mono font-semibold text-charcoal/60">
              Step {step.number} / 05
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1 text-charcoal/50">
          <button type="button" className="hover:text-charcoal transition-colors p-1" aria-label="Menu">
            <MoreHorizontal className="w-3.5 h-3.5" />
          </button>
          <button type="button" className="hover:text-charcoal transition-colors p-1" aria-label="Close">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Story Body: Title, Real Platform UI Snippet, and Explanatory Text */}
      <div className="relative z-10 my-auto py-1.5 flex flex-col gap-2 min-h-0 flex-1 justify-center">
        <div className="shrink-0">
          <span className="inline-block text-[9px] font-mono font-bold uppercase tracking-wider text-charcoal/50">
            Step {step.number} • Walkthrough
          </span>
          <h3 className="mt-0.5 font-display font-bold text-[16px] sm:text-[18px] leading-tight text-charcoal tracking-tight line-clamp-1">
            {step.title}
          </h3>
        </div>

        {/* Embedded Platform UI Snippet */}
        <div className="w-full my-0.5 shrink-0">
          {renderPlatformSnippet(step.number)}
        </div>

        {/* Narrative Explanation */}
        <p className="text-[10.5px] sm:text-[11px] leading-snug text-charcoal/80 line-clamp-3 shrink-0">
          {step.description}
        </p>
      </div>

      {/* Bottom Swipe-Up CTA: Centered with bouncing ChevronUp & off-white rounded rectangle */}
      <div className="relative z-30 pt-1 flex flex-col items-center justify-center shrink-0 w-full select-none">
        {/* Bouncing single-stroke upward chevron without vertical stick */}
        <ChevronUp className="w-4 h-4 text-charcoal/80 animate-bounce -mb-0.5" />

        {/* Off-white rounded rectangle box button */}
        <a
          href="/login?role=creator"
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-[170px] py-1.5 px-3 rounded-xl bg-[#f2f2f5] hover:bg-[#eaebee] border border-black/8 shadow-[0_3px_12px_rgba(0,0,0,0.06)] flex items-center justify-center text-charcoal text-[11px] font-mono font-bold tracking-tight transition-all active:scale-95"
        >
          <span>sellr.in</span>
        </a>
      </div>
    </div>
  );

  const currentStep = steps[activeIndex] || steps[0];

  return (
    <section id="signaling-factor" className="w-full bg-canvas border-t border-hairline">
      <div
        ref={containerRef}
        className={`relative w-full ${
          isMobile
            ? "min-h-[500svh] bg-canvas"
            : "h-[100svh] max-h-[1020px] min-h-[680px] bg-canvas overflow-hidden"
        }`}
      >
        <div className={`max-w-7xl mx-auto px-5 sm:px-8 md:px-12 w-full h-full`}>
          {isMobile ? (
            /* ================= MOBILE VIEWPORT (Native scroll + iPhone 16 Pro) ================= */
            <div className="sticky top-0 h-[100svh] flex flex-col items-center justify-between w-full pt-14 pb-3 px-4 overflow-hidden">
              <div className="text-center max-w-sm mx-auto shrink-0">
                <span className="inline-block text-[10px] sm:text-[11px] font-mono font-semibold uppercase tracking-[1.5px] text-slate/80">
                  {label}
                </span>
                <h2 className="mt-0.5 font-semibold text-[17px] sm:text-[20px] leading-tight tracking-[-0.02em] text-ink">
                  {intro}
                </h2>
              </div>

              {/* Slender, elongated iPhone 16/17 mockup for mobile */}
              <div className="relative w-full flex-1 min-h-0 flex items-center justify-center my-1 select-none">
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-[min(340px,85vw)] h-[min(340px,85vw)] rounded-full bg-black/10 blur-[60px]" />
                </div>
                <div
                  className="relative rounded-[2.75rem] bg-[#121318] p-[3px] ring-1 ring-white/15 shadow-[0_25px_70px_-20px_rgba(0,0,0,0.65)] overflow-visible shrink-0"
                  style={{
                    height: "clamp(400px, 58svh, 510px)",
                    width: "calc(clamp(400px, 58svh, 510px) / 2.048)",
                    minHeight: "clamp(400px, 58svh, 510px)",
                    maxHeight: "clamp(400px, 58svh, 510px)",
                    minWidth: "calc(clamp(400px, 58svh, 510px) / 2.048)",
                    maxWidth: "calc(clamp(400px, 58svh, 510px) / 2.048)",
                  }}
                >
                  {/* Left Buttons: Action + Volume */}
                  <div className="absolute -left-[2.5px] top-[17%] h-4 w-[2.5px] rounded-l-full bg-[#25252a]" />
                  <div className="absolute -left-[2.5px] top-[26%] h-10 w-[2.5px] rounded-l-full bg-[#25252a]" />
                  <div className="absolute -left-[2.5px] top-[37%] h-10 w-[2.5px] rounded-l-full bg-[#25252a]" />
                  {/* Right Buttons: Power + Camera Control */}
                  <div className="absolute -right-[2.5px] top-[29%] h-13 w-[2.5px] rounded-r-full bg-[#25252a]" />
                  <div className="absolute -right-[2px] top-[67%] h-9 w-[2px] rounded-r-full bg-[#222226]" />

                  <div className="relative w-full h-full rounded-[2.6rem] overflow-hidden bg-black ring-1 ring-white/10 flex flex-col min-w-0 min-h-0">
                    {/* Centered Dynamic Island Notch */}
                    <div
                      className="absolute top-2 inset-x-0 mx-auto w-[28%] max-w-[74px] h-[18px] rounded-full bg-black z-40 flex items-center justify-center pointer-events-none ring-1 ring-white/5 shadow-inner"
                      style={{ left: 0, right: 0, margin: "0 auto" }}
                    >
                      <span className="w-2 h-2 rounded-full bg-[#111116] ml-auto mr-1.5 shrink-0 border border-white/5" />
                    </div>
                    <div className="relative w-full h-full overflow-hidden flex flex-col min-w-0 min-h-0">
                      {renderStoryScreen(currentStep)}
                    </div>
                    {/* Centered Home Bar */}
                    <div
                      className="absolute bottom-1.5 inset-x-0 mx-auto w-18 h-1 rounded-full bg-charcoal/25 z-40 pointer-events-none"
                      style={{ left: 0, right: 0, margin: "0 auto" }}
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-center gap-1.5 shrink-0 pt-0.5">
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
          ) : (
            /* ================= DESKTOP VIEWPORT (Minimal + scroll driven) ================= */
            <div className="relative w-full h-full flex flex-col justify-center">
              {/* Only the "How Creators Earn / How Brands Win" part in the center with dark glow shadow */}
              <div
                className="absolute top-20 lg:top-22 inset-x-0 mx-auto w-fit z-20 flex items-center justify-center pointer-events-none"
                style={{ left: 0, right: 0, margin: "0 auto" }}
              >
                {/* Dark glow behind the badge */}
                <div className="absolute inset-0 rounded-full bg-black/25 blur-lg scale-110 pointer-events-none" />
                <div className="relative pointer-events-auto inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-canvas/90 backdrop-blur-md border border-charcoal/15 text-charcoal text-[11px] font-mono font-semibold uppercase tracking-wider whitespace-nowrap shadow-[0_4px_24px_rgba(0,0,0,0.18)]">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
                  {label}
                </div>
              </div>

              {/* Two separate sections (left & right): Left has title with dark glow, Right centers the phone mockup */}
              <div className="relative w-full grid grid-cols-2 gap-8 lg:gap-14 items-center max-w-6xl mx-auto px-6">
                {/* Left Section: Story title with dark glow behind text */}
                <div className="flex flex-col justify-center min-h-[160px] relative pr-6">
                  {/* Dark glow shadow behind text */}
                  <div className="absolute -inset-x-10 -inset-y-8 rounded-full bg-black/15 blur-[60px] pointer-events-none" />
                  <div className="relative z-10">
                    <div className="text-[12px] font-mono font-semibold uppercase tracking-[1.8px] text-slate/80 mb-3 drop-shadow-[0_2px_8px_rgba(0,0,0,0.12)]">
                      Step {currentStep.number}
                    </div>
                    <h2
                      className="font-display font-bold text-[36px] lg:text-[46px] xl:text-[54px] leading-[1.08] text-ink tracking-[-0.03em]"
                      style={{
                        filter: "drop-shadow(0 10px 25px rgba(0,0,0,0.16))",
                      }}
                    >
                      {currentStep.title}
                    </h2>
                  </div>
                </div>

                {/* Right Section: Centered slender iPhone 16/17 mockup - Strictly locked length & breadth */}
                <div className="flex items-center justify-center relative">
                  <div
                    className="relative shrink-0 flex items-center justify-center select-none"
                    style={{
                      height: "clamp(480px, 68svh, 590px)",
                      width: "calc(clamp(480px, 68svh, 590px) / 2.048)",
                      minHeight: "clamp(480px, 68svh, 590px)",
                      maxHeight: "clamp(480px, 68svh, 590px)",
                      minWidth: "calc(clamp(480px, 68svh, 590px) / 2.048)",
                      maxWidth: "calc(clamp(480px, 68svh, 590px) / 2.048)",
                    }}
                  >
                    <div className="absolute inset-[6%] rounded-full bg-black/15 blur-[55px] scale-105 pointer-events-none" />
                    <div className="relative w-full h-full rounded-[2.85rem] bg-[#121318] p-[3px] ring-1 ring-white/15 shadow-[0_30px_85px_-20px_rgba(0,0,0,0.55)] overflow-visible">
                      {/* Left Buttons: Action + Volume */}
                      <div className="absolute -left-[2.5px] top-[17%] h-5 w-[2.5px] rounded-l-full bg-[#25252a]" />
                      <div className="absolute -left-[2.5px] top-[26%] h-11 w-[2.5px] rounded-l-full bg-[#25252a]" />
                      <div className="absolute -left-[2.5px] top-[37%] h-11 w-[2.5px] rounded-l-full bg-[#25252a]" />
                      {/* Right Buttons: Power + Camera Control */}
                      <div className="absolute -right-[2.5px] top-[29%] h-14 w-[2.5px] rounded-r-full bg-[#25252a]" />
                      <div className="absolute -right-[2px] top-[67%] h-11 w-[2px] rounded-r-full bg-[#222226]" />

                      <div className="relative w-full h-full rounded-[2.7rem] overflow-hidden bg-black ring-1 ring-white/10 flex flex-col min-w-0 min-h-0">
                        {/* Centered Dynamic Island Notch */}
                        <div
                          className="absolute top-2.5 inset-x-0 mx-auto w-[28%] max-w-[76px] h-[19px] rounded-full bg-black z-40 flex items-center justify-center pointer-events-none ring-1 ring-white/5 shadow-inner"
                          style={{ left: 0, right: 0, margin: "0 auto" }}
                        >
                          <span className="w-2 h-2 rounded-full bg-[#111116] ml-auto mr-1.5 shrink-0 border border-white/5" />
                        </div>
                        <div className="relative w-full h-full overflow-hidden flex flex-col min-w-0 min-h-0">
                          {renderStoryScreen(currentStep)}
                        </div>
                        {/* Centered Home Bar */}
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
          )}
        </div>
      </div>
    </section>
  );
};

export default SignalingCarousel;


