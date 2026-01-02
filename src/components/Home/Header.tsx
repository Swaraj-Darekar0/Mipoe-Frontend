import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="grid-border w-full flex justify-between items-start px-4 py-2 text-xs uppercase tracking-widest text-dusty-grey">
      <div className="flex gap-8">
        <span>Mipoe_UI</span>
        <span className="hidden sm:inline">Freedom from Algorithms</span>
      </div>
      <div className="flex gap-8 text-right">
        <span className="hidden sm:inline">25.04.2025 — ∞</span>
        <span>The Era of Human Virality</span>
      </div>
    </header>
  );
};

export default Header;