import React, { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import RandomDoodleUnderline from "./RandomDoodleUnderline";
import HighlightedText from "./HighlightedText";
import { SquishyWord } from "./SquishySectionHeading";

gsap.registerPlugin(ScrollTrigger);

interface DropCard {
  id: string;
  brand: string;
  tagline: string;
  videoSrc: string;
  posterSrc: string;
  bgColor: string;
  btnBg: string;
  btnText: string;
  btnLabel: string;
  btnHref: string;
}

const DROPS: DropCard[] = [
  {
    id: "01",
    brand: "Label Ananya",
    tagline: "INDO-WESTERN DROP",
    videoSrc: "/assets/videos/desi_black_lehenga_trans.mp4",
    posterSrc: "/thumbnails/desi_black_trans_poster.webp",
    bgColor: "#0038ff", // Sellr Royal Blue frame
    btnBg: "#ff77cd",   // Sellr Hot Pink button
    btnText: "#000000",
    btnLabel: "EXPLORE CAMPAIGNS",
    btnHref: "/login?role=creator",
  },
  {
    id: "02",
    brand: "Noor Beauty",
    tagline: "EVERYDAY GRWM REELS",
    videoSrc: "/assets/videos/indian_genz_grwm_beauty.mp4",
    posterSrc: "/thumbnails/indian_genz_grwm_poster.webp",
    bgColor: "#ff5f04", // Sellr Vivid Orange frame
    btnBg: "#ffffff",   // High-contrast clean white button
    btnText: "#000000",
    btnLabel: "EXPLORE DROP",
    btnHref: "/login?role=creator",
  },
  {
    id: "03",
    brand: "Zari & Co.",
    tagline: "FESTIVE STYLING EDIT",
    videoSrc: "/assets/videos/indian_festive_grwm.mp4",
    posterSrc: "/thumbnails/indian_festive_grwm_poster.webp",
    bgColor: "#141418", // Cinema Charcoal frame with subtle white glow
    btnBg: "#ff77cd",   // Hot Pink button
    btnText: "#000000",
    btnLabel: "JOIN CAMPAIGN",
    btnHref: "/login?role=creator",
  },
];

/**
 * Isolated Action Pill Component
 * Features:
 * - GSAP-driven button scale (1.06) with overwrite: "auto", completely avoiding CSS transition boundary oscillation
 * - Notifies parent card to freeze/neutralize card squish upon button hover
 * - Smooth RandomDoodleUnderline reveal
 */
const ReelActionPill: React.FC<{
  drop: DropCard;
}> = ({ drop }) => {
  const [isHovered, setIsHovered] = useState(false);
  const btnRef = useRef<HTMLAnchorElement>(null);
  const scaleTo = useRef<gsap.QuickToFunc | null>(null);

  useEffect(() => {
    if (!btnRef.current) return;
    scaleTo.current = gsap.quickTo(btnRef.current, "scale", {
      duration: 0.2,
      ease: "power2.out",
    });
    return () => {
      if (btnRef.current) gsap.killTweensOf(btnRef.current);
    };
  }, []);

  const handleMouseEnter = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsHovered(true);
    scaleTo.current?.(1.05);
  };

  const handleMouseLeave = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsHovered(false);
    scaleTo.current?.(1);
  };

  return (
    <div className="relative inline-flex flex-col items-center p-1">
      <a
        ref={btnRef}
        href={drop.btnHref}
        onClick={(e) => e.stopPropagation()}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="inline-flex items-center gap-2.5 px-6 py-2.5 rounded-xl text-xs sm:text-[13px] font-mono font-bold uppercase tracking-wider shadow-2xl cursor-pointer border border-black/10 select-none transform-gpu active:scale-95"
        style={{ backgroundColor: drop.btnBg, color: drop.btnText }}
      >
        <span className="w-5 h-5 rounded-full flex items-center justify-center bg-black/15 font-sans font-bold">
          →
        </span>
        <span>{drop.btnLabel}</span>
      </a>
      <RandomDoodleUnderline
        isHovered={isHovered}
        accentColor={drop.btnBg === "#ffffff" ? "#ff5f04" : "#ffffff"}
      />
    </div>
  );
};

/**
 * Desktop Stacking Drop Card Component
 * Separates an unscaled outer pointer hitbox from the inner visual card so
 * cursor hover near edges or the CTA button never oscillates or flickers.
 */
const DesktopDropCard: React.FC<{
  drop: DropCard;
  index: number;
  total: number;
}> = ({ drop }) => {
  const cardVisualRef = useRef<HTMLDivElement>(null);
  const scaleTo = useRef<gsap.QuickToFunc | null>(null);

  useEffect(() => {
    if (!cardVisualRef.current) return;
    scaleTo.current = gsap.quickTo(cardVisualRef.current, "scale", {
      duration: 0.24,
      ease: "power2.out",
    });
    return () => {
      if (cardVisualRef.current) gsap.killTweensOf(cardVisualRef.current);
    };
  }, []);

  const handleCardEnter = () => {
    scaleTo.current?.(1.015);
  };

  const handleCardLeave = () => {
    scaleTo.current?.(1);
  };

  const handlePointerDown = () => {
    scaleTo.current?.(0.99);
  };

  const handlePointerUp = () => {
    scaleTo.current?.(1.015);
  };

  return (
    <div
      data-featured-slide
      onMouseEnter={handleCardEnter}
      onMouseLeave={handleCardLeave}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onClick={() => {
        window.location.href = drop.btnHref;
      }}
      className="absolute inset-0 w-full h-full cursor-pointer select-none"
      style={{ backfaceVisibility: "hidden" }}
    >
      {/* Inner visual frame scales cleanly inside stable hitbox */}
      <div
        ref={cardVisualRef}
        className="w-full h-full rounded-[2rem] overflow-hidden border border-white/20 shadow-[0_30px_90px_rgba(0,0,0,0.7)] p-2.5 sm:p-3.5 flex flex-col justify-between transform-gpu"
        style={{ backgroundColor: drop.bgColor, backfaceVisibility: "hidden" }}
      >
        {/* Full-Bleed Media Reel Container */}
        <div
          className="relative w-full h-full rounded-[1.4rem] overflow-hidden bg-black flex items-center justify-center"
          style={{ transform: "translateZ(0)", backfaceVisibility: "hidden" }}
        >
          <video
            src={drop.videoSrc}
            autoPlay
            loop
            muted
            playsInline
            poster={drop.posterSrc}
            className="w-full h-full object-cover opacity-95 pointer-events-none"
            style={{ backfaceVisibility: "hidden" }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent pointer-events-none" />

          {/* Bottom Flex Stack: Tagline, Brand Title & Action Button */}
          <div className="absolute inset-x-0 bottom-4 sm:bottom-5 px-6 flex flex-col items-center justify-end z-20 pointer-events-none select-none">
            <span className="text-[10px] sm:text-[11px] font-mono uppercase tracking-[3px] text-white/70 block mb-1">
              {drop.tagline}
            </span>
            <h3 className="text-3xl sm:text-4xl md:text-5xl font-display font-black uppercase tracking-tight text-white drop-shadow-[0_8px_24px_rgba(0,0,0,0.7)] mb-3 text-center">
              {drop.brand}
            </h3>
            <div className="pointer-events-auto">
              <ReelActionPill drop={drop} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const FeaturedStackingReels: React.FC = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const pinRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const badgeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const pin = pinRef.current;
    const root = rootRef.current;
    const badge = badgeRef.current;
    if (!section || !pin || !root) return;

    const cards = gsap.utils.toArray<HTMLElement>(root.querySelectorAll("[data-featured-slide]"));
    if (cards.length < 2) return;

    const mm = gsap.matchMedia();

    // 1. DESKTOP VIEW (>= 1024px): 3D Pinned Stacking Sequence & Perspective Tilt
    mm.add("(min-width: 992px)", () => {
      const g = 120; // z-depth step
      const t = 40;  // y-offset step
      const p = 1;

      // Initialize card positions in 3D perspective space
      cards.forEach((card, i) => {
        gsap.set(card, {
          z: -i * g,
          y: -i * t,
          zIndex: cards.length - i,
          autoAlpha: 1,
          transformOrigin: "center center",
        });
      });

      // Build 3D stacking scroll timeline
      const tl = gsap.timeline({ paused: true });

      cards.forEach((card, i) => {
        if (i === cards.length - 1) return;
        const w = i * p;

        // Slide the active card down out of view
        tl.to(
          card,
          {
            y: `+=${window.innerHeight * 0.9}`,
            ease: "power2.in",
            autoAlpha: 0,
            duration: p,
          },
          w
        );

        // Bring subsequent cards forward smoothly
        for (let j = i + 1; j < cards.length; j++) {
          const s = cards[j];
          tl.to(
            s,
            {
              z: `+=${g}`,
              y: `+=${t}`,
              ease: "power2.out",
              duration: p,
            },
            w
          );
        }
      });

      // ScrollTrigger pinning the stack
      const st = ScrollTrigger.create({
        trigger: pin,
        start: "top top",
        end: () => `+=${window.innerHeight * 2.5}`,
        pin: true,
        pinSpacing: true,
        scrub: 0.35,
        refreshPriority: 5,
        invalidateOnRefresh: true,
        onUpdate: (self) => tl.progress(self.progress),
      });

      // Interactive 3D tilt tracking cursor across card stack
      const tiltXTo = gsap.quickTo(root, "rotationX", { duration: 0.6, ease: "power3" });
      const tiltYTo = gsap.quickTo(root, "rotationY", { duration: 0.6, ease: "power3" });

      const onMouseMove = (e: MouseEvent) => {
        const rect = pin.getBoundingClientRect();
        const q = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;
        tiltXTo(-y * 6);
        tiltYTo(q * 10);
      };

      const onMouseLeave = () => {
        tiltXTo(0);
        tiltYTo(0);
      };

      pin.addEventListener("mousemove", onMouseMove, { passive: true });
      pin.addEventListener("mouseleave", onMouseLeave);

      return () => {
        st.kill();
        tl.kill();
        pin.removeEventListener("mousemove", onMouseMove);
        pin.removeEventListener("mouseleave", onMouseLeave);
      };
    });

    // 2. SCROLL-ONLY BADGE ROTATION (stops immediately when user stops scrolling)
    let badgeSt: ScrollTrigger | null = null;
    let badgeScrubTween: gsap.core.Tween | null = null;
    if (badge) {
      badgeScrubTween = gsap.fromTo(
        badge,
        { rotation: 0 },
        { rotation: 720, ease: "none", paused: true }
      );
      badgeSt = ScrollTrigger.create({
        trigger: section,
        start: "top bottom",
        end: "bottom top",
        animation: badgeScrubTween,
        scrub: 0.15,
        refreshPriority: -1,
        invalidateOnRefresh: true,
      });
    }

    // 3. MOBILE & TABLET VIEW (< 1024px): Vertical Parallax Depth Scroll
    mm.add("(max-width: 991px)", () => {
      const mobileCards = gsap.utils.toArray<HTMLElement>(
        section.querySelectorAll("[data-mobile-parallax-card]")
      );

      const triggers = mobileCards.map((card, i) => {
        const offset = (i - 1) * 20;
        return ScrollTrigger.create({
          trigger: card,
          start: "top bottom",
          end: "bottom top",
          scrub: 0.5,
          onUpdate: (self) => {
            gsap.set(card, {
              y: (self.progress - 0.5) * offset,
            });
          },
        });
      });

      return () => {
        triggers.forEach((t) => t.kill());
      };
    });

    return () => {
      if (badgeSt) badgeSt.kill();
      if (badgeScrubTween) badgeScrubTween.kill();
      mm.revert();
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      id="featured-drops"
      className="relative w-full bg-[#0a0a0c] text-white border-t border-white/10"
    >
      <div
        ref={pinRef}
        className="w-full min-h-[100svh] flex flex-col justify-between py-8 sm:py-10 lg:py-12 px-4 sm:px-6 md:px-12 max-w-7xl mx-auto box-border overflow-visible relative"
      >
        {/* Top Centered Header Row with Squishy Physics & Signature Single-Color Chisel Highlight */}
        <div className="flex flex-col items-center justify-center text-center w-full pt-10 sm:pt-14 md:pt-16 pb-4 sm:pb-6 shrink-0 select-none">
          <p className="font-serif italic text-white/80 text-[14px] sm:text-[17px] lg:text-[19px] tracking-tight max-w-xl leading-snug">
            High-converting creator reels built for real brand ROI.
          </p>
          <h2 className="mt-1.5 sm:mt-2 text-[36px] sm:text-[54px] lg:text-[76px] font-display font-black uppercase tracking-tight text-white leading-none flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
            <SquishyWord text="RECENT" />
            <HighlightedText colorClass="bg-white/20" textColorClass="text-white">
              CAMPAIGNS
            </HighlightedText>
          </h2>
        </div>

        {/* 1. DESKTOP VIEW (>= 1024px): 3D Pinned Stack Container */}
        <div className="hidden lg:flex relative w-full flex-1 items-center justify-center py-2 sm:py-4 min-h-[360px]">
          <div
            ref={rootRef}
            className="relative w-full max-w-2xl sm:max-w-3xl lg:max-w-4xl h-full max-h-[min(440px,50vh)] min-h-[300px] perspective-[1400px] transform-style-3d"
          >
            {DROPS.map((drop, idx) => (
              <DesktopDropCard
                key={drop.id}
                drop={drop}
                index={idx}
                total={DROPS.length}
              />
            ))}
          </div>
        </div>

        {/* 2. MOBILE & TABLET VIEW (< 1024px): Smooth Parallax Vertical Scroll Layout */}
        <div className="flex lg:hidden w-full flex-col items-center gap-7 sm:gap-9 py-6 flex-1">
          {DROPS.map((drop) => (
            <div
              key={`mobile-${drop.id}`}
              data-mobile-parallax-card
              onClick={() => {
                window.location.href = drop.btnHref;
              }}
              className="w-full max-w-[340px] sm:max-w-[400px] rounded-[1.8rem] overflow-hidden border border-white/20 shadow-[0_20px_50px_rgba(0,0,0,0.6)] p-2.5 flex flex-col justify-between cursor-pointer transition-transform duration-150 active:scale-[0.98] select-none will-change-transform"
              style={{ backgroundColor: drop.bgColor }}
            >
              <div className="relative w-full aspect-[9/13.5] rounded-[1.3rem] overflow-hidden bg-black flex items-center justify-center">
                <video
                  src={drop.videoSrc}
                  autoPlay
                  loop
                  muted
                  playsInline
                  poster={drop.posterSrc}
                  className="w-full h-full object-cover pointer-events-none"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent pointer-events-none" />

                {/* Bottom Flex Stack: Tagline, Brand Title & Action Button with Guaranteed Clearance */}
                <div className="absolute inset-x-0 bottom-4 px-4 flex flex-col items-center justify-end z-20 pointer-events-none select-none">
                  <span className="text-[10px] font-mono uppercase tracking-[3px] text-white/70 block mb-1">
                    {drop.tagline}
                  </span>
                  <h3 className="text-2xl sm:text-3xl font-display font-black uppercase tracking-tight text-white drop-shadow-[0_4px_16px_rgba(0,0,0,0.7)] mb-3 text-center">
                    {drop.brand}
                  </h3>

                  <div className="pointer-events-auto">
                    <a
                      href={drop.btnHref}
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-mono font-bold uppercase tracking-wider shadow-xl active:scale-95 border border-black/10"
                      style={{ backgroundColor: drop.btnBg, color: drop.btnText }}
                    >
                      <span>{drop.btnLabel}</span>
                      <span>→</span>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Scroll-Driven Stamp in Right Vertical Center of Recent Campaigns Section */}
        <div className="hidden lg:block absolute right-6 xl:right-10 top-1/2 -translate-y-1/2 z-30 pointer-events-none select-none">
          <div
            ref={badgeRef}
            className="size-24 lg:size-28 will-change-transform"
            title="This is how we scroll"
          >
            <img
              src="/stickers/scroll.svg"
              alt="This is how we scroll rotating badge"
              className="w-full h-full object-contain filter invert opacity-90 drop-shadow-[0_8px_24px_rgba(0,0,0,0.6)]"
              draggable={false}
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeaturedStackingReels;
