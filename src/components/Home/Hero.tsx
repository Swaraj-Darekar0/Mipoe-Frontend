import React from 'react';
import video from '@/assets/try2.webm';
import NavigationLinks from '@/components/Home/NavigationLinks';

const Hero: React.FC = () => {
  return (
    <section className="w-full grid-border flex flex-col justify-between items-center relative overflow-hidden h-[calc(100vh-50px)] min-h-[580px] max-h-[950px] bg-white dark:bg-black select-none">
      
      {/* 1. Content Layer (Video underneath) */}
      <div className="absolute inset-0 w-full h-full z-0 pointer-events-none">
        <video
          className="w-full h-full object-cover" 
          autoPlay
          loop
          muted
          playsInline
        >
          <source src={video} type="video/webm" />
          <source src={video} type="video/mp4" />
        </video>
      </div>

      {/* 2. Mask Layer (Full Screen Solid White/Black Knockout - Video ONLY shows inside MIPOE) */}
      <div className="absolute inset-0 z-10 flex flex-col justify-center items-center w-full h-full bg-white dark:bg-black mix-blend-screen dark:mix-blend-multiply pointer-events-none select-none">
        <h1 className="font-display font-bold text-[22vw] md:text-[20vw] leading-none tracking-tighter text-center uppercase scale-y-110 -translate-y-6 text-black dark:text-white">
          MIPOE
        </h1>
        
        {/* Invisible spacer matching Layer 3's subtext container height exactly */}
        <div className="mt-8 md:mt-12 text-center opacity-0">
          <p className="font-display text-base sm:text-xl md:text-2xl lg:text-3xl px-6 py-2.5">
            Spacer
          </p>
        </div>
      </div>

      {/* 3. Overlay Layer (Outline Stroke & Creator First Subtext) */}
      <div className="absolute inset-0 z-20 flex flex-col justify-center items-center w-full h-full pointer-events-none">
        
        {/* Crisp Bold Outline Text */}
        <h1 
          className="font-display font-bold text-[22vw] md:text-[20vw] leading-none tracking-tighter text-center uppercase scale-y-110 -translate-y-6 text-dark-void dark:text-snow selection:bg-primary selection:text-white"
          style={{ 
            WebkitTextFillColor: 'transparent', 
            WebkitTextStroke: '1.5px currentColor' 
          }}
        >
          MIPOE
        </h1>

        {/* Subtext with Cursive Accent (Clean Flat Glassmorphic Pill) */}
        <div className="mt-8 md:mt-12 text-center pointer-events-auto">
          <p className="font-display text-base sm:text-xl md:text-2xl lg:text-3xl text-dark-void dark:text-snow uppercase tracking-widest inline-block px-6 py-2.5 rounded-lg bg-white/90 dark:bg-black/90 backdrop-blur-md">
            A <span className="font-cursive text-[1.7em] text-primary normal-case tracking-normal align-middle inline-block mx-1">Creator</span>  First platform.
          </p>
        </div>

      </div>

      {/* 4. Modular NavigationLinks Component Embedded at Bottom Boundary */}
      <div className="absolute bottom-0 left-0 right-0 z-30 w-full">
        <NavigationLinks />
      </div>

      {/* Noise Texture Overlay */}
      <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none mix-blend-overlay bg-[url('https://www.transparenttextures.com/patterns/noise.png')] z-30"></div>
    </section>
  );
};

export default Hero;