import React from "react";
import { usePersona } from "./PersonaContext";
import { personaContent } from "./personaContent";

const PersonaNavbar: React.FC = () => {
  const { persona, togglePersona } = usePersona();
  const content = personaContent[persona];

  return (
    // Floating, detached rectangular container with margin from the top edge
    // on desktop; full-bleed edge-to-edge on mobile (per the nav spec).
    <div className="sticky top-0 md:top-4 z-50 w-full px-0 md:px-6">
      <nav className="mx-auto max-w-7xl flex items-center justify-between gap-4 border-b md:border border-hairline bg-canvas/95 backdrop-blur-sm md:rounded-2xl md:shadow-[0_1px_2px_rgba(15,15,15,0.04)] px-4 md:px-6 h-14">
        <a href="#" className="font-bold text-[34px] leading-none text-ink-deep shrink-0 whitespace-nowrap">
          sellr.
        </a>

        {/* <div className="hidden md:flex items-center gap-8 flex-1 justify-center min-w-0">
          {content.navLinks.map((link) => (
            <a
              key={link}
              href={
                link.toLowerCase().includes("how")
                  ? "#signaling-factor"
                  : link.toLowerCase().includes("pay") || link.toLowerCase().includes("pric")
                  ? "#faq"
                  : "#calculator"
              }
              className="text-[14px] font-medium text-steel hover:text-ink transition-colors whitespace-nowrap"
            >
              {link}
            </a>
          ))}
        </div> */}

        <button
          type="button"
          onClick={togglePersona}
          className="shrink-0 whitespace-nowrap inline-flex items-center gap-1.5 rounded-full bg-ink-deep px-3.5 py-1.5 text-[20px] font-bold text-black hover:bg-charcoal transition-colors"
        >
         {/* span, not tspan — tspan is an SVG element and React warns on it in
             HTML; browsers render it as an unknown inline element. */}
         View <span className="font-HomeDisplay">{content.toggleLabel}</span>
        </button>
      </nav>
    </div>
  );
};

export default PersonaNavbar;
