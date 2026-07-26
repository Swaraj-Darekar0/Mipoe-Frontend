import React from 'react';
import video from '@/assets/try2.webm';
import NavigationLinks from '@/components/Home/NavigationLinks';

const Hero: React.FC = () => {
  return (
    <section className="w-full grid-border flex flex-col justify-between items-center relative overflow-hidden h-[calc(100vh)] min-h-[620px] max-h-[950px] bg-black select-none">
      
      {/* 1. Cinematic video background */}
      <div className="absolute inset-0 w-full h-full z-0 pointer-events-none">
        <video
          className="w-full h-full object-cover opacity-95 scale-105" 
          autoPlay
          loop
          muted
          playsInline
        >
          <source src={video} type="video/webm" />
          <source src={video} type="video/mp4" />
        </video>
      </div>

      <div className="absolute inset-0 z-10 bg-black/50 md:bg-black/45 pointer-events-none"></div>
      <div className="absolute inset-x-0 top-0 z-10 h-32 bg-gradient-to-b from-black/55 to-transparent pointer-events-none"></div>
      <div className="absolute inset-x-0 bottom-0 z-10 h-44 bg-gradient-to-t from-black/75 via-black/30 to-transparent pointer-events-none"></div>

      {/* 2. Hero copy */}
      <div className="absolute inset-0 z-20 flex flex-col justify-center items-center w-full h-full px-4 pointer-events-none">
        
        <h1 className="font-display font-black text-[31vw] sm:text-[25vw] md:text-[20vw] leading-none tracking-tight text-center uppercase scale-y-110 -translate-y-5 text-white drop-shadow-[0_14px_40px_rgba(0,0,0,0.55)] selection:bg-primary selection:text-white">
          MIPOE
        </h1>

        <div className="mt-7 md:mt-10 text-center pointer-events-auto">
          <p className="font-display text-[1.18rem] sm:text-2xl md:text-3xl lg:text-4xl text-white uppercase tracking-[0.18em] sm:tracking-[0.22em] inline-flex flex-wrap items-center justify-center gap-x-2 gap-y-1 px-5 py-3 rounded-xl bg-black/24 backdrop-blur-[2px] shadow-[0_18px_60px_rgba(0,0,0,0.35)]">
            <span>A</span>
            <span className="font-cursive text-[1.85em] text-primary normal-case tracking-normal leading-none">Creator</span>
            <span>First Platform.</span>
          </p>
        </div>

      </div>

      {/* 3. Modular NavigationLinks Component Embedded at Bottom Boundary */}
      <div className="absolute bottom-0 left-0 right-0 z-30 w-full">
        <NavigationLinks />
      </div>

      {/* Noise Texture Overlay */}
      <div className="absolute top-0 left-0 w-full h-full opacity-15 pointer-events-none mix-blend-overlay bg-[url('https://www.transparenttextures.com/patterns/noise.png')] z-30"></div>
    </section>
  );
};

export default Hero;
