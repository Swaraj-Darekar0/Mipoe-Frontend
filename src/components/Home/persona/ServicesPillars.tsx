import React, { useRef, useEffect, useState } from "react";
import gsap from "gsap";
import SlidingScribbleButton from "./SlidingScribbleButton";
import HighlightedText from "./HighlightedText";
import { SquishyWord } from "./SquishySectionHeading";

interface ServiceCard {
  id: string;
  number: string;
  title: string;
  subtitle: string;
  color: string;
  defaultTilt: number; // degrees
  defaultY: number; // px offset
  defaultZ: number;
  image: string;
  video: string;
  hasComicSticker?: boolean;
  stickerText?: string;
  ctaHref: string;
}

const CARDS: ServiceCard[] = [
  {
    id: "animatie",
    number: "01",
    title: "FIT CHECKS",
    subtitle: "Gen Z streetwear & Y2K styling reels filmed by real creators",
    color: "#0038ff", // Royal Blue
    defaultTilt: -3,
    defaultY: 24,
    defaultZ: 10,
    image: "/thumbnails/indian_genz_multi_poster.webp",
    video: "/assets/videos/indian_genz_multi_fit.mp4",
    ctaHref: "/login?role=creator",
  },
  {
    id: "video",
    number: "02",
    title: "UGC REELS",
    subtitle: "Authentic Indian creator videos built to drive sales & trust",
    color: "#ff77cd", // Hot Pink
    defaultTilt: 0,
    defaultY: 0,
    defaultZ: 20, // Elevate above adjacent cards
    image: "/thumbnails/pin_thrift_finds.webp",
    video: "/assets/videos/pinterest_reel_sepia_model.mp4",
    hasComicSticker: true,
    stickerText: "JOIN THE NETWORK!",
    ctaHref: "/login?role=brand",
  },
  {
    id: "social",
    number: "03",
    title: "DESI Y2K",
    subtitle: "Indo-Western transitions & fashion reels that stop the scroll",
    color: "#ff5f04", // Vivid Orange
    defaultTilt: 2.8,
    defaultY: 12,
    defaultZ: 10,
    image: "/thumbnails/desi_saree_transition_poster.webp",
    video: "/assets/videos/pinterest_reel_3.mp4",
    ctaHref: "/login?role=creator",
  },
];

export const ServicesPillars: React.FC = () => {
  const containerRef = useRef<HTMLElement>(null);
  const cardElementsRef = useRef<(HTMLDivElement | null)[]>([]);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const [hoveredCardIndex, setHoveredCardIndex] = useState<number | null>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

    const cleanups: (() => void)[] = [];

    cardElementsRef.current.forEach((cardEl, idx) => {
      if (!cardEl) return;
      const config = CARDS[idx];

      // Quick momentum setters
      const tiltX = gsap.quickTo(cardEl, "rotationX", { duration: 0.45, ease: "power2.out" });
      const tiltY = gsap.quickTo(cardEl, "rotationY", { duration: 0.45, ease: "power2.out" });

      const onMouseEnter = () => {
        setHoveredCardIndex(idx);

        // Play video
        const video = videoRefs.current[idx];
        if (video) {
          video.play().catch(() => {});
        }

        // Lift elevation, reduce tilt angle, elevate z-index
        gsap.to(cardEl, {
          y: config.defaultY - 14,
          rotation: config.defaultTilt * 0.35,
          scale: 1.03,
          zIndex: 35,
          duration: 0.35,
          ease: "power2.out",
        });
      };

      const onMouseMove = (e: MouseEvent) => {
        const rect = cardEl.getBoundingClientRect();
        const xRel = (e.clientX - rect.left) / rect.width - 0.5;
        const yRel = (e.clientY - rect.top) / rect.height - 0.5;

        tiltY(xRel * 9);
        tiltX(-yRel * 9);
      };

      const onMouseLeave = () => {
        setHoveredCardIndex(null);

        // Pause video
        const video = videoRefs.current[idx];
        if (video) {
          video.pause();
        }

        tiltX(0);
        tiltY(0);

        // Restore natural resting transforms
        gsap.to(cardEl, {
          y: config.defaultY,
          rotation: config.defaultTilt,
          scale: 1,
          zIndex: config.defaultZ,
          duration: 0.5,
          ease: "power3.out",
        });
      };

      cardEl.addEventListener("mouseenter", onMouseEnter);
      cardEl.addEventListener("mousemove", onMouseMove, { passive: true });
      cardEl.addEventListener("mouseleave", onMouseLeave);

      cleanups.push(() => {
        cardEl.removeEventListener("mouseenter", onMouseEnter);
        cardEl.removeEventListener("mousemove", onMouseMove);
        cardEl.removeEventListener("mouseleave", onMouseLeave);
      });
    });

    return () => cleanups.forEach((c) => c());
  }, []);

  return (
    <section
      ref={containerRef}
      id="services-pillars"
      className="relative w-full bg-[#f8f8f6] pt-32 sm:pt-36 lg:pt-44 pb-20 sm:pb-24 lg:pb-32 px-4 sm:px-6 md:px-12 border-t border-black/5 overflow-hidden select-none"
    >
      <div className="max-w-6xl mx-auto flex flex-col items-center">
        {/* Services Section Heading with Squishy Physics & Signature Highlight */}
        <div className="text-center mb-10 sm:mb-14 mt-4 sm:mt-6">
          <p className="font-serif italic text-charcoal/80 text-xl sm:text-2xl md:text-3xl mb-1.5 tracking-normal">
            What We Deliver
          </p>
          <h2 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-display font-black uppercase tracking-tight text-ink leading-none flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
            <SquishyWord text="WHAT WE" />
            <HighlightedText colorClass="bg-[#0038ff]/20">
              DO
            </HighlightedText>
          </h2>
        </div>

        {/* 1. DESKTOP VIEW (>= 1024px): 3 Polaroid Framed Colored Cards with 3D Tilt */}
        <div className="hidden lg:flex relative w-full items-center justify-center gap-5 [perspective:1200px]">
          {CARDS.map((card, idx) => (
            <div
              key={card.id}
              ref={(el) => (cardElementsRef.current[idx] = el)}
              style={{
                backgroundColor: card.color,
                zIndex: card.defaultZ,
                transform: `rotate(${card.defaultTilt}deg) translateY(${card.defaultY}px)`,
              }}
              className="group relative w-[336px] rounded-[24px] p-[18px] flex flex-col justify-between shadow-[0_16px_40px_rgba(0,0,0,0.12)] transition-shadow duration-300 hover:shadow-[0_32px_75px_rgba(0,0,0,0.22)] transform-style-3d will-change-transform cursor-pointer"
            >
              {/* Inner Media Frame (4:5 Aspect Ratio) */}
              <div className="relative w-full aspect-[4/5] rounded-[16px] overflow-hidden bg-black/10 shadow-inner">
                {/* Visual Thumbnail Image */}
                <img
                  src={card.image}
                  alt={card.title}
                  loading="lazy"
                  className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105 pointer-events-none select-none"
                />

                {/* Autoplay-On-Hover Video Layer */}
                <video
                  ref={(el) => (videoRefs.current[idx] = el)}
                  src={card.video}
                  muted
                  loop
                  playsInline
                  preload="metadata"
                  className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 pointer-events-none ${
                    hoveredCardIndex === idx ? "opacity-100" : "opacity-0"
                  }`}
                />
              </div>

              {/* Bottom Card Content */}
              <div className="pt-3.5 pb-1 flex flex-col items-center text-center">
                <h3 className="font-display font-black text-[40px] uppercase text-white tracking-tight leading-none">
                  {card.title}
                </h3>
                <p className="font-serif italic text-white/95 text-[16px] leading-snug mt-1.5 max-w-[270px]">
                  {card.subtitle}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* 2. MOBILE & TABLET VIEW (< 1024px): Autoplaying Videos & Gentle Tilts */}
        <div className="flex lg:hidden flex-col md:flex-row items-center justify-center gap-7 md:gap-4 w-full">
          {CARDS.map((card, idx) => {
            const mobileTilt = idx === 0 ? -1.5 : idx === 2 ? 1.5 : 0;
            return (
              <div
                key={`mobile-${card.id}`}
                style={{
                  backgroundColor: card.color,
                  transform: `rotate(${mobileTilt}deg)`,
                }}
                className="relative w-full max-w-[330px] md:max-w-none md:w-[245px] rounded-[22px] p-4 flex flex-col justify-between shadow-[0_14px_35px_rgba(0,0,0,0.14)] active:scale-[0.98] transition-transform select-none"
              >
                {/* Inner Media Frame with Continuous Autoplaying Video on Mobile */}
                <div className="relative w-full aspect-[4/5] rounded-[15px] overflow-hidden bg-black/10 shadow-inner">
                  <video
                    src={card.video}
                    autoPlay
                    muted
                    loop
                    playsInline
                    preload="metadata"
                    poster={card.image}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Bottom Card Content */}
                <div className="pt-3.5 pb-1 flex flex-col items-center text-center">
                  <h3 className="font-display font-black text-3xl md:text-[32px] uppercase text-white tracking-tight leading-none">
                    {card.title}
                  </h3>
                  <p className="font-serif italic text-white/95 text-[14px] md:text-[15px] leading-snug mt-1.5 max-w-[260px]">
                    {card.subtitle}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Centered Bottom CTA with Random Doodle Underline */}
        <div className="mt-12 sm:mt-18 flex justify-center">
          <SlidingScribbleButton
            href="/login?role=creator"
            label="Explore Platform"
            accentColor="#0038ff"
          />
        </div>
      </div>
    </section>
  );
};

export default ServicesPillars;
