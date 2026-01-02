import React from 'react';
import { ArrowRight } from 'lucide-react';
import { useParams, useNavigate } from "react-router-dom";

const NavigationLinks: React.FC = () => {
  const navigate = useNavigate();
  return (
    <section className="w-full flex flex-col">
      <a
        className="group grid-border text-black dark:text-dark w-full flex justify-between items-center p-6 md:p-10 bg-background-light dark:bg-background-dark hover:bg-primary hover:text-dark-void dark:hover:bg-primary dark:hover:text-dark-void transition-colors duration-300 cursor-pointer relative overflow-hidden"
        onClick={() => navigate("/login")}
      >
        <div className="z-10 flex flex-col md:flex-row md:items-baseline gap-4">
          <span className=" font-display font-bold text-4xl md:text-5xl lg:text-6xl tracking-tight">
            BRANDS:
          </span>
          <span className=" font-display italic text-3xl md:text-4xl lg:text-5xl font-light">
            Launch Campaign
          </span>
        </div>
        <div  className="z-10 text-black dark:text-black flex items-center gap-2">
          <span className="font-mono text-sm cursor-pointer hidden md:inline-block opacity-0 group-hover:opacity-100 transition-opacity uppercase mr-4">
            [Initialize]
          </span>
          <ArrowRight className="w-12 h-12 transform group-hover:translate-x-2 transition-transform" />
        </div>
      </a>
      <a
        className="group grid-border-black w-full flex justify-between items-center p-6 md:p-10 dark:bg-dark-void dark:text-white text-snow hover:bg-primary hover:text-dark-void dark:hover:bg-primary dark:hover:text-dark-void transition-colors duration-300 cursor-pointer border-t border-dark-void dark:border-dusty-grey/30"
        onClick={() => navigate("/login")}
      >
        <div className="z-10 flex flex-col md:flex-row md:items-baseline gap-4">
          <span className="font-display font-bold text-4xl md:text-5xl lg:text-6xl tracking-tight">
            CREATORS:
          </span>
          <span className="font-display italic text-3xl md:text-4xl lg:text-5xl font-light">
            Monetize Impact
          </span>
        </div>
        <div  className="z-10 flex items-center gap-2">
          <span className="font-mono text-sm hidden md:inline-block opacity-0 group-hover:opacity-100 transition-opacity uppercase mr-4">
            [Connect_Wallet]
          </span>
          <ArrowRight className="w-12 h-12 transform group-hover:translate-x-2 transition-transform" />
        </div>
      </a>
    </section>
  );
};

export default NavigationLinks;