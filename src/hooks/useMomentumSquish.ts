import { useEffect, useRef } from "react";
import gsap from "gsap";

interface UseMomentumSquishOptions {
  squishX?: number;
  squishY?: number;
  duration?: number;
  reboundDuration?: number;
}

export function useMomentumSquish<T extends HTMLElement>(
  options: UseMomentumSquishOptions = {}
) {
  const ref = useRef<T | null>(null);
  const {
    squishX = 1.035,
    squishY = 0.965,
    duration = 0.18,
    reboundDuration = 0.65,
  } = options;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let tween: gsap.core.Tween | null = null;

    const onMouseEnter = () => {
      if (tween) tween.kill();
      tween = gsap.to(el, {
        scaleX: squishX,
        scaleY: squishY,
        duration,
        ease: "power2.out",
        onComplete: () => {
          tween = gsap.to(el, {
            scaleX: 1,
            scaleY: 1,
            duration: reboundDuration,
            ease: "elastic.out(1.2, 0.4)",
          });
        },
      });
    };

    el.addEventListener("mouseenter", onMouseEnter);

    return () => {
      el.removeEventListener("mouseenter", onMouseEnter);
      if (tween) tween.kill();
    };
  }, [squishX, squishY, duration, reboundDuration]);

  return ref;
}

export default useMomentumSquish;
