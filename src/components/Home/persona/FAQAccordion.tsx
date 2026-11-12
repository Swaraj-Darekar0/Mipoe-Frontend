import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { personaContent } from "./personaContent";
import type { Persona } from "./personaContent";
import SquishyWord from "./SquishySectionHeading";
import HighlightedText from "./HighlightedText";

gsap.registerPlugin(ScrollTrigger);

interface FAQAccordionProps {
  persona: Persona;
}

/**
 * Extrafazant-Inspired Fluid Motion FAQ Accordion Component
 * Features:
 * - Squishy Headline with Variable Font Proximity Physics & Chisel Highlighter
 * - Smooth spring-based grid height transitions with cubic-bezier(0.34, 1.4, 0.64, 1)
 * - Card hover elevation with tactile arrow rotation
 * - Automatic ScrollTrigger.refresh() on accordion toggles to prevent smoother layout clipping
 */
export const FAQAccordion: React.FC<FAQAccordionProps> = ({ persona }) => {
  const items = personaContent[persona].faq;
  const [openIndex, setOpenIndex] = useState<number | null>(0); // First item open by default

  const toggleItem = (index: number) => {
    const nextState = openIndex === index ? null : index;
    setOpenIndex(nextState);

    // Give the DOM a frame to animate, then inform ScrollSmoother and ScrollTrigger
    requestAnimationFrame(() => {
      setTimeout(() => {
        ScrollTrigger.refresh();
      }, 360);
    });
  };

  const accentColor =
    persona === "creator" ? "bg-creator-pink/30" : "bg-orange-500/25";

  return (
    <section
      id="faq"
      className="w-full bg-canvas py-20 sm:py-24 md:py-32 border-t border-hairline/60 overflow-visible"
    >
      <div className="max-w-3xl mx-auto px-5 sm:px-6 md:px-8">
        {/* Section Header with Squishy Physics & Signature Highlight */}
        <div className="text-center mb-10 sm:mb-14 select-none">
          <p className="font-serif italic text-charcoal/80 text-xl sm:text-2xl mb-1.5 tracking-normal">
            Got Questions?
          </p>
          <h2 className="text-3xl sm:text-5xl md:text-6xl font-display font-black uppercase tracking-tight text-ink leading-tight flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
            <SquishyWord text="FREQUENTLY ASKED" />
            <HighlightedText colorClass={accentColor} textColorClass="text-ink-deep">
              QUESTIONS
            </HighlightedText>
          </h2>
        </div>

        {/* Extrafazant Spring-Motion Accordion List */}
        <div className="flex flex-col gap-3.5 sm:gap-4 w-full">
          {items.map((item, i) => {
            const isOpen = openIndex === i;

            return (
              <div
                key={i}
                className={`rounded-2xl border transition-all duration-300 overflow-hidden ${
                  isOpen
                    ? "bg-white border-black/15 shadow-[0_12px_36px_rgba(0,0,0,0.06)]"
                    : "bg-white/70 hover:bg-white border-hairline hover:border-black/10 shadow-[0_2px_8px_rgba(0,0,0,0.02)]"
                }`}
              >
                <button
                  type="button"
                  onClick={() => toggleItem(i)}
                  aria-expanded={isOpen}
                  className="w-full text-left px-5 sm:px-6 py-4.5 sm:py-5 flex items-center justify-between gap-4 cursor-pointer select-none transition-transform duration-150 active:scale-[0.99]"
                >
                  <span className="text-[16px] sm:text-[18px] font-display font-bold text-ink tracking-tight leading-snug">
                    {item.question}
                  </span>

                  <motion.div
                    animate={{
                      rotate: isOpen ? 180 : 0,
                      backgroundColor: isOpen
                        ? persona === "creator"
                          ? "#fadbe8"
                          : "#ffe6d5"
                        : "#f3f3f5",
                    }}
                    transition={{
                      type: "spring",
                      stiffness: 400,
                      damping: 25,
                    }}
                    className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 border border-black/5 text-ink shadow-xs"
                  >
                    <ChevronDown className="w-4 h-4 stroke-[2.5]" />
                  </motion.div>
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      key={`content-${i}`}
                      initial={{ height: 0, opacity: 0 }}
                      animate={{
                        height: "auto",
                        opacity: 1,
                        transition: {
                          height: {
                            duration: 0.38,
                            ease: [0.34, 1.4, 0.64, 1], // Extrafazant bounce spring
                          },
                          opacity: { duration: 0.25, delay: 0.08 },
                        },
                      }}
                      exit={{
                        height: 0,
                        opacity: 0,
                        transition: {
                          height: { duration: 0.28, ease: "easeInOut" },
                          opacity: { duration: 0.18 },
                        },
                      }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 sm:px-6 pb-5 sm:pb-6 pt-1 text-[14.5px] sm:text-[15.5px] font-body leading-relaxed text-charcoal/75 border-t border-black/5">
                        {item.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default FAQAccordion;
