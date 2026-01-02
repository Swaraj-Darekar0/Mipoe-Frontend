import React from 'react';
import video from '@/assets/try2.webm'

const Hero: React.FC = () => {
  return (
    <section className="w-full grid-border flex flex-col justify-center items-center py-24 md:py-32 lg:py-40 relative overflow-hidden group min-h-[80vh]">
      
      {/* 1. Content Layer (Video that shows THROUGH the text) */}
      <div className="absolute inset-0 w-full h-full z-0">
        <video
          className="w-full h-full object-cover" 
          autoPlay
          loop
          muted
          playsInline
        >
          {/* Using Big Buck Bunny as referenced in the image to demonstrate the effect */}
          <source src={video} type="video/mp4" />
        </video>
      </div>

      {/* 2. Mask Layer (The Knockout Effect) */}
      {/* 
         Light Mode (Screen): White BG hides video, Black Text reveals video.
         Dark Mode (Multiply): Black BG hides video, White Text reveals video.
      */}
      <div className="absolute inset-0 z-10 flex flex-col justify-center items-center w-full h-full bg-background-light dark:bg-black mix-blend-screen dark:mix-blend-multiply pointer-events-none select-none">
        <h1 className="font-display font-bold text-[22vw] md:text-[20vw] leading-[0.8] tracking-tighter text-center uppercase scale-y-110 -translate-y-6 text-black dark:text-white">
          MIPOE
        </h1>
        {/* Invisible spacer to maintain layout height */}
        <div className="mt-12 md:mt-16 max-w-5xl px-4 py-2 opacity-0">
             <p className="md:text-3xl lg:text-4xl inline-block px-4 py-2">
                 Spacer
             </p>
         </div>
      </div>

      {/* 3. Overlay Layer (Outline & Subtext) */}
      <div className="relative z-20 flex flex-col justify-center items-center w-full h-full pointer-events-none">
        {/* 
            Outline Text
            - Position perfectly matches the Mask Layer (-translate-y-6).
            - Uses text-dark-void/snow for the outline color.
            - Uses WebkitTextFillColor: transparent to show the video underneath.
        */}
        <h1 
          className="font-display font-bold text-[22vw] md:text-[20vw] leading-[0.8] tracking-tighter text-center uppercase scale-y-110 -translate-y-6 text-dark-void dark:text-snow selection:bg-primary selection:text-white"
          style={{ 
            WebkitTextFillColor: 'transparent', 
            WebkitTextStroke: '1px currentColor' 
          }}
        >
          MIPOE
        </h1>

        {/* Subtext */}
        <div className="mt-12 md:mt-16 max-w-5xl px-4 text-center pointer-events-auto">
          <p className="font-display md:text-3xl lg:text-4xl text-dark-void dark:text-snow uppercase tracking-widest inline-block px-4 py-2 rounded-sm bg-white/50 dark:bg-black/50 backdrop-blur-sm">
            A <span className="font-['Parisienne',cursive] text-[2.18em] text-[#FF5C00] uppercase tracking-normal normal-case">Creator</span> First platform<span className="font-['Parisienne',cursive] text-[2.18em] text-[#FF5C00] uppercase tracking-normal normal-case"></span>.
          </p>
        </div>
      </div>

      {/* Noise Texture (Optional, adds grit) */}
      <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none mix-blend-overlay bg-[url('https://www.transparenttextures.com/patterns/noise.png')] z-30"></div>
    </section>
  );
};

export default Hero;