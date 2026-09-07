
import React, { useRef, useEffect } from "react";

interface AuthLayoutProps {
  children: React.ReactNode;
  isSuccessVideoPlaying?: boolean;
  onVideoEnded?: () => void;
  avatarState?: string;
  formBehaviorState?: any;
  targetElementRect?: DOMRect | null;
  lookTarget?: { x: number; y: number } | null;
}

const AuthLayout = ({
  children,
  isSuccessVideoPlaying = false,
  onVideoEnded,
}: AuthLayoutProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hasTriggeredEnded = useRef(false);

  // Trigger video playback strictly on successful sign-in / registration
  useEffect(() => {
    if (!isSuccessVideoPlaying) {
      hasTriggeredEnded.current = false;
      return;
    }

    // On screens < 1024px (mobile and portrait tablets), the video is hidden.
    // Transition cleanly without forcing the user to wait for a hidden video.
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      const mobileTimer = setTimeout(() => {
        if (!hasTriggeredEnded.current) {
          hasTriggeredEnded.current = true;
          onVideoEnded?.();
        }
      }, 400);
      return () => clearTimeout(mobileTimer);
    }

    const video = videoRef.current;
    if (video) {
      video.currentTime = 0;
      // Play on sign-in event. Try unmuted, fallback to muted if blocked by browser
      video.muted = false;
      video.play().catch(() => {
        if (video) {
          video.muted = true;
          video.play().catch((err) => {
            console.error("Video playback error:", err);
          });
        }
      });
    }

    // Fallback safety timer: video is ~3.93s. If onEnded does not fire within 4.5s, trigger callback
    const fallbackTimer = setTimeout(() => {
      if (!hasTriggeredEnded.current) {
        hasTriggeredEnded.current = true;
        onVideoEnded?.();
      }
    }, 4500);

    return () => {
      clearTimeout(fallbackTimer);
    };
  }, [isSuccessVideoPlaying, onVideoEnded]);

  const handleEnded = () => {
    if (!hasTriggeredEnded.current) {
      hasTriggeredEnded.current = true;
      onVideoEnded?.();
    }
  };

  return (
    <div className="min-h-screen w-full bg-white text-zinc-900 flex">
      {/* Left Panel - Hidden on mobile & portrait tablets (< 1024px); flexible width full-height column on desktop */}
      <div className="hidden lg:block lg:w-[42%] xl:w-[45%] max-w-[680px] shrink-0 relative bg-black select-none overflow-hidden h-screen sticky top-0">
        <video
          ref={videoRef}
          src="/REFER.mp4"
          poster="/refer_poster.jpg"
          preload="auto"
          muted
          playsInline
          onEnded={handleEnded}
          className="h-full w-full object-cover select-none block"
        />
      </div>

      {/* Right Panel - Clean, responsive, high-taste plain white form area */}
      <div
        className={`flex-1 min-w-0 flex flex-col items-center justify-center px-4 py-8 sm:px-8 md:px-12 lg:px-16 overflow-y-auto min-h-screen bg-white transition-opacity duration-300 ${
          isSuccessVideoPlaying ? "pointer-events-none select-none opacity-90" : ""
        }`}
      >
        <div className="w-full max-w-[420px] mx-auto">
          {children}
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
