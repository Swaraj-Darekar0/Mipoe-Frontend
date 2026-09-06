import React, { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { PersonaProvider, usePersona } from "./PersonaContext";
import PersonaNavbar from "./PersonaNavbar";
import HeroCreator from "./HeroCreator";
import HeroBrand from "./HeroBrand";
import SignalingCarousel from "./SignalingCarousel";
import EarningsCalculator from "./EarningsCalculator";
import FAQAccordion from "./FAQAccordion";
import { personaContent } from "./personaContent";

gsap.registerPlugin(ScrollTrigger);

const PersonaBody: React.FC = () => {
  const { persona } = usePersona();
  const content = personaContent[persona];

  // Switching persona swaps the entire page body, and the two personas are not
  // the same height — the creator hero is one viewport, the brand hero another,
  // and the FAQ answers differ in length. ScrollSmoother's scroll range is
  // measured rather than live, so it has to be told.
  //
  // After the crossfade, not during: `mode="wait"` unmounts the outgoing hero
  // before mounting the incoming one, so measuring on the persona change itself
  // measures the gap between them.
  useEffect(() => {
    const id = window.setTimeout(() => ScrollTrigger.refresh(), 260);
    return () => window.clearTimeout(id);
  }, [persona]);

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
