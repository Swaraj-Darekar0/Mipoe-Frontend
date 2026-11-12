import React, { useEffect, useRef, useState } from "react";
import gsap from "gsap";

interface HeroCursorVideoProps {
  containerRef: React.RefObject<HTMLElement | null>;
  threshold?: number;
}

const HERO_VIDEOS = [
  {
    id: "urban-vault",
    src: "/assets/videos/cursor-hero-1.mp4",
    poster: "/thumbnails/real_clip_1.webp",
  },
  {
    id: "lifestyle-drop",
    src: "/assets/videos/cursor-hero-2.mp4",
    poster: "/thumbnails/real_clip_2.webp",
  },
  {
    id: "glow-labs",
    src: "/assets/videos/cursor-hero-3.mp4",
    poster: "/thumbnails/real_clip_3.webp",
  },
  {
    id: "apex-athletics",
    src: "/assets/videos/cursor-hero-4.mp4",
    poster: "/thumbnails/real_clip_4.webp",
  },
];

export const HeroCursorVideo: React.FC<HeroCursorVideoProps> = ({
  containerRef,
  threshold = 280,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const activeIndexRef = useRef(0);
  activeIndexRef.current = activeIndex;

  useEffect(() => {
    const container = containerRef.current;
    const card = cardRef.current;
    if (!container || !card) return;

    // Center card initially offscreen or hidden
    gsap.set(card, {
      xPercent: -50,
      yPercent: -50,
      autoAlpha: 0,
      scale: 0.85,
      pointerEvents: "none",
    });

    // GSAP quickTo setters for 60fps tracking
    const quickX = gsap.quickTo(card, "x", { duration: 0.85, ease: "power3.out" });
    const quickY = gsap.quickTo(card, "y", { duration: 0.85, ease: "power3.out" });
    const quickRot = gsap.quickTo(card, "rotation", { duration: 0.6, ease: "power2.out" });

    let lastX = 0;
    let lastY = 0;
    let accumulatedDistance = 0;
    let settleTimer: number | null = null;
    let isVisible = false;

    const hideCard = () => {
      if (isVisible) {
        isVisible = false;
        gsap.to(card, { autoAlpha: 0, scale: 0.82, duration: 0.22, ease: "power2.in" });
      }
    };

    const showCard = () => {
      if (!isVisible) {
        isVisible = true;
        gsap.to(card, { autoAlpha: 1, scale: 1, duration: 0.35, ease: "power2.out" });
      }
    };

    const onMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();

      // Check if cursor is strictly within the hero region
      if (
        e.clientX < rect.left ||
        e.clientX > rect.right ||
        e.clientY < rect.top ||
        e.clientY > rect.bottom
      ) {
        hideCard();
        return;
      }

      // Check exclusion zone around buttons (no video overlap near button)
      const buttons = container.querySelectorAll("a, button, [role='button'], input, .btn-link, .button-093");
      const BUTTON_BUFFER = 110;
      for (let i = 0; i < buttons.length; i++) {
        const btn = buttons[i];
        const btnWrapper = btn.closest(".inline-flex") || btn;
        const bRect = btnWrapper.getBoundingClientRect();
        if (
          e.clientX >= bRect.left - BUTTON_BUFFER &&
          e.clientX <= bRect.right + BUTTON_BUFFER &&
          e.clientY >= bRect.top - BUTTON_BUFFER &&
          e.clientY <= bRect.bottom + BUTTON_BUFFER
        ) {
          hideCard();
          return;
        }
      }

      showCard();

      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Physics velocity and tilt
      const dx = x - lastX;
      const dy = y - lastY;
      const dist = Math.hypot(dx, dy);

      quickX(x);
      quickY(y);

      // Subtle tilt rotation proportional to horizontal speed
      const tilt = Math.max(-10, Math.min(10, dx / 4));
      quickRot(tilt);

      // Reset tilt after 66ms of inactivity
      if (settleTimer) window.clearTimeout(settleTimer);
      settleTimer = window.setTimeout(() => {
        quickRot(0);
      }, 66);

      // Travel-based video cycling
      accumulatedDistance += dist;
      if (accumulatedDistance > threshold) {
        accumulatedDistance = 0;
        const nextIdx = (activeIndexRef.current + 1) % HERO_VIDEOS.length;
        setActiveIndex(nextIdx);

        // Play active video and pause others
        videoRefs.current.forEach((vid, idx) => {
          if (!vid) return;
          if (idx === nextIdx) {
            vid.currentTime = 0;
            vid.play().catch(() => {});
          } else {
            vid.pause();
          }
        });
      }

      lastX = x;
      lastY = y;
    };

    const onMouseEnter = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      lastX = e.clientX - rect.left;
      lastY = e.clientY - rect.top;
      gsap.set(card, { x: lastX, y: lastY });
    };

    const onMouseLeave = () => {
      hideCard();
      quickRot(0);
    };

    const onScroll = () => {
      const rect = container.getBoundingClientRect();
      // Smooth fade-out as user scrolls hero onto the next section below
      if (rect.top < 0 || rect.bottom < window.innerHeight) {
        const exitRatio = Math.max(0, Math.min(1, (rect.bottom - 80) / (rect.height * 0.45)));
        if (exitRatio < 0.95) {
          gsap.to(card, { opacity: exitRatio, duration: 0.18, ease: "power1.out" });
        }
        if (rect.bottom < 40 || rect.top < -rect.height * 0.35) {
          hideCard();
        }
      }
    };

    container.addEventListener("mousemove", onMouseMove, { passive: true });
    container.addEventListener("mouseenter", onMouseEnter);
    container.addEventListener("mouseleave", onMouseLeave);
    window.addEventListener("scroll", onScroll, { passive: true });

    // Initial play for first video
    const firstVid = videoRefs.current[0];
    if (firstVid) {
      firstVid.play().catch(() => {});
    }

    return () => {
      container.removeEventListener("mousemove", onMouseMove);
      container.removeEventListener("mouseenter", onMouseEnter);
      container.removeEventListener("mouseleave", onMouseLeave);
      window.removeEventListener("scroll", onScroll);
      if (settleTimer) window.clearTimeout(settleTimer);
    };
  }, [containerRef, threshold]);

  return (
    <div
      ref={cardRef}
      data-cursor-video-card=""
      className="absolute top-0 left-0 z-[5] w-[125px] h-[125px] md:w-[145px] md:h-[145px] aspect-square rounded-2xl overflow-hidden bg-black/90 shadow-[0_12px_36px_rgba(0,0,0,0.18)] border border-black/10 dark:border-white/20 pointer-events-none will-change-transform"
      style={{ transformStyle: "preserve-3d" }}
      aria-hidden="true"
    >
      {/* Clean video layers without extra labels */}
      <div className="relative w-full h-full">
        {HERO_VIDEOS.map((video, idx) => {
          const isActive = idx === activeIndex;
          return (
            <div
              key={video.id}
              className={`absolute inset-0 transition-opacity duration-500 ease-out ${
                isActive ? "opacity-100 z-10" : "opacity-0 z-0"
              }`}
            >
              <video
                ref={(el) => {
                  videoRefs.current[idx] = el;
                }}
                src={video.src}
                poster={video.poster}
                autoPlay
                muted
                loop
                playsInline
                preload="auto"
                className="w-full h-full object-cover"
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default HeroCursorVideo;
