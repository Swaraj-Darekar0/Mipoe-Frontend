import React from 'react';
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight } from 'lucide-react';

const NavigationLinks: React.FC = () => {
  const navigate = useNavigate();
  
  return (
    <div className="w-full grid grid-cols-1 md:grid-cols-2 border-t border-dark-void/30 dark:border-white/15 bg-white/90 dark:bg-black/90 backdrop-blur-md">
      
      {/* 1. Left Subsection: Brands */}
      <div 
        onClick={() => navigate("/login?role=brand")}
        className="group flex items-center justify-between px-6 py-3.5 md:px-10 md:py-5 border-b md:border-b-0 md:border-r border-dark-void/30 dark:border-white/15 hover:bg-primary hover:text-white transition-colors duration-300 cursor-pointer text-dark-void dark:text-snow"
      >
        {/* Left Arrow Icon & Tag */}
        <div className="flex items-center gap-3">
          <div className="p-2 md:p-2.5 rounded-full bg-primary/10 group-hover:bg-white group-hover:text-primary transition-all">
            <ArrowLeft className="w-5 h-5 md:w-6 md:h-6 transform group-hover:-translate-x-1 transition-transform" />
          </div>
          <span className="font-mono text-xs hidden lg:inline-block opacity-0 group-hover:opacity-100 transition-opacity uppercase tracking-widest">
            [Initialize]
          </span>
        </div>

        {/* Brand Text */}
        <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-3 text-right sm:text-left">
          <span className="font-display font-bold text-3xl md:text-2xl uppercase tracking-tight">
            BRANDS
          </span>
          {/* <span className="font-cursive text-base md:text-2xl text-primary group-hover:text-white font-normal transition-colors">
            Launch Campaign
          </span> */}
        </div>
      </div>

      {/* 2. Right Subsection: Creators */}
      <div 
        onClick={() => navigate("/login?role=creator")}
        className="group flex items-center justify-between px-6 py-3.5 md:px-10 md:py-5 hover:bg-primary hover:text-white transition-colors duration-300 cursor-pointer text-dark-void dark:text-snow"
      >
        {/* Creator Text */}
        <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-3">
          <span className="font-display font-bold text-3xl md:text-2xl uppercase tracking-tight">
            CREATORS
          </span>
          {/* <span className="font-cursive text-base md:text-2xl text-primary group-hover:text-white font-normal transition-colors">
            Monetize Impact
          </span> */}
        </div>

        {/* Right Arrow Icon & Tag */}
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs hidden lg:inline-block opacity-0 group-hover:opacity-100 transition-opacity uppercase tracking-widest">
            [Connect_Wallet]
          </span>
          <div className="p-2 md:p-2.5 rounded-full bg-primary/10 group-hover:bg-white group-hover:text-primary transition-all">
            <ArrowRight className="w-5 h-5 md:w-6 md:h-6 transform group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </div>

    </div>
  );
};

export default NavigationLinks;