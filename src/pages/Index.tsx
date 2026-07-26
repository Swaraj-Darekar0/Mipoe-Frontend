import React from "react";
import Header from '@/components/Home/Header';
import Hero from '@/components/Home/Hero';
import UGCShowcase from '@/components/Home/UGCShowcase';
import FeatureSplit from '@/components/Home/FeatureSplit';
import IllustratedGuide from '@/components/Home/illustrationGuide';
import ComparisonMatrix from "@/components/Home/ComparisonTable";
import Footer from '@/components/Home/Footer';

const Index = () => {
  return (
    <div className="bg-background-light dark:bg-background-dark text-dark-void dark:text-snow font-mono transition-colors duration-300 antialiased overflow-x-hidden selection:bg-primary selection:text-snow min-h-screen">
      <main className="w-full max-w-[1920px] mx-auto border-x border-dark-void dark:border-dusty-grey/30 min-h-screen flex flex-col relative">
        {/* 1. Header */}
        {/* <Header /> */}
        
        {/* 2. Hero Section with 100% Aligned Video Stencil Mask & Embedded Bottom Boundary Navigation Links */}
        <Hero />
        
        {/* 3. Horizontal 9:16 UGC Reel Clip Showcase */}
        <UGCShowcase />
        
        {/* 4. Manifesto Feature Split */}
        <FeatureSplit />
        
        {/* 5. Interaction Model Guide */}
        <IllustratedGuide />
        
        {/* 6. Comparison Matrix */}
        <ComparisonMatrix />
        
        {/* 7. Footer */}
        <Footer />
      </main>
      
      {/* Decorative Fixed Sidebar Elements */}
      <div className="fixed top-1/2 left-4 w-1 h-16 bg-primary hidden xl:block mix-blend-difference pointer-events-none transform -translate-y-1/2 z-50"></div>
      <div className="fixed top-1/2 right-4 w-1 h-16 bg-primary hidden xl:block mix-blend-difference pointer-events-none transform -translate-y-1/2 z-50"></div>
    </div>
  );
};

export default Index;
