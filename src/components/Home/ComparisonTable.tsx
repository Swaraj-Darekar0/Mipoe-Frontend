import React from 'react';

interface ComparisonRow {
  label: string;
  definition: string;
  competitors: string;
  mipoe: string;
}

const comparisonData: ComparisonRow[] = [
  {
    label: "THE TRUST PROTOCOL",
    definition: "Do they believe you?",
    competitors: "Low (Spam) / Medium (Scripted)",
    mipoe: "HIGH: 92% (Peer-to-Peer)"
  },
  {
    label: "COST EFFICIENCY",
    definition: "Price per result.",
    competitors: "High (Bidding War) / Highest (Retainers)",
    mipoe: "LOW: 40% Less (Pay-on-Impact)"
  },
  {
    label: "DISTRIBUTION ENGINE",
    definition: "How it spreads.",
    competitors: "Forced Push / Managed Hand-holding",
    mipoe: "VIRAL: Organic 'Swell'"
  },
  {
    label: "CULTURAL RESONANCE",
    definition: "Native vs. Generic.",
    competitors: "Generic Translated / Limited 'Creative Team'",
    mipoe: "HYPER-LOCAL: 10+ Native Dialects"
  },
  {
    label: "OPERATIONAL DRAG",
    definition: "Your time wasted.",
    competitors: "Constant Tweaking / Long Meetings",
    mipoe: "ZERO: Automated Scaling"
  }
];

const ComparisonMatrix: React.FC = () => {
  return (
    <section className="w-full bg-dark-void py-16 md:py-24 border-b border-dusty-grey/30">
      {/* Header Band */}
      <div className="px-6 md:px-10 lg:px-16 mb-12">
        <h2 className="font-display font-black text-5xl md:text-7xl lg:text-8xl text-snow leading-none uppercase tracking-tighter">
          THE EVOLUTION <br />OF <span className="font-['Parisienne',cursive] text-[1.68em] text-[#FF5C00] \ tracking-normal normal-case">Advertising.</span>
        </h2>
        <p className="font-mono text-sm md:text-base text-dusty-grey mt-6 uppercase tracking-widest">
          // Stop fighting the algorithm. Start using it.
        </p>
      </div>

      {/* Comparison Grid */}
      <div className="px-4 md:px-10 lg:px-16 overflow-x-auto">
        <div className="min-w-[800px] grid grid-cols-[1fr_2.5fr_1.5fr] gap-0 border border-dusty-grey/30">
          
          {/* Grid Headers */}
          <div className="p-6 border-b border-r border-dusty-grey/30 bg-dark-void/50 font-mono text-xs text-dusty-grey uppercase sticky left-0 z-20">
            Factors & Definitions
          </div>
          <div className="p-6 border-b border-r border-dusty-grey/30 bg-dark-void/50 font-mono text-xs text-dusty-grey uppercase">
            Traditional Ads & Agencies (The Old World)
          </div>
          <div className="p-6 border-b border-dusty-grey/30 bg-glucon-grey font-mono text-xs text-primary uppercase text-center font-bold">
            Mipoe (The New World)
          </div>

          {/* Grid Rows */}
          {comparisonData.map((row, index) => (
            <React.Fragment key={index}>
              {/* Factors Column */}
              <div className="p-6 border-b border-r border-dusty-grey/30 flex flex-col justify-center bg-dark-void sticky left-0 z-10">
                <span className="font-display font-bold text-snow text-lg leading-tight uppercase">
                  {row.label}
                </span>
                <span className="font-mono text-[10px] text-dusty-grey mt-1 uppercase">
                  {row.definition}
                </span>
              </div>

              {/* Competitors Column */}
              <div className="p-6 border-b border-r border-dusty-grey/30 flex items-center text-dusty-grey font-mono text-sm opacity-60">
                {row.competitors}
              </div>

              {/* Mipoe Column (The Winner) */}
              <div className="relative p-6 border-b border-primary/40 bg-glucon-grey flex items-center justify-center text-center group">
                {/* Border Highlight Effect */}
                <div className="absolute inset-0 border-l border-r border-primary/30 z-0 pointer-events-none group-hover:bg-primary/5 transition-colors duration-300"></div>
                
                <span className="relative z-10 font-mono font-bold text-primary text-sm lg:text-base tracking-tight uppercase">
                  {row.mipoe}
                </span>
              </div>
            </React.Fragment>
          ))}
          
          {/* Footer of Grid */}
          <div className="col-span-2 p-4 bg-dark-void/30"></div>
          <div className="p-4 bg-glucon-grey text-center">
            <span className="font-mono text-[10px] text-primary/60 uppercase">
              Ready to Upgrade?
            </span>
          </div>
        </div>
      </div>

      {/* Decorative Glow */}
      <div className="mt-12 px-6 md:px-10 lg:px-16 flex justify-end">
        <div className="w-full md:w-1/3 p-1 bg-gradient-to-r from-transparent to-primary/20 rounded-full blur-xl"></div>
      </div>
    </section>
  );
};

export default ComparisonMatrix;