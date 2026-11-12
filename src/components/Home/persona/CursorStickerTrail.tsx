import React, { useEffect, useRef } from "react";
import gsap from "gsap";

const STICKERS = [
  "/stickers/fire.svg",
  "/stickers/instant-payout.svg",
  "/stickers/100%-verified.svg",
  "/stickers/zero-friction.svg",
  "/stickers/pure-results.svg",
  "/stickers/abcdef.svg",
  "/stickers/ef.svg",
  "/stickers/ef-run-club.svg",
  "/stickers/vliegensvlug.svg"
];

interface CursorStickerTrailProps {
  containerRef?: React.RefObject<HTMLElement | null>;
  spacing?: number; // Distance threshold in px before spawning next sticker
  disabled?: boolean;
}

/**
 * Sellr Cursor Sticker Trail Engine with Dynamic Button Bounce Physics.
 * High-volume, bold-sized SVG stickers with physical elastic rebound, velocity reversal,
 * surface normal reflection, and rotation impulse away from all clickable button perimeters.
 */
export const CursorStickerTrail: React.FC<CursorStickerTrailProps> = ({
  containerRef,
  spacing = 85,
  disabled = false,
}) => {
  const activeTimelines = useRef<Set<gsap.core.Timeline>>(new Set());

  useEffect(() => {
    if (disabled) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const target = containerRef ? containerRef.current : document.getElementById("hero");
    if (!target) return;

    const isHoverDevice = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

    let stickerIndex = 0;
    let accumulatedDistance = 0;
    let prevX = 0;
    let prevY = 0;
    let initialized = false;

    const spawnSticker = (clientX: number, clientY: number, dx: number, dy: number) => {
      const targetRect = target.getBoundingClientRect();
      const localX = clientX - targetRect.left;
      const localY = clientY - targetRect.top;

      // Boundary clearance: stickers stay inside container and don't spill into adjacent sections
      const EDGE_BUFFER = 48;
      if (localY < EDGE_BUFFER || localY > targetRect.height - EDGE_BUFFER) {
        return;
      }

      // Query clickable elements in container to calculate potential bounce deflection
      const interactiveEls = target.querySelectorAll<HTMLElement>(
        "a, button, [role='button'], input, .btn-link, .button-093, .button-052"
      );

      // Check for proximity and collision vector with any button
      let isBouncing = false;
      let bounceVx = 0;
      let bounceVy = 0;
      let spinImpulse = 0;
      const COLLISION_PAD = 34; // Generous safe buffer distance around button borders

      for (let i = 0; i < interactiveEls.length; i++) {
        const el = interactiveEls[i];
        const wrapper = el.closest(".inline-flex") || el;
        const bRect = wrapper.getBoundingClientRect();

        // Convert button rect to local coordinates relative to target
        const bLeft = bRect.left - targetRect.left;
        const bRight = bRect.right - targetRect.left;
        const bTop = bRect.top - targetRect.top;
        const bBottom = bRect.bottom - targetRect.top;

        // Expanded collision boundary
        const boxLeft = bLeft - COLLISION_PAD;
        const boxRight = bRight + COLLISION_PAD;
        const boxTop = bTop - COLLISION_PAD;
        const boxBottom = bBottom + COLLISION_PAD;

        // Projected point along cursor trajectory
        const projectedX = localX + dx * 2.5;
        const projectedY = localY + dy * 2.5;

        const insideOrNear =
          localX >= boxLeft && localX <= boxRight && localY >= boxTop && localY <= boxBottom;
        const projectedInside =
          projectedX >= boxLeft && projectedX <= boxRight && projectedY >= boxTop && projectedY <= boxBottom;

        if (insideOrNear || projectedInside) {
          isBouncing = true;

          // Closest point on the unpadded button perimeter to the sticker position
          const clampX = Math.max(bLeft, Math.min(bRight, localX));
          const clampY = Math.max(bTop, Math.min(bBottom, localY));

          // Surface normal vector pointing outward from button perimeter
          let nx = localX - clampX;
          let ny = localY - clampY;
          let nLen = Math.hypot(nx, ny);

          if (nLen < 1) {
            // If sticker spawned inside perimeter, use vector from button center
            const bCenterX = (bLeft + bRight) / 2;
            const bCenterY = (bTop + bBottom) / 2;
            nx = localX - bCenterX;
            ny = localY - bCenterY;
            nLen = Math.hypot(nx, ny) || 1;
          }

          nx /= nLen;
          ny /= nLen;

          // Physical elastic reflection: v_refl = v - 2(v · n)n
          const dot = (dx * 1.5) * nx + (dy * 1.5) * ny;
          const reflX = (dx * 1.5) - (dot < 0 ? 2 * dot * nx : 0);
          const reflY = (dy * 1.5) - (dot < 0 ? 2 * dot * ny : 0);

          // Elastic impulse along outward normal
          const elasticImpulse = 110 + Math.random() * 50;
          bounceVx = reflX * 0.4 + nx * elasticImpulse;
          bounceVy = reflY * 0.4 + ny * elasticImpulse;

          // Physical spin torque: τ = (r × v)_z
          const torque = dx * ny - dy * nx;
          const spinSign = torque >= 0 ? 1 : -1;
          spinImpulse = spinSign * (55 + Math.random() * 40);

          break;
        }
      }

      const img = document.createElement("img");
      img.className = "sellr-trail-sticker pointer-events-none select-none absolute z-20";
      img.src = STICKERS[stickerIndex % STICKERS.length];
      img.alt = "";
      img.setAttribute("aria-hidden", "true");
      img.draggable = false;

      // Bold, expressive sizing matching high-impact aesthetic
      Object.assign(img.style, {
        position: "absolute",
        left: "0px",
        top: "0px",
        width: "clamp(68px, 7.2vw, 96px)",
        height: "auto",
        pointerEvents: "none",
        userSelect: "none",
        willChange: "transform, opacity",
        filter: "drop-shadow(0 6px 18px rgba(0,0,0,0.12))",
      });

      target.appendChild(img);
      stickerIndex = (stickerIndex + 1) % STICKERS.length;

      const tl = gsap.timeline({
        onComplete: () => {
          activeTimelines.current.delete(tl);
          img.remove();
          tl.kill();
        },
      });

      activeTimelines.current.add(tl);

      const initialRot = (Math.random() - 0.5) * 22;

      if (isBouncing) {
        // ELASTIC BOUNCE PHYSICS:
        // 1. Initial quick pop and contact squash
        tl.fromTo(
          img,
          {
            xPercent: -50,
            yPercent: -50,
            scaleX: 0.6,
            scaleY: 0.6,
            opacity: 0,
            x: localX,
            y: localY,
            rotation: initialRot,
          },
          {
            scaleX: 1.25,
            scaleY: 0.80,
            opacity: 1,
            duration: 0.12,
            ease: "power2.out",
          }
        );

        // 2. High-restitution elastic rebound arc using elastic.out easing
        tl.to(
          img,
          {
            x: localX + bounceVx,
            y: localY + bounceVy,
            rotation: initialRot + spinImpulse,
            scaleX: 1,
            scaleY: 1,
            duration: 0.75,
            ease: "elastic.out(1.15, 0.45)",
          },
          "-=0.04"
        );

        // 3. Smooth, subtle dissipation
        tl.to(
          img,
          {
            opacity: 0,
            scale: 0.85,
            duration: 0.42,
            ease: "power2.in",
          },
          "-=0.25"
        );
      } else {
        // NATURAL MOMENTUM DRIFT across open canvas:
        tl.fromTo(
          img,
          {
            xPercent: -50,
            yPercent: -50,
            scale: 0.75,
            opacity: 0,
            x: localX,
            y: localY,
            rotation: initialRot,
          },
          {
            scale: 1,
            opacity: 0.96,
            duration: 0.22,
            ease: "power2.out",
          }
        );

        const driftDist = Math.max(16, Math.min(75, Math.sqrt(dx * dx + dy * dy) * 1.8));
        const dirX = dx !== 0 ? (dx / Math.abs(dx)) * driftDist : 0;
        const dirY = dy !== 0 ? (dy / Math.abs(dy)) * driftDist : 14;

        tl.to(
          img,
          {
            x: localX + dirX,
            y: localY + dirY,
            rotation: initialRot + (Math.random() - 0.5) * 18,
            duration: 0.9,
            ease: "power1.out",
          },
          "<"
        );

        tl.to(
          img,
          {
            opacity: 0,
            scale: 0.85,
            y: `+=${dirY >= 0 ? 12 : -12}`,
            duration: 0.48,
            ease: "power2.in",
          },
          "-=0.35"
        );
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      const clientX = e.clientX;
      const clientY = e.clientY;

      const targetRect = target.getBoundingClientRect();

      // 1. Strictly stay within the target container bounds
      if (
        clientX < targetRect.left ||
        clientX > targetRect.right ||
        clientY < targetRect.top ||
        clientY > targetRect.bottom
      ) {
        initialized = false;
        accumulatedDistance = 0;
        return;
      }

      if (!initialized) {
        initialized = true;
        prevX = clientX;
        prevY = clientY;
        return;
      }

      const dx = clientX - prevX;
      const dy = clientY - prevY;
      accumulatedDistance += Math.abs(dx) + Math.abs(dy);

      // Check if mouse cursor is currently directly on top of an interactive element
      // (safety deadzone: don't spawn sticker right under the cursor when user is clicking)
      const buttons = target.querySelectorAll<HTMLElement>(
        "a, button, [role='button'], input, .btn-link, .button-093, .button-052"
      );
      let cursorOnButton = false;
      for (let i = 0; i < buttons.length; i++) {
        const btn = buttons[i];
        const wrapper = btn.closest(".inline-flex") || btn;
        const bRect = wrapper.getBoundingClientRect();
        if (
          clientX >= bRect.left - 14 &&
          clientX <= bRect.right + 14 &&
          clientY >= bRect.top - 14 &&
          clientY <= bRect.bottom + 14
        ) {
          cursorOnButton = true;
          break;
        }
      }

      if (!cursorOnButton && accumulatedDistance >= spacing) {
        accumulatedDistance = 0;
        spawnSticker(clientX, clientY, dx, dy);
      }

      prevX = clientX;
      prevY = clientY;
    };

    const handleMouseLeave = () => {
      initialized = false;
      accumulatedDistance = 0;
    };

    const handleScroll = () => {
      const targetRect = target.getBoundingClientRect();
      const stickers = target.querySelectorAll<HTMLElement>(".sellr-trail-sticker");
      if (stickers.length === 0) return;

      const topOffset = targetRect.top;
      const bottomOffset = targetRect.bottom;

      // Calculate fade ratio as container scrolls past viewport bounds
      let fadeRatio = 1;
      if (topOffset < 0) {
        // Exiting through the top (Hero scrolling down to next section)
        fadeRatio = Math.max(0, Math.min(1, bottomOffset / (targetRect.height * 0.45)));
      } else if (bottomOffset > window.innerHeight) {
        // Exiting through the bottom (Footer scrolling away)
        fadeRatio = Math.max(0, Math.min(1, (window.innerHeight - topOffset) / (targetRect.height * 0.45)));
      }

      if (fadeRatio < 0.95) {
        stickers.forEach((s) => {
          gsap.to(s, { opacity: fadeRatio, duration: 0.18, ease: "power1.out", overwrite: "auto" });
        });
      }

      if (bottomOffset < 20 || topOffset > window.innerHeight - 20 || fadeRatio <= 0.05) {
        activeTimelines.current.forEach((t) => t.kill());
        activeTimelines.current.clear();
        stickers.forEach((el) => el.remove());
      }
    };

    // Tap-to-spawn listener for touch devices (Mobile / Tablet)
    const handlePointerDown = (e: PointerEvent) => {
      const clickTarget = e.target as HTMLElement | null;
      if (clickTarget && clickTarget.closest("a, button, input, [role='button'], .btn-link")) {
        return; // Don't block button interaction
      }
      const dx = (Math.random() - 0.5) * 36;
      const dy = -20 + (Math.random() - 0.5) * 16;
      spawnSticker(e.clientX, e.clientY, dx, dy);
    };

    if (isHoverDevice) {
      target.addEventListener("mousemove", handleMouseMove as EventListener, { passive: true });
      target.addEventListener("mouseleave", handleMouseLeave as EventListener);
    }
    target.addEventListener("pointerdown", handlePointerDown as EventListener, { passive: true });
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      if (isHoverDevice) {
        target.removeEventListener("mousemove", handleMouseMove as EventListener);
        target.removeEventListener("mouseleave", handleMouseLeave as EventListener);
      }
      target.removeEventListener("pointerdown", handlePointerDown as EventListener);
      window.removeEventListener("scroll", handleScroll);

      activeTimelines.current.forEach((t) => t.kill());
      activeTimelines.current.clear();
      target.querySelectorAll(".sellr-trail-sticker").forEach((el) => el.remove());
    };
  }, [containerRef, spacing, disabled]);

  return null;
};

export default CursorStickerTrail;
