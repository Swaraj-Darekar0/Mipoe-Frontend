import React, { useState } from "react";

export interface DoodleVariant {
  id: number;
  d: string;
  length: number;
  strokeWidth: number;
}

export const DOODLE_VARIANTS: DoodleVariant[] = [
  {
    id: 0,
    // Smooth organic wave with slight pressure tilt
    d: "M6 18C70 12 135 15 195 13C235 11 275 14 314 17",
    length: 320,
    strokeWidth: 5,
  },
  {
    id: 1,
    // Playful triple-curve squiggle
    d: "M6 22C45 10 80 26 125 14C170 26 215 12 255 24C280 14 300 20 314 16",
    length: 345,
    strokeWidth: 5,
  },
  {
    id: 2,
    // Kinetic zigzag scribble
    d: "M5 20C40 10 65 24 100 12C140 26 175 11 215 24C255 12 285 24 315 15",
    length: 335,
    strokeWidth: 5.5,
  },
  {
    id: 3,
    // Expressive dynamic swoop curve
    d: "M6 15C55 25 115 8 175 22C225 26 270 10 314 18",
    length: 325,
    strokeWidth: 5,
  },
];

interface RandomDoodleUnderlineProps {
  isHovered: boolean;
  accentColor?: string;
  className?: string;
}

export const RandomDoodleUnderline: React.FC<RandomDoodleUnderlineProps> = ({
  isHovered,
  accentColor = "#ff77cd",
  className = "",
}) => {
  const [doodleIndex, setDoodleIndex] = useState(0);

  // Trigger new random doodle on every fresh hover entry
  React.useEffect(() => {
    if (isHovered) {
      setDoodleIndex((prev) => {
        let next = Math.floor(Math.random() * DOODLE_VARIANTS.length);
        if (next === prev) {
          next = (prev + 1) % DOODLE_VARIANTS.length;
        }
        return next;
      });
    }
  }, [isHovered]);

  const activeDoodle = DOODLE_VARIANTS[doodleIndex];

  const isTouchScreen = typeof window !== "undefined" && window.matchMedia("(hover: none)").matches;

  return (
    <div
      className={`pointer-events-none absolute -bottom-3 left-1/2 -translate-x-1/2 w-[112%] max-w-[280px] h-4 overflow-visible ${className}`}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 320 28"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
        className="w-full h-full"
      >
        <path
          d={activeDoodle.d}
          stroke={accentColor}
          strokeWidth={activeDoodle.strokeWidth}
          strokeLinecap="round"
          style={{
            strokeDasharray: activeDoodle.length,
            strokeDashoffset: isTouchScreen || isHovered ? 0 : activeDoodle.length,
            transition: isTouchScreen ? "none" : "stroke-dashoffset 0.48s cubic-bezier(0.22, 1, 0.36, 1)",
          }}
        />
      </svg>
    </div>
  );
};

export default RandomDoodleUnderline;
