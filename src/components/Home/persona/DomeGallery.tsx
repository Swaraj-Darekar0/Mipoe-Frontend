import React, { useEffect, useMemo, useRef, useCallback } from "react";
import { useGesture } from "@use-gesture/react";

export interface DomeImage {
  src: string;
  alt?: string;
}

interface DomeGalleryProps {
  images?: (string | DomeImage)[];
  fit?: number;
  fitBasis?: "auto" | "min" | "max" | "width" | "height";
  minRadius?: number;
  maxRadius?: number;
  padFactor?: number;
  overlayBlurColor?: string;
  maxVerticalRotationDeg?: number;
  dragSensitivity?: number;
  enlargeTransitionMs?: number;
  dragDampening?: number;
  imageBorderRadius?: string;
  openedImageBorderRadius?: string;
  grayscale?: boolean;
  autoRotate?: boolean;
  autoRotateSpeed?: number;
}

interface DomeItem {
  /** Centre latitude in degrees: -90 is the south pole, +90 the north. */
  lat: number;
  /** Longitude in degrees around the globe. */
  lon: number;
  /**
   * Card width (at its equator-facing edge) as a fraction of the sphere
   * radius: that edge's circumference share, so adjacent cards in a ring
   * touch along their wide edges and the meridian gaps between them stay
   * constant-width lines that converge at the poles.
   */
  widthFactor: number;
  /**
   * Width of the pole-facing edge relative to the equator-facing edge —
   * cos(latNarrow)/cos(latWide). 1 at the equator, 0 at the poles, where the
   * card closes into a wedge and the whole ring converges to a point.
   */
  taper: number;
  /** Which edge of the card faces its pole (the tapered edge). */
  narrowEdge: "top" | "bottom";
  src: string;
  alt: string;
}

const DEFAULTS = {
  // 360 = free spin: vertical rotation wraps like a trackball, so the globe
  // can be rolled up and over its poles. Pass anything < 180 to restore a
  // clamped tilt instead.
  maxVerticalRotationDeg: 360,
  dragSensitivity: 20,
  enlargeTransitionMs: 300,
};

const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max);
const normalizeAngle = (d: number) => ((d % 360) + 360) % 360;
const wrapAngleSigned = (deg: number) => {
  const a = (((deg + 180) % 360) + 360) % 360;
  return a - 180;
};
const getDataNumber = (el: HTMLElement, name: string, fallback: number) => {
  const attr = el.dataset[name] ?? el.getAttribute(`data-${name}`);
  const n = attr == null ? NaN : parseFloat(attr);
  return Number.isFinite(n) ? n : fallback;
};

function buildItems(pool: (string | DomeImage)[], latBands: number): DomeItem[] {
  const bandDeg = 180 / latBands;
  const toRad = Math.PI / 180;

  // Meridian tiling — the cards follow the globe's imaginary longitude lines.
  // Every ring has the SAME number of cards, stacked in aligned columns like
  // the segments of an orange. Convergence at the poles comes from geometry:
  // each card's pole-facing edge is narrower than its equator-facing edge by
  // exactly cos(latNarrow)/cos(latWide) (rendered with a clip-path taper), so
  // the columns pinch continuously along their meridians and close into
  // wedge points AT the poles — the "matter stretching into a black hole"
  // convergence, rather than rings of loose rectangles.
  //
  // Cards per ring chosen so the equator cards are ~9:16 portraits (reels):
  // card height arc = bandDeg, so lonStep ≈ (9/16)·bandDeg at cos(lat)=1.
  const count = Math.round(360 / ((9 / 16) * bandDeg));
  const lonStep = 360 / count;

  const coords: Omit<DomeItem, "src" | "alt">[] = [];
  for (let b = 0; b < latBands; b++) {
    const latLow = -90 + b * bandDeg;
    const latHigh = latLow + bandDeg;
    const lat = (latLow + latHigh) / 2;
    const cosLow = Math.cos(latLow * toRad);
    const cosHigh = Math.cos(latHigh * toRad);
    // The wide edge is whichever edge sits nearer the equator.
    const cosWide = Math.max(cosLow, cosHigh);
    const cosNarrow = Math.min(cosLow, cosHigh);
    const widthFactor = (2 * Math.PI * cosWide) / count;
    const taper = cosNarrow / cosWide;
    const narrowEdge: "top" | "bottom" = lat > 0 ? "top" : "bottom";
    for (let t = 0; t < count; t++) {
      coords.push({ lat, lon: t * lonStep, widthFactor, taper, narrowEdge });
    }
  }

  const totalSlots = coords.length;
  if (pool.length === 0) {
    return coords.map((c) => ({ ...c, src: "", alt: "" }));
  }

  const normalizedImages = pool.map((image) =>
    typeof image === "string" ? { src: image, alt: "" } : { src: image.src || "", alt: image.alt || "" }
  );

  const usedImages = Array.from({ length: totalSlots }, (_, i) => normalizedImages[i % normalizedImages.length]);

  for (let i = 1; i < usedImages.length; i++) {
    if (usedImages[i].src === usedImages[i - 1].src) {
      for (let j = i + 1; j < usedImages.length; j++) {
        if (usedImages[j].src !== usedImages[i].src) {
          const tmp = usedImages[i];
          usedImages[i] = usedImages[j];
          usedImages[j] = tmp;
          break;
        }
      }
    }
  }

  return coords.map((c, i) => ({ ...c, src: usedImages[i].src, alt: usedImages[i].alt }));
}

/** Latitude bands the globe is divided into. 8 keeps each card's arc small
 *  enough to fake curvature while keeping the DOM around ~140 tiles. */
const LAT_BANDS = 8;

const DomeGallery: React.FC<DomeGalleryProps> = ({
  images = [],
  fit = 0.5,
  fitBasis = "auto",
  minRadius = 400,
  maxRadius = Infinity,
  padFactor = 0.25,
  overlayBlurColor = "#ffffff",
  maxVerticalRotationDeg = DEFAULTS.maxVerticalRotationDeg,
  dragSensitivity = DEFAULTS.dragSensitivity,
  enlargeTransitionMs = DEFAULTS.enlargeTransitionMs,
  dragDampening = 2,
  imageBorderRadius = "12px",
  openedImageBorderRadius = "16px",
  grayscale = false,
  autoRotate = true,
  autoRotateSpeed = 8,
}) => {
  const rootRef = useRef<HTMLDivElement>(null);
  const mainRef = useRef<HTMLDivElement>(null);
  const sphereRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<HTMLDivElement>(null);
  const scrimRef = useRef<HTMLDivElement>(null);
  const focusedElRef = useRef<HTMLDivElement | null>(null);
  const originalTilePositionRef = useRef<{ left: number; top: number; width: number; height: number } | null>(null);

  const rotationRef = useRef({ x: 0, y: 0 });
  const startRotRef = useRef({ x: 0, y: 0 });
  const startPosRef = useRef<{ x: number; y: number } | null>(null);
  const draggingRef = useRef(false);
  const movedRef = useRef(false);
  const inertiaRAF = useRef<number | null>(null);
  const openingRef = useRef(false);
  const openStartedAtRef = useRef(0);
  const lastDragEndAt = useRef(0);
  // Direction the idle rotation drifts in. Starts positive, then adopts
  // whichever way the user last spun the dome, so after a flick the gallery
  // keeps travelling the way they pushed it rather than snapping back to a
  // fixed house direction.
  const autoRotateDirRef = useRef(1);

  const scrollLockedRef = useRef(false);
  const lockScroll = useCallback(() => {
    if (scrollLockedRef.current) return;
    scrollLockedRef.current = true;
    document.body.classList.add("dg-scroll-lock");
  }, []);
  const unlockScroll = useCallback(() => {
    if (!scrollLockedRef.current) return;
    if (rootRef.current?.getAttribute("data-enlarging") === "true") return;
    scrollLockedRef.current = false;
    document.body.classList.remove("dg-scroll-lock");
  }, []);

  const items = useMemo(() => buildItems(images, LAT_BANDS), [images]);

  const applyTransform = (xDeg: number, yDeg: number) => {
    const el = sphereRef.current;
    if (el) {
      el.style.transform = `translateZ(calc(var(--radius) * -1)) rotateX(${xDeg}deg) rotateY(${yDeg}deg)`;
    }
  };

  const lockedRadiusRef = useRef<number | null>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const ro = new ResizeObserver((entries) => {
      const cr = entries[0].contentRect;
      const w = Math.max(1, cr.width);
      const h = Math.max(1, cr.height);
      const minDim = Math.min(w, h);
      const maxDim = Math.max(w, h);
      const aspect = w / h;
      let basis: number;
      switch (fitBasis) {
        case "min":
          basis = minDim;
          break;
        case "max":
          basis = maxDim;
          break;
        case "width":
          basis = w;
          break;
        case "height":
          basis = h;
          break;
        default:
          basis = aspect >= 1.3 ? w : minDim;
      }
      let radius = basis * fit;
      const heightGuard = h * 1.35;
      radius = Math.min(radius, heightGuard);
      radius = clamp(radius, minRadius, maxRadius);
      // Containment guard — deliberately applied AFTER the minRadius clamp.
      // minRadius is a floor, so on a narrow container it OVERRODE the fit
      // calculation and inflated the sphere past the container, clipping it on
      // both sides at mobile widths. Capping here means a floor tuned for a
      // wide desktop column can never overflow a narrow one. Half the width is
      // the right cap because the sphere projects to roughly 1.5x its radius,
      // which leaves a real margin rather than letting it touch the edges.
      radius = Math.min(radius, w * 0.5);
      lockedRadiusRef.current = Math.round(radius);

      const viewerPad = Math.max(8, Math.round(minDim * padFactor));
      root.style.setProperty("--radius", `${lockedRadiusRef.current}px`);
      root.style.setProperty("--viewer-pad", `${viewerPad}px`);
      root.style.setProperty("--overlay-blur-color", overlayBlurColor);
      root.style.setProperty("--tile-radius", imageBorderRadius);
      root.style.setProperty("--enlarge-radius", openedImageBorderRadius);
      root.style.setProperty("--image-filter", grayscale ? "grayscale(1)" : "none");
      applyTransform(rotationRef.current.x, rotationRef.current.y);

      const enlargedOverlay = viewerRef.current?.querySelector<HTMLDivElement>('[data-role="enlarge"]');
      if (enlargedOverlay && frameRef.current && mainRef.current) {
        const frameR = frameRef.current.getBoundingClientRect();
        const mainR = mainRef.current.getBoundingClientRect();
        enlargedOverlay.style.left = `${frameR.left - mainR.left}px`;
        enlargedOverlay.style.top = `${frameR.top - mainR.top}px`;
        enlargedOverlay.style.width = `${frameR.width}px`;
        enlargedOverlay.style.height = `${frameR.height}px`;
      }
    });
    ro.observe(root);
    return () => ro.disconnect();
  }, [fit, fitBasis, minRadius, maxRadius, padFactor, overlayBlurColor, grayscale, imageBorderRadius, openedImageBorderRadius]);

  useEffect(() => {
    applyTransform(rotationRef.current.x, rotationRef.current.y);
  }, []);

  useEffect(() => {
    if (!autoRotate) return;
    let raf: number;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      if (!draggingRef.current && !inertiaRAF.current && !focusedElRef.current) {
        const nextY = wrapAngleSigned(rotationRef.current.y + autoRotateSpeed * dt * autoRotateDirRef.current);
        rotationRef.current = { x: rotationRef.current.x, y: nextY };
        applyTransform(rotationRef.current.x, nextY);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [autoRotate, autoRotateSpeed]);

  const stopInertia = useCallback(() => {
    if (inertiaRAF.current) {
      cancelAnimationFrame(inertiaRAF.current);
      inertiaRAF.current = null;
    }
  }, []);

  const startInertia = useCallback(
    (vx: number, vy: number) => {
      const MAX_V = 1.4;
      let vX = clamp(vx, -MAX_V, MAX_V) * 80;
      let vY = clamp(vy, -MAX_V, MAX_V) * 80;
      let frames = 0;
      const d = clamp(dragDampening ?? 0.6, 0, 1);
      const frictionMul = 0.94 + 0.055 * d;
      const stopThreshold = 0.015 - 0.01 * d;
      const maxFrames = Math.round(90 + 270 * d);
      const step = () => {
        vX *= frictionMul;
        vY *= frictionMul;
        if (Math.abs(vX) < stopThreshold && Math.abs(vY) < stopThreshold) {
          inertiaRAF.current = null;
          return;
        }
        if (++frames > maxFrames) {
          inertiaRAF.current = null;
          return;
        }
        const rawX = rotationRef.current.x - vY / 200;
        // ≥180 means trackball mode: wrap through the poles instead of
        // stopping at a tilt limit (same rule as the drag handler).
        const nextX = maxVerticalRotationDeg >= 180 ? wrapAngleSigned(rawX) : clamp(rawX, -maxVerticalRotationDeg, maxVerticalRotationDeg);
        const nextY = wrapAngleSigned(rotationRef.current.y + vX / 200);
        rotationRef.current = { x: nextX, y: nextY };
        applyTransform(nextX, nextY);
        inertiaRAF.current = requestAnimationFrame(step);
      };
      stopInertia();
      inertiaRAF.current = requestAnimationFrame(step);
    },
    [dragDampening, maxVerticalRotationDeg, stopInertia]
  );

  useGesture(
    {
      onDragStart: ({ event }) => {
        if (focusedElRef.current) return;
        stopInertia();
        const evt = event as PointerEvent;
        draggingRef.current = true;
        movedRef.current = false;
        startRotRef.current = { ...rotationRef.current };
        startPosRef.current = { x: evt.clientX, y: evt.clientY };
      },
      onDrag: ({ event, last, velocity = [0, 0], direction = [0, 0], movement }) => {
        if (focusedElRef.current || !draggingRef.current || !startPosRef.current) return;
        const evt = event as PointerEvent;
        const dxTotal = evt.clientX - startPosRef.current.x;
        const dyTotal = evt.clientY - startPosRef.current.y;
        if (!movedRef.current) {
          const dist2 = dxTotal * dxTotal + dyTotal * dyTotal;
          if (dist2 > 16) movedRef.current = true;
        }
        const rawX = startRotRef.current.x - dyTotal / dragSensitivity;
        const nextX = maxVerticalRotationDeg >= 180 ? wrapAngleSigned(rawX) : clamp(rawX, -maxVerticalRotationDeg, maxVerticalRotationDeg);
        const nextY = wrapAngleSigned(startRotRef.current.y + dxTotal / dragSensitivity);
        if (rotationRef.current.x !== nextX || rotationRef.current.y !== nextY) {
          rotationRef.current = { x: nextX, y: nextY };
          applyTransform(nextX, nextY);
        }
        if (last) {
          draggingRef.current = false;
          // Adopt the user's spin direction for the idle rotation. Falls back
          // to the total drag distance when the release velocity is ~0 (a slow
          // drag), so a deliberate slow push still sets the direction.
          const spin = Math.sign(dxTotal);
          if (spin !== 0) autoRotateDirRef.current = spin;
          const [vMagX, vMagY] = velocity;
          const [dirX, dirY] = direction;
          let vx = vMagX * dirX;
          let vy = vMagY * dirY;
          if (Math.abs(vx) < 0.001 && Math.abs(vy) < 0.001 && Array.isArray(movement)) {
            const [mx, my] = movement;
            vx = clamp((mx / dragSensitivity) * 0.02, -1.2, 1.2);
            vy = clamp((my / dragSensitivity) * 0.02, -1.2, 1.2);
          }
          if (Math.abs(vx) > 0.005 || Math.abs(vy) > 0.005) startInertia(vx, vy);
          if (movedRef.current) lastDragEndAt.current = performance.now();
          movedRef.current = false;
        }
      },
    },
    { target: mainRef, eventOptions: { passive: true } }
  );

  useEffect(() => {
    const scrim = scrimRef.current;
    if (!scrim) return;
    const close = () => {
      if (performance.now() - openStartedAtRef.current < 250) return;
      const el = focusedElRef.current;
      if (!el) return;
      const parent = el.parentElement as HTMLElement | null;
      const overlay = viewerRef.current?.querySelector<HTMLDivElement>('[data-role="enlarge"]');
      if (!overlay || !parent) return;
      const refDiv = parent.querySelector<HTMLDivElement>('[data-role="reference"]');
      const originalPos = originalTilePositionRef.current;

      overlay.remove();
      if (refDiv) refDiv.remove();
      parent.style.setProperty("--rot-y-delta", "0deg");
      parent.style.setProperty("--rot-x-delta", "0deg");
      el.style.visibility = "";
      el.style.zIndex = "0";
      focusedElRef.current = null;
      rootRef.current?.removeAttribute("data-enlarging");
      openingRef.current = false;
      unlockScroll();
      void originalPos;
    };
    scrim.addEventListener("click", close);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      scrim.removeEventListener("click", close);
      window.removeEventListener("keydown", onKey);
    };
  }, [enlargeTransitionMs, unlockScroll]);

  const openItemFromElement = useCallback(
    (el: HTMLDivElement) => {
      if (openingRef.current) return;
      openingRef.current = true;
      openStartedAtRef.current = performance.now();
      lockScroll();
      const parent = el.parentElement as HTMLElement;
      focusedElRef.current = el;
      el.setAttribute("data-focused", "true");
      // The tile's own placement is rotateY(lon) rotateX(-lat), so the deltas
      // that swing it flat to face the camera are the negation of those, minus
      // however far the globe itself is currently turned.
      const lat = getDataNumber(parent, "lat", 0);
      const lon = getDataNumber(parent, "lon", 0);
      const parentY = normalizeAngle(lon);
      const globalY = normalizeAngle(rotationRef.current.y);
      let rotY = -(parentY + globalY) % 360;
      if (rotY < -180) rotY += 360;
      const rotX = lat - rotationRef.current.x;
      parent.style.setProperty("--rot-y-delta", `${rotY}deg`);
      parent.style.setProperty("--rot-x-delta", `${rotX}deg`);

      const refDiv = document.createElement("div");
      refDiv.setAttribute("data-role", "reference");
      refDiv.style.cssText = `position:absolute;inset:5%;opacity:0;transform:rotateX(${lat}deg) rotateY(${-lon}deg);`;
      parent.appendChild(refDiv);

      void refDiv.offsetHeight;

      const tileR = refDiv.getBoundingClientRect();
      const mainR = mainRef.current?.getBoundingClientRect();
      const frameR = frameRef.current?.getBoundingClientRect();

      if (!mainR || !frameR || tileR.width <= 0 || tileR.height <= 0) {
        openingRef.current = false;
        focusedElRef.current = null;
        parent.removeChild(refDiv);
        unlockScroll();
        return;
      }

      originalTilePositionRef.current = { left: tileR.left, top: tileR.top, width: tileR.width, height: tileR.height };
      el.style.visibility = "hidden";
      el.style.zIndex = "0";

      const overlay = document.createElement("div");
      overlay.setAttribute("data-role", "enlarge");
      overlay.style.cssText = `position:absolute;left:${frameR.left - mainR.left}px;top:${frameR.top - mainR.top}px;width:${frameR.width}px;height:${frameR.height}px;opacity:0;z-index:30;will-change:transform,opacity;transform-origin:top left;transition:transform ${enlargeTransitionMs}ms ease, opacity ${enlargeTransitionMs}ms ease;border-radius:var(--enlarge-radius,16px);overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,.35);`;
      const rawSrc = parent.dataset.src || el.querySelector("img")?.getAttribute("src") || "";
      const img = document.createElement("img");
      img.src = rawSrc;
      img.style.cssText = `width:100%;height:100%;object-fit:cover;filter:var(--image-filter,none);`;
      overlay.appendChild(img);
      viewerRef.current?.appendChild(overlay);

      const tx0 = tileR.left - frameR.left;
      const ty0 = tileR.top - frameR.top;
      const sx0 = tileR.width / frameR.width;
      const sy0 = tileR.height / frameR.height;
      const validSx0 = isFinite(sx0) && sx0 > 0 ? sx0 : 1;
      const validSy0 = isFinite(sy0) && sy0 > 0 ? sy0 : 1;
      overlay.style.transform = `translate(${tx0}px, ${ty0}px) scale(${validSx0}, ${validSy0})`;

      setTimeout(() => {
        if (!overlay.parentElement) return;
        overlay.style.opacity = "1";
        overlay.style.transform = "translate(0px, 0px) scale(1, 1)";
        rootRef.current?.setAttribute("data-enlarging", "true");
      }, 16);
    },
    [enlargeTransitionMs, lockScroll, unlockScroll]
  );

  const onTileClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (draggingRef.current) return;
      if (movedRef.current) return;
      if (performance.now() - lastDragEndAt.current < 80) return;
      if (openingRef.current) return;
      openItemFromElement(e.currentTarget);
    },
    [openItemFromElement]
  );

  const onTilePointerUp = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (e.pointerType !== "touch") return;
      if (draggingRef.current) return;
      if (movedRef.current) return;
      if (performance.now() - lastDragEndAt.current < 80) return;
      if (openingRef.current) return;
      openItemFromElement(e.currentTarget);
    },
    [openItemFromElement]
  );

  useEffect(() => {
    return () => {
      document.body.classList.remove("dg-scroll-lock");
    };
  }, []);

  return (
    <div
      ref={rootRef}
      // Every card shares one height: the pole-to-pole arc (πR) divided by the
      // latitude bands. Card widths are set per-ring in the tile styles.
      className="group absolute inset-0 [--radius:520px] [--viewer-pad:72px] [--item-height:calc((var(--radius)*3.1416)/var(--lat-bands))]"
      style={
        {
          "--lat-bands": LAT_BANDS,
          "--overlay-blur-color": overlayBlurColor,
          "--tile-radius": imageBorderRadius,
          "--enlarge-radius": openedImageBorderRadius,
          "--image-filter": grayscale ? "grayscale(1)" : "none",
        } as React.CSSProperties
      }
    >
      <main
        ref={mainRef}
        className="absolute inset-0 grid place-items-center overflow-hidden [touch-action:none] select-none bg-transparent"
      >
        <div className="w-full h-full grid place-items-center [perspective:calc(var(--radius)*2)] [perspective-origin:50%_50%] [contain:layout_paint_size]">
          <div
            ref={sphereRef}
            className="[transform:translateZ(calc(var(--radius)*-1))] [will-change:transform] [transform-style:preserve-3d]"
          >
            {items.map((it, i) => (
              <div
                key={`${it.lat},${it.lon},${i}`}
                className="absolute [top:-999px] [bottom:-999px] [left:-999px] [right:-999px] m-auto [transform-origin:50%_50%] [backface-visibility:hidden] transition-transform duration-300 [transform-style:preserve-3d]"
                data-src={it.src}
                data-lat={it.lat}
                data-lon={it.lon}
                style={
                  {
                    // Placed on the sphere by spherical coordinates. Width is
                    // the wide (equator-facing) edge's share of its ring, so
                    // meridian columns stay aligned from equator to pole.
                    width: `calc(var(--radius) * ${it.widthFactor})`,
                    height: "var(--item-height)",
                    transform: `rotateY(calc(${it.lon}deg + var(--rot-y-delta, 0deg))) rotateX(calc(${-it.lat}deg + var(--rot-x-delta, 0deg))) translateZ(var(--radius))`,
                  } as React.CSSProperties
                }
              >
                <div
                  // Percentage gutter, not a fixed 10px: pole-adjacent cards
                  // are narrow, and a fixed inset would collapse them.
                  // The clip-path tapers the pole-facing edge to `taper` of
                  // the card's width — cards become trapezoids that pinch
                  // along their meridians and close into wedge points at the
                  // poles. Skipped near the equator (taper ≈ 1) so those
                  // cards keep their rounded corners; clip-path would
                  // otherwise square them off for no visible gain.
                  className="absolute block inset-[5%] overflow-hidden [backface-visibility:hidden] [transform-style:preserve-3d] transition-transform duration-300 cursor-pointer [-webkit-tap-highlight-color:transparent] [touch-action:manipulation] pointer-events-auto [transform:translateZ(0)] focus:outline-none [border-radius:var(--tile-radius,12px)]"
                  style={
                    it.taper < 0.9
                      ? {
                          clipPath:
                            it.narrowEdge === "top"
                              ? `polygon(${(50 * (1 - it.taper)).toFixed(2)}% 0, ${(100 - 50 * (1 - it.taper)).toFixed(2)}% 0, 100% 100%, 0 100%)`
                              : `polygon(0 0, 100% 0, ${(100 - 50 * (1 - it.taper)).toFixed(2)}% 100%, ${(50 * (1 - it.taper)).toFixed(2)}% 100%)`,
                        }
                      : undefined
                  }
                  role="button"
                  tabIndex={0}
                  aria-label={it.alt || "Open image"}
                  onClick={onTileClick}
                  onPointerUp={onTilePointerUp}
                >
                  <img
                    src={it.src}
                    draggable={false}
                    alt={it.alt}
                    className="w-full h-full object-cover pointer-events-none [backface-visibility:hidden] [filter:var(--image-filter,none)]"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* A single ELLIPTICAL vignette, concentric with the globe, replaces the
            old treatment (a radial wash plus two 120px linear bands pinned to
            the top and bottom edges). Those bands ran straight across the
            frame, cutting the sphere with two horizontal hard edges that read
            as strips laid over the scene. A globe should recede radially, so
            the falloff follows its silhouette instead: the centre stays fully
            crisp and the fade only begins out where the sphere curves away.
            Multi-stop with eased midpoints so there is no visible banding. */}
        <div
          className="absolute inset-0 z-[3] pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 62% 62% at 50% 50%, transparent 0%, transparent 58%, color-mix(in srgb, var(--overlay-blur-color, #ffffff) 55%, transparent) 78%, var(--overlay-blur-color, #ffffff) 100%)",
          }}
        />
        {/* Matching depth-of-field: blur strengthens with the same falloff, so
            tiles soften as they curve away rather than at an arbitrary line. */}
        <div
          className="absolute inset-0 z-[4] pointer-events-none backdrop-blur-[2px]"
          style={{
            maskImage: "radial-gradient(ellipse 62% 62% at 50% 50%, transparent 62%, #000 92%)",
            WebkitMaskImage: "radial-gradient(ellipse 62% 62% at 50% 50%, transparent 62%, #000 92%)",
          }}
        />

        <div ref={viewerRef} className="absolute inset-0 z-20 pointer-events-none flex items-center justify-center [padding:var(--viewer-pad)]">
          <div
            ref={scrimRef}
            className="absolute inset-0 z-10 bg-black/40 pointer-events-none opacity-0 transition-opacity duration-500 [backdrop-filter:blur(3px)] group-data-[enlarging=true]:opacity-100 group-data-[enlarging=true]:pointer-events-auto"
          />
          <div ref={frameRef} className="h-full aspect-square flex [border-radius:var(--enlarge-radius,16px)]" />
        </div>
      </main>
    </div>
  );
};

export default DomeGallery;
