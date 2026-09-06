import React, { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ScrollSmoother } from "gsap/ScrollSmoother";

// Registered at module scope. ScrollSmoother is built ON ScrollTrigger, so both
// have to be registered before any instance exists, and registration is
// idempotent — doing it here rather than inside the effect means it has already
// happened for anything else on the page that reaches for ScrollTrigger.
gsap.registerPlugin(ScrollTrigger, ScrollSmoother);

interface SmoothScrollProps {
  children: React.ReactNode;
  /** Seconds the content takes to catch up to the real scroll position. */
  smooth?: number;
}

/**
 * Page-level smooth scrolling.
 *
 * ScrollSmoother works by fixing a wrapper to the viewport and TRANSFORMING the
 * content inside it, letting the transform lag the real scroll position. That
 * transform has one consequence worth knowing before adding anything to the
 * page: it makes `#smooth-content` the containing block for every `fixed`
 * descendant, and it removes the scrolling ancestor `sticky` needs. So
 * position: fixed and position: sticky DO NOT WORK inside here. Anything that
 * has to stay put belongs outside the wrapper — PersonaNavbar portals itself to
 * <body> for exactly this reason.
 */
const SmoothScroll: React.FC<SmoothScrollProps> = ({ children, smooth = 1.1 }) => {
  const wrapper = useRef<HTMLDivElement>(null);
  const content = useRef<HTMLDivElement>(null);

  // useLayoutEffect, not useEffect: the smoother measures the content and takes
  // the scroll position over. After paint would mean one frame rendered against
  // the un-smoothed layout, which shows up as a jump on load.
  useLayoutEffect(() => {
    // Under reduced motion the smoother is simply never created, and that is
    // the whole fallback: ScrollSmoother applies its own fixed-wrapper CSS at
    // create time, so with no instance these two divs are inert and the page
    // scrolls natively. No second code path to keep in step.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const smoother = ScrollSmoother.create({
      wrapper: wrapper.current!,
      content: content.current!,
      smooth,
      // Enables data-speed / data-lag on descendants, so a section can opt into
      // parallax later without this component changing.
      effects: true,
      // Touch keeps the platform's own momentum. Smoothing it fights the
      // gesture, and it would fight the lanyard hardest: that canvas is
      // full-bleed and hands vertical panning back to the browser through
      // `touch-action: pan-y`, which only works if the browser is still the
      // one scrolling.
      smoothTouch: false,
      // normalizeScroll takes wheel and touch input over globally. The brand
      // hero is a WebGL canvas doing its own pointer capture for the card drag,
      // so input stays where the browser put it.
      normalizeScroll: false,
      // The heroes are sized in svh. A mobile address bar sliding away is
      // therefore not a layout change, and not worth re-measuring the page for.
      ignoreMobileResize: true,
    });

    // The scroll range is MEASURED, not live, and a good deal of this page's
    // height lands after first layout: Abril Fatface sets the creator headline
    // at a size derived from the container, and the brand hero's lanyard is a
    // lazy chunk that then pulls a GLB.
    let alive = true;
    const refresh = () => {
      if (alive) ScrollTrigger.refresh();
    };
    document.fonts?.ready.then(refresh);

    return () => {
      alive = false;
      smoother.kill();
    };
  }, [smooth]);

  // Neither div may carry margin or padding: ScrollSmoother measures against
  // them, so any offset here is baked into every scroll position on the page.
  return (
    <div id="smooth-wrapper" ref={wrapper}>
      <div id="smooth-content" ref={content}>
        {children}
      </div>
    </div>
  );
};

export default SmoothScroll;
