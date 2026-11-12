import React, { useState } from "react";
import RandomDoodleUnderline from "./RandomDoodleUnderline";

interface SlidingScribbleButtonProps {
  href: string;
  label: string;
  accentColor?: string; // hex or tailwind text class
  className?: string;
  onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
}

export const SlidingScribbleButton: React.FC<SlidingScribbleButtonProps> = ({
  href,
  label,
  accentColor = "#ff77cd",
  className = "",
  onClick,
}) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div className={`relative inline-flex flex-col items-center ${className}`}>
      <a
        href={href}
        onClick={onClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="group relative inline-flex items-center gap-3.5 px-6 py-3.5 rounded-full bg-[#121316] hover:bg-[#1a1b20] text-white border border-white/15 shadow-[0_8px_30px_rgba(0,0,0,0.16)] transition-all duration-300 hover:shadow-[0_12px_40px_rgba(0,0,0,0.24)] pointer-events-auto"
      >
        {/* Button Label */}
        <span className="font-mono text-[13.5px] md:text-[14px] font-bold tracking-tight uppercase select-none">
          {label}
        </span>

        {/* Dual-State Sliding Arrow Box */}
        <div className="relative w-7 h-7 rounded-full bg-[#0038ff] flex flex-col justify-end overflow-hidden shrink-0 shadow-inner">
          {/* Default Arrow & Hover Arrow Stack */}
          <div className="absolute inset-0 flex flex-col justify-end w-full h-[200%] transition-transform duration-500 [transition-timing-function:cubic-bezier(0.175,0.885,0.32,1.275)] group-hover:translate-y-1/2">
            {/* Top Hover Arrow (enters on hover) */}
            <div className="w-full h-1/2 flex items-center justify-center text-white">
              <svg
                viewBox="0 0 14 13"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="w-3.5 h-3.5"
              >
                <path
                  d="M5.70413 12.9355L7.98926 9.94463L10.3669 6.89587L12.2298 7.74049L0 7.74049L0 5.19504L12.2298 5.19504L10.3669 6.03967L7.98926 2.99091L5.70413 0L9.04793 0L14 6.46777L9.04793 12.9355H5.70413Z"
                  fill="currentColor"
                />
              </svg>
            </div>
            {/* Bottom Default Arrow (slides down on hover) */}
            <div className="w-full h-1/2 flex items-center justify-center text-white">
              <svg
                viewBox="0 0 14 13"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="w-3.5 h-3.5"
              >
                <path
                  d="M5.70413 12.9355L7.98926 9.94463L10.3669 6.89587L12.2298 7.74049L0 7.74049L0 5.19504L12.2298 5.19504L10.3669 6.03967L7.98926 2.99091L5.70413 0L9.04793 0L14 6.46777L9.04793 12.9355H5.70413Z"
                  fill="currentColor"
                />
              </svg>
            </div>
          </div>
        </div>
      </a>

      {/* Dynamic Random Hand-drawn Doodle Underline */}
      <RandomDoodleUnderline isHovered={isHovered} accentColor={accentColor} />
    </div>
  );
};

export default SlidingScribbleButton;
