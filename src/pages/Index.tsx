import React from "react";
import Header from '@/components/Home/Header';
import Hero from '@/components/Home/Hero';
import PersonaHome from '@/components/Home/persona/PersonaHome';
import UGCShowcase from '@/components/Home/UGCShowcase';
import FeatureSplit from '@/components/Home/FeatureSplit';
import IllustratedGuide from '@/components/Home/illustrationGuide';
import ComparisonMatrix from "@/components/Home/ComparisonTable";
import Footer from '@/components/Home/Footer';

const Index = () => {
  return (
    <div className="bg-background-light dark:bg-background-dark text-dark-void dark:text-snow font-mono transition-colors duration-300 antialiased overflow-x-hidden selection:bg-primary selection:text-snow min-h-screen">
      {/* border-x is scoped to md+ : at mobile widths the page fills the
          viewport, so the rule sat hard against both screen edges and read as
          a stray vertical line beside the content rather than a page frame. */}
      <main className="w-full max-w-[1920px] mx-auto md:border-x border-dark-void dark:border-dusty-grey/30 min-h-screen flex flex-col relative">
        {/* 1. Header */}
        {/* <Header /> */}

        {/* 2. Persona-toggling Hero + Signaling Factor + Earnings Calculator + FAQ (sellr rebrand) */}
        <PersonaHome />

        {/* Old video Hero — superseded by PersonaHome above, kept in the codebase but not rendered */}
        {/* <Hero /> */}

        {/* 3. Horizontal 9:16 UGC Reel Clip Showcase */}
        <UGCShowcase />
        
        {/* 4. Manifesto Feature Split */}
        {/* <FeatureSplit /> */}
        
        {/* 5. Interaction Model Guide */}
        {/* <IllustratedGuide /> */}
        
        {/* 6. Comparison Matrix */}
        {/* <ComparisonMatrix /> */}
        
        {/* 7. Footer */}
        <Footer />
      </main>
    </div>
  );
};

export default Index;
