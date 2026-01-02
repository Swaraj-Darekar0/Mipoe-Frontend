import React from 'react';

const AnimatedGrainyBackground = ({ 
  children,
  className = ""
}: { 
  children?: React.ReactNode;
  className?: string;
}) => {
  return (
    <div className={`relative w-full h-full overflow-hidden bg-neutral-900 ${className}`}>
      {/* 1. Aurora Gradient Layer */}
      <div className="absolute inset-0 z-0 opacity-60">
        <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] animate-aurora mix-blend-screen filter blur-[100px]">
          {/* Color 1: The Striking Red from the figure */}
          <div className="absolute top-[20%] left-[20%] w-[40vw] h-[40vw] bg-[#ff3b3b] rounded-full mix-blend-multiply opacity-80 animate-blob"></div>
          {/* Color 2: Deep Charcoal/Black */}
          <div className="absolute top-[40%] right-[20%] w-[35vw] h-[35vw] bg-[#1a1a1a] rounded-full mix-blend-multiply opacity-90 animate-blob animation-delay-2000"></div>
          {/* Color 3: Highlight Grey/White */}
          <div className="absolute bottom-[20%] left-[30%] w-[45vw] h-[45vw] bg-[#2e2e2e] rounded-full mix-blend-multiply opacity-90 animate-blob animation-delay-4000"></div>
        </div>
      </div>

      {/* 2. Vintage TV Grain/Noise Overlay */}
      <div className="absolute inset-0 z-10 opacity-20 pointer-events-none">
        <div className="w-full h-full relative">
          <svg className="w-full h-full opacity-100">
            <filter id="noise">
              <feTurbulence
                type="fractalNoise"
                baseFrequency="0.85"
                numOctaves="3"
                stitchTiles="stitch"
              />
              <feColorMatrix type="saturate" values="0" />
            </filter>
            <rect width="100%" height="100%" filter="url(#noise)" />
          </svg>
        </div>
      </div>
      
      {/* 3. Scanlines for extra "Vintage TV" feel (Optional, subtle) */}
      <div className="absolute inset-0 z-20 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-10 bg-[length:100%_4px,6px_100%] bg-repeat"></div>

      {/* Content */}
      <div className="relative z-30 w-full h-full">
        {children}
      </div>

      {/* Tailwind Animations */}
      <style>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob {
          animation: blob 10s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
};

export default AnimatedGrainyBackground;