import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { PersonaProvider, usePersona } from "./PersonaContext";
import PersonaNavbar from "./PersonaNavbar";
import HeroCreator from "./HeroCreator";
import HeroBrand from "./HeroBrand";
import SignalingCarousel from "./SignalingCarousel";
import EarningsCalculator from "./EarningsCalculator";
import FAQAccordion from "./FAQAccordion";
import { personaContent } from "./personaContent";

const PersonaBody: React.FC = () => {
  const { persona } = usePersona();
  const content = personaContent[persona];

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={persona}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18, ease: "easeOut" }}
      >
        {persona === "creator" ? <HeroCreator /> : <HeroBrand />}
        <SignalingCarousel label={content.carouselLabel} intro={content.carouselIntro} steps={content.steps} />
        <EarningsCalculator persona={persona} />
        <FAQAccordion persona={persona} />
      </motion.div>
    </AnimatePresence>
  );
};

const PersonaHome: React.FC = () => {
  return (
    <PersonaProvider>
      {/* The Index page wrapper still carries the legacy `font-mono` class for
          the sections below; reset back to the Notion-spec Inter stack here
          so the persona redesign doesn't inherit the old terminal typeface. */}
      <div className="font-body">
        <PersonaNavbar />
        <PersonaBody />
      </div>
    </PersonaProvider>
  );
};

export default PersonaHome;
