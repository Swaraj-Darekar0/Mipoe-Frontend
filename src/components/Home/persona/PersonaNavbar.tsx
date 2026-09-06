import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion, useReducedMotion } from "framer-motion";
import { usePersona } from "./PersonaContext";
import type { Persona } from "./personaContent";

/** Both persona names live in the switch, so `content.toggleLabel` (which only
 *  ever names the *other* persona) is the wrong source here. */
const PERSONAS: ReadonlyArray<{ id: Persona; label: string }> = [
  { id: "creator", label: "Creators" },
  { id: "brand", label: "Brands" },
];

const PersonaNavbar: React.FC = () => {
  const { persona, setPersona } = usePersona();
  const reduceMotion = useReducedMotion();

  // PORTALLED TO <body>, AND BOTH REASONS ARE STRUCTURAL.
  //
  // 1. ScrollSmoother drives the page by putting a transform on
  //    #smooth-content. A transform makes that element the containing block
  //    for every `fixed` descendant, so a navbar left inside the page content
  //    would scroll away with it. Outside the smoothed subtree it is immune.
  // 2. `fixed` (rather than the `sticky` this used to be) means the nav
  //    reserves NO layout height. Sticky stays in flow, so the old bar pushed
  //    the hero ~50px down the page and the lanyard strap — which is pinned to
  //    the top of the hero — began mid-air instead of at the screen edge. The
  //    full-width bar used to hide that; a centred pill does not.
  const [host, setHost] = useState<HTMLElement | null>(null);
  useEffect(() => setHost(document.body), []);

  const nav = (
    // Floating pill that hugs its own content instead of spanning the page:
    // the nav is a control, not a container, so it gets no more width than the
    // wordmark plus the switch need. `font-body` is set here rather than
    // inherited, because the portal puts this outside the page's font wrapper.
    <div className="fixed inset-x-0 top-3 md:top-4 z-50 px-4 font-body pointer-events-none">
      <nav
        className="pointer-events-auto mx-auto flex h-11 md:h-12 w-fit max-w-full items-center gap-3 md:gap-5
                   rounded-full border border-hairline bg-canvas/85 backdrop-blur-md
                   pl-3.5 pr-1.5 md:pl-4 md:pr-2
                   shadow-[0_1px_2px_rgba(15,15,15,0.04),0_10px_28px_-16px_rgba(15,15,15,0.16)]"
      >
        <a
          href="#"
          className="font-bold text-[20px] md:text-[23px] leading-none tracking-[-0.02em]
                     text-ink-deep shrink-0 whitespace-nowrap"
        >
          sellr.
        </a>

        {/* Segmented switch. The active segment is the persona currently on
            screen, so the highlight doubles as a "you are here" marker. */}
        <div
          role="group"
          aria-label="Choose your view"
          className="relative flex h-8 md:h-9 shrink-0 items-center rounded-full bg-surface p-[3px]"
        >
          {PERSONAS.map(({ id, label }) => {
            const active = persona === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setPersona(id)}
                aria-pressed={active}
                className="relative flex h-full items-center justify-center rounded-full
                           px-3 md:px-4 text-[12.5px] md:text-[13px] font-medium leading-none
                           whitespace-nowrap outline-none
                           focus-visible:ring-2 focus-visible:ring-ink-deep/25
                           focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
              >
                {active && (
                  // Shared layoutId: the black pill travels between segments
                  // rather than cutting, which is what reads as a switch.
                  <motion.span
                    layoutId="persona-switch-thumb"
                    className="absolute inset-0 rounded-full bg-ink-deep"
                    transition={
                      reduceMotion
                        ? { duration: 0 }
                        : { type: "spring", stiffness: 440, damping: 36, mass: 0.6 }
                    }
                  />
                )}
                <span
                  className={`relative z-10 transition-colors duration-150 ${
                    active ? "text-canvas" : "text-steel hover:text-ink"
                  }`}
                >
                  {label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );

  // Rendered in place for the first paint only — `document` is read in an
  // effect so this stays safe to render before hydration/mount.
  return host ? createPortal(nav, host) : nav;
};

export default PersonaNavbar;
