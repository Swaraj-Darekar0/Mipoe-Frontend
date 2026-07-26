import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="sticky top-0 z-40 w-full grid-border backdrop-blur-md px-4 md:px-8 py-3 text-xs uppercase tracking-widest text-dark-void dark:text-snow flex justify-between items-center transition-all duration-300">
      <div className="flex items-center gap-6">
        {/* <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
          <span className="font-display font-bold text-sm tracking-tight text-primary">MIPOE</span>
        </div> */}
        <span className="hidden sm:inline font-mono text-dusty-grey text-[11px] border-l border-white/20 pl-6">
          Freedom from Algorithms
        </span>
      </div>

      <div className="flex items-center gap-6 text-right">
        <span className="hidden md:inline font-mono text-dusty-grey text-[11px]">
          2026 — ∞ Protocol
        </span>
        <span className="font-mono text-[11px] text-primary border border-primary/40 px-2.5 py-1 rounded-full bg-primary/10">
          The Era of Sales X Virality
        </span>
      </div>
    </header>
  );
};

export default Header;