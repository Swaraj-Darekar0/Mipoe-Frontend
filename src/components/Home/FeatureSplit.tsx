import React from 'react';
import imageUrl from '@/assets/bg22.png'

const FeatureSplit: React.FC = () => {
  return (
    <section className="w-full grid-border flex flex-col md:flex-row h-auto md:h-[600px] lg:h-[700px]">
      <div className="w-full md:w-1/2 h-[400px] md:h-full relative overflow-hidden border-b md:border-b-0 md:border-r border-dark-void dark:border-dusty-grey/30 bg-glucon-grey group">
        <img
          alt="Close up monochrome portrait with pixelated glitch effect"
          className="w-full h-full object-cover contrast-100 "
          src={imageUrl}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-dark-void/80 via-transparent to-transparent mix-blend-multiply pointer-events-none"></div>
        <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/pixels.png')] pointer-events-none"></div>
        <div className="absolute bottom-4 left-4 p-2 bg-dark-void text-snow font-mono text-xs border border-snow/20 z-10">
          ID: HUMAN_001
          <br />
          Status: UNFILTERED
        </div>
      </div>
      <div className="w-full md:w-1/2 bg-dark-void flex flex-col justify-center p-8 md:p-16 lg:p-24 relative">
        <div className="absolute top-4 right-4 md:top-6 md:right-6">
          <span className="font-mono text-xs uppercase text-snow border border-snow px-2 py-0.5">
            Manifesto.txt
          </span>
        </div>
        <h2 className="font-display font-bold text-3xl md:text-4xl text-snow mb-6 leading-tight">
          Traditional platforms chase cold metrics. sellr disrupts the status quo.
        </h2>
        <p className="font-mono text-sm md:text-base text-snow leading-relaxed text-justify tracking-tight mb-6">
          India has 200 million content creators. Less than 1% of them are paid
          fairly for what they create. Meanwhile, brands spend crores on ads
          that feel like spam. sellr fixes both sides of that equation.
          Creators get paid for reach. Brands pay only for results. No agency
          cut. No algorithm lottery. Just a marketplace where talent meets
          opportunity — and both sides win.
        </p>
        <div className="mt-4 pt-4 border-t border-snow flex justify-between items-center font-mono text-xs font-bold uppercase tracking-wider text-snow">
          <span>System: Decentralized</span>
          <span className="text-green-500 animate-pulse">● Live</span>
        </div>
      </div>
    </section>
  );
};

export default FeatureSplit;