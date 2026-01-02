import React from 'react';
import imageUrl from '@/assets/bg31.png'

const IllustratedGuide: React.FC = () => {
  return (
    <section className="w-full grid-border flex flex-col relative bg-snow dark:bg-glucon-grey overflow-hidden group">
        {/* Floating Label */}
 
        
        {/* Image Container - Full Width / Responsive */}
        <div className="w-full relative">
            {/* 
                The image is set to full width (stretch) and auto height (minimize aspect ratio).
                Using 'mix-blend-multiply' on light mode helps integrate white backgrounds if the image isn't transparent.
            */}
            <img 
                src={imageUrl} 
                alt="Illustration of two characters discussing a new campaign and creating clips" 
                className="w-full h-auto object-cover block dark:opacity-90 transition-opacity duration-500"
            />
            
            {/* Hover overlay effect */}
            <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none mix-blend-multiply"></div>
        </div>
        
        {/* Metadata Footer Bar
        <div className="w-full border-t border-dark-void dark:border-dusty-grey/30 bg-background-light dark:bg-background-dark p-2 px-4 flex justify-between items-center text-[10px] md:text-xs font-mono text-dusty-grey uppercase tracking-widest">
            <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-primary animate-pulse rounded-full"></div>
                <span>Fig. 2.1 — Interaction Model</span>
            </div>
            <span>Scale: Auto-Fit</span>
        </div> */}
    </section>
  );
};

export default IllustratedGuide;