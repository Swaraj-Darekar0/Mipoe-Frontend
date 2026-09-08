import React, { useEffect, useId, useMemo, useRef, useState } from "react";
import gsap from "gsap";
import {
  type BrandScene,
  DESKTOP_BRAND_SCENE,
  COMPACT_BRAND_SCENE,
  smoothPath,
} from "./brandRibbonGeometry";
import {
  buildCurvedCapsuleD,
  buildCapsuleCenterline,
  type PathSamples,
} from "./brandCapsulePath";
import {
  type BrandMode,
  TRADITIONAL_CAPSULES,
  SELLR_CAPSULES,
  TRADITIONAL_PAYOUTS,
  SELLR_PAYOUTS,
} from "./brandHeroData";

const INK = "#100d0c";
const CREAM = "#fdfbea";
const WIDE_SCENE_MIN = 1024;

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const useWideScene = () => {
  const query = `(min-width: ${WIDE_SCENE_MIN}px)`;
  const [wide, setWide] = useState(
    () => typeof window === "undefined" || window.matchMedia(query).matches
  );
  useEffect(() => {
    const mql = window.matchMedia(query);
    const sync = () => setWide(mql.matches);
    sync();
    mql.addEventListener("change", sync);
    return () => mql.removeEventListener("change", sync);
  }, [query]);
  return wide;
};

interface StripInfo {
  total: number;
  split: number;
  count: number;
  step: number;
  payoutTotal: number;
  payoutUnitWidth: number;
}

export interface BrandRibbonProps {
  mode: BrandMode;
  onToggleMode: () => void;
  hasInteractedPill: boolean;
  onPillInteraction: () => void;
}

export const BrandRibbon: React.FC<BrandRibbonProps> = ({
  mode,
  onToggleMode,
  hasInteractedPill,
  onPillInteraction,
}) => {
  const isWide = useWideScene();
  const scene: BrandScene = isWide ? DESKTOP_BRAND_SCENE : COMPACT_BRAND_SCENE;
  const uid = useId().replace(/:/g, "");

  // Main continuous black ribbon path
  const d = useMemo(() => smoothPath(scene.anchors), [scene]);
  // Payout output path running from off-canvas left up to the pill
  const payoutD = useMemo(() => smoothPath(scene.payoutAnchors), [scene]);

  const geomRef = useRef<SVGPathElement>(null);
  const payoutGeomRef = useRef<SVGPathElement>(null);
  const payoutMeasureRef = useRef<SVGTextElement>(null);

  // SVG Layers for painter-order self-crossing
  const underCapsulesRef = useRef<SVGGElement>(null);
  const overBandRef = useRef<SVGPathElement>(null);
  const overCapsulesRef = useRef<SVGGElement>(null);
  const pillRef = useRef<SVGGElement>(null);
  const hintBounceRef = useRef<SVGGElement>(null);

  // Payout text paths for seamless stream
  const payoutTradPathRef = useRef<SVGTextPathElement>(null);
  const payoutSellrPathRef = useRef<SVGTextPathElement>(null);

  const [strip, setStrip] = useState<StripInfo | null>(null);
  const modeRef = useRef(mode);
  modeRef.current = mode;

  // Mascot character image refs and initial mount flag
  const tradMascotRef = useRef<SVGImageElement>(null);
  const sellrMascotRef = useRef<SVGImageElement>(null);
  const isInitialMascotMount = useRef(true);

  // Animated transition between traditional (stressed) and sellr (relaxed) mascots
  useEffect(() => {
    if (!tradMascotRef.current || !sellrMascotRef.current) return;
    if (isInitialMascotMount.current) {
      isInitialMascotMount.current = false;
      if (mode === "traditional") {
        gsap.set(tradMascotRef.current, { opacity: 1, y: 0, scale: 1 });
        gsap.set(sellrMascotRef.current, { opacity: 0, y: 10, scale: 0.96 });
      } else {
        gsap.set(tradMascotRef.current, { opacity: 0, y: -10, scale: 0.96 });
        gsap.set(sellrMascotRef.current, { opacity: 1, y: 0, scale: 1 });
      }
      return;
    }

    if (prefersReducedMotion()) {
      gsap.set(tradMascotRef.current, { opacity: mode === "traditional" ? 1 : 0 });
      gsap.set(sellrMascotRef.current, { opacity: mode === "sellr" ? 1 : 0 });
      return;
    }

    if (mode === "sellr") {
      gsap.to(tradMascotRef.current, {
        opacity: 0,
        y: -12,
        scale: 0.95,
        duration: 0.22,
        ease: "power2.out",
      });
      gsap.fromTo(
        sellrMascotRef.current,
        { opacity: 0, y: 14, scale: 0.94 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.38,
          delay: 0.06,
          ease: "back.out(1.5)",
        }
      );
    } else {
      gsap.to(sellrMascotRef.current, {
        opacity: 0,
        y: 12,
        scale: 0.95,
        duration: 0.22,
        ease: "power2.out",
      });
      gsap.fromTo(
        tradMascotRef.current,
        { opacity: 0, y: -10, scale: 0.95 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.35,
          delay: 0.06,
          ease: "power2.out",
        }
      );
    }
  }, [mode]);

  // Reset between breakpoints
  useEffect(() => setStrip(null), [scene]);

  // Floating bounce animation for the "try me" first-arrival hint
  useEffect(() => {
    if (hasInteractedPill || !hintBounceRef.current || prefersReducedMotion()) return;
    const tween = gsap.to(hintBounceRef.current, {
      y: -9,
      repeat: -1,
      yoyo: true,
      duration: 0.7,
      ease: "power1.inOut",
    });
    return () => {
      tween.kill();
    };
  }, [hasInteractedPill]);

  // Measure path, split, and payout text metrics
  useEffect(() => {
    const path = geomRef.current;
    const payoutPath = payoutGeomRef.current;
    if (!path || !payoutPath) return;

    const total = path.getTotalLength();
    if (!total) return;

    // The checkpoint split is at the center of the sellr. pill
    let split = total * 0.65;
    for (let at = total * 0.35; at <= total; at += 2) {
      if (path.getPointAtLength(at).x <= scene.pill.cx) {
        split = at;
        break;
      }
    }

    const avgPitch = scene.capsule.w + scene.capsule.gap;
    const count = Math.max(8, Math.ceil((split + avgPitch * 2) / avgPitch));
    const step = avgPitch;

    const payoutTotal = payoutPath.getTotalLength() || 1800;
    const measuredUnit = payoutMeasureRef.current?.getComputedTextLength() || 1100;
    const payoutUnitWidth = Math.max(300, measuredUnit);

    setStrip({
      total,
      split,
      count,
      step,
      payoutTotal,
      payoutUnitWidth,
    });
  }, [scene, d, payoutD, isWide]);

  // Pre-sample geometry and drive GSAP animation ticker
  useEffect(() => {
    const path = geomRef.current;
    const underGroup = underCapsulesRef.current;
    const overGroup = overCapsulesRef.current;
    const overBand = overBandRef.current;
    if (!path || !underGroup || !overGroup || !overBand || !strip) return;

    const RES = 2;
    const samplesCount = Math.ceil(strip.total / RES) + 1;
    const xs = new Float32Array(samplesCount);
    const ys = new Float32Array(samplesCount);
    const angles = new Float32Array(samplesCount);

    for (let i = 0; i < samplesCount; i++) {
      const at = Math.min(i * RES, strip.total);
      const pt = path.getPointAtLength(at);
      const before = path.getPointAtLength(Math.max(0, at - 3));
      const after = path.getPointAtLength(Math.min(strip.total, at + 3));
      xs[i] = pt.x;
      ys[i] = pt.y;
      angles[i] = (Math.atan2(after.y - before.y, after.x - before.x) * 180) / Math.PI;
    }

    const pathSamples: PathSamples = {
      xs,
      ys,
      angles,
      res: RES,
      totalLength: strip.total,
    };

    // The crown of the loop is the minimum y in the loop segment
    const splitIndex = Math.round(strip.split / RES);
    let crown = 0;
    for (let i = 1; i < splitIndex; i++) {
      if (ys[i] < ys[crown]) crown = i;
    }
    const crownAt = crown * RES;

    // Over band stroke covers crossing
    const bandFrom = crownAt + scene.capsule.w / 2 + 2;
    overBand.setAttribute(
      "stroke-dasharray",
      `0 ${bandFrom.toFixed(1)} ${(strip.split - bandFrom).toFixed(1)} ${strip.total.toFixed(1)}`
    );

    const capsules = [
      ...(Array.from(underGroup.children) as SVGGElement[]),
      ...(Array.from(overGroup.children) as SVGGElement[]),
    ];
    const inOver = capsules.map((c) => c.parentNode === overGroup);

    const place = (shift: number) => {
      // 1. Inbound cylindrical capsules with common gap G and centered separators
      const isSellrNow = modeRef.current === "sellr";
      const G = scene.capsule.gap;
      const N = capsules.length;

      const widths = new Float32Array(N);
      for (let i = 0; i < N; i++) {
        const tradItem = TRADITIONAL_CAPSULES[i % TRADITIONAL_CAPSULES.length];
        const sellrItem = SELLR_CAPSULES[i % SELLR_CAPSULES.length];
        widths[i] = isSellrNow
          ? (isWide ? sellrItem.w : sellrItem.compactW)
          : (isWide ? tradItem.w : tradItem.compactW);
      }

      const centers = new Float32Array(N);
      let cum = 0;
      for (let i = 0; i < N; i++) {
        centers[i] = cum + widths[i] / 2;
        cum += widths[i] + G;
      }
      const P = cum;

      for (let i = 0; i < N; i++) {
        const targetW = widths[i];
        const at = (centers[i] + shift) % P;
        const over = at >= crownAt;

        if (over !== inOver[i]) {
          (over ? overGroup : underGroup).appendChild(capsules[i]);
          inOver[i] = over;
        }

        // True cylindrical capsule outline that bends with the ribbon curve
        const curvedD = buildCurvedCapsuleD(
          pathSamples,
          at,
          targetW,
          scene.capsule.h
        );
        const pathEl = capsules[i].querySelector("path.capsule-outline");
        if (pathEl) {
          pathEl.setAttribute("d", curvedD);
        }

        // Option 1 continuous centerline guide path for textPath (bends with curve, no snaps)
        const guide = buildCapsuleCenterline(
          pathSamples,
          at,
          targetW,
          scene.capsule.h
        );
        const guideEl = document.getElementById(`capsule-guide-${uid}-${i}`);
        if (guideEl) {
          guideEl.setAttribute("d", guide.d);
        }

        // Position thumbnail on leading nose of capsule in sellr mode
        const thumbAnchor = capsules[i].querySelector("g.capsule-thumb-anchor");
        if (thumbAnchor) {
          thumbAnchor.setAttribute(
            "transform",
            `translate(${guide.thumbX.toFixed(1)} ${guide.thumbY.toFixed(1)}) rotate(${guide.thumbAngle.toFixed(1)})`
          );
        }

        // Position separator star midway in the common gap between capsule i and capsule i+1
        const sepAnchor = capsules[i].querySelector("g.capsule-sep-anchor") as SVGGElement | null;
        if (sepAnchor) {
          const sepAt = (centers[i] + targetW / 2 + G / 2 + shift) % P;
          if (sepAt >= strip.split || sepAt < 0) {
            sepAnchor.style.opacity = "0";
          } else {
            const kSep = Math.min(
              pathSamples.xs.length - 1,
              Math.max(0, Math.round(sepAt / pathSamples.res))
            );
            const sepX = pathSamples.xs[kSep];
            const sepY = pathSamples.ys[kSep];
            const sepAngle = pathSamples.angles[kSep];
            sepAnchor.setAttribute(
              "transform",
              `translate(${sepX.toFixed(1)} ${sepY.toFixed(1)}) rotate(${sepAngle.toFixed(1)})`
            );
            const distToPill = strip.split - sepAt;
            if (distToPill < 45) {
              sepAnchor.style.opacity = Math.max(0, distToPill / 35).toFixed(2);
            } else {
              sepAnchor.style.opacity = "1";
            }
          }
        }

        // Smooth opacity fade out as capsule enters pill to prevent pop/boundary artifacts
        if (at >= strip.split) {
          capsules[i].style.opacity = "0";
        } else {
          const distToPill = strip.split - at;
          if (distToPill < 60) {
            const op = Math.max(0, distToPill / 45);
            capsules[i].style.opacity = op.toFixed(2);
          } else {
            capsules[i].style.opacity = "1";
          }
        }
      }

      // 2. Outbound money stream (continuous marquee on payout path sliding leftwards)
      const payoutOffset = -(shift % strip.payoutUnitWidth);
      if (payoutTradPathRef.current) {
        payoutTradPathRef.current.setAttribute("startOffset", `${payoutOffset.toFixed(1)}px`);
      }
      if (payoutSellrPathRef.current) {
        payoutSellrPathRef.current.setAttribute("startOffset", `${payoutOffset.toFixed(1)}px`);
      }
    };

    place(0);

    if (prefersReducedMotion()) return;

    let shift = 0;
    const tickerCallback = (_time: number, deltaTime: number) => {
      shift += scene.speed * (deltaTime / 1000);
      place(shift);
    };

    gsap.ticker.add(tickerCallback);
    return () => {
      gsap.ticker.remove(tickerCallback);
      capsules.forEach((c) => {
        if (c.parentNode === overGroup) {
          underGroup.appendChild(c);
        }
      });
    };
  }, [scene, strip]);

  // Pill flip animation handler
  const handlePillClick = () => {
    if (!hasInteractedPill) {
      onPillInteraction();
    }
    const el = pillRef.current;
    if (!el) {
      onToggleMode();
      return;
    }

    gsap.timeline({ defaults: { ease: "power2.inOut" } })
      .to(el, {
        scaleX: 0.05,
        duration: 0.16,
        transformOrigin: "center center",
      })
      .call(() => {
        onToggleMode();
      })
      .to(el, {
        scaleX: 1,
        duration: 0.22,
        ease: "back.out(1.8)",
        transformOrigin: "center center",
      });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handlePillClick();
    }
  };

  // Thumbnail dimensions inside capsule for sellr mode
  const thumbSize = isWide ? 22 : 18;
  const thumbRadius = 4;

  // Mascot character layout metrics (aspect ratios: trad 786/699, sellr 878/826)
  const { character } = scene;
  const tradW = character.width;
  const tradH = Math.round(tradW * (699 / 786));
  const tradX = character.cx - tradW / 2;
  const tradY = character.bottom - tradH;

  const sellrW = Math.round(character.width * 1.10);
  const sellrH = Math.round(sellrW * (782 / 938));
  const sellrX = character.cx - sellrW / 2;
  const sellrY = character.bottom - sellrH;

  // Repetition count for payout stream to guarantee infinite seamless marquee
  const payoutReps = strip
    ? Math.max(2, Math.ceil((strip.payoutTotal + strip.payoutUnitWidth * 2) / strip.payoutUnitWidth) + 1)
    : 3;

  return (
    <div className="relative w-full h-full select-none" style={{ isolation: "isolate" }}>
      <svg
        viewBox={`0 0 ${scene.vbW} ${scene.vbH}`}
        data-mode={mode}
        className="brand-ribbon-svg w-full h-full overflow-visible"
        preserveAspectRatio="xMidYMax meet"
      >
        <defs>
          <style>{`
            .brand-ribbon-svg[data-mode="traditional"] .capsule-outline { stroke: #e4e4e7; }
            .brand-ribbon-svg[data-mode="traditional"] .capsule-trad-view { display: inline; }
            .brand-ribbon-svg[data-mode="traditional"] .capsule-sellr-view { display: none; }
            .brand-ribbon-svg[data-mode="traditional"] .payout-trad-view { display: inline; }
            .brand-ribbon-svg[data-mode="traditional"] .payout-sellr-view { display: none; }

            .brand-ribbon-svg[data-mode="sellr"] .capsule-outline { stroke: #ffffff; }
            .brand-ribbon-svg[data-mode="sellr"] .capsule-trad-view { display: none; }
            .brand-ribbon-svg[data-mode="sellr"] .capsule-sellr-view { display: inline; }
            .brand-ribbon-svg[data-mode="sellr"] .payout-trad-view { display: none; }
            .brand-ribbon-svg[data-mode="sellr"] .payout-sellr-view { display: inline; }

            /* Capsule separator star between items */
            .brand-ribbon-svg[data-mode="traditional"] .capsule-separator-star {
              fill: #fdfbea;
              opacity: 0.9;
            }
            .brand-ribbon-svg[data-mode="sellr"] .capsule-separator-star {
              fill: #ffffff;
              opacity: 0.95;
            }

            /* Revolving dynamic movement in outer shadow (tight black & orange aura) */
            @keyframes auraShadowOrbit {
              0% {
                filter: 
                  drop-shadow(0px -2.5px 3.5px rgba(249, 115, 22, 0.9))
                  drop-shadow(3.5px 1.5px 4.5px rgba(16, 13, 12, 0.95))
                  drop-shadow(-3px 1.5px 4px rgba(16, 13, 12, 0.9));
              }
              25% {
                filter: 
                  drop-shadow(2.5px 0px 3.5px rgba(249, 115, 22, 0.9))
                  drop-shadow(-1.5px 2.5px 4.5px rgba(16, 13, 12, 0.95))
                  drop-shadow(-2.5px -1.5px 4px rgba(234, 88, 12, 0.7));
              }
              50% {
                filter: 
                  drop-shadow(0px 2.5px 3.5px rgba(249, 115, 22, 0.9))
                  drop-shadow(-3.5px -1.5px 4.5px rgba(16, 13, 12, 0.95))
                  drop-shadow(2.5px -1.5px 4px rgba(16, 13, 12, 0.9));
              }
              75% {
                filter: 
                  drop-shadow(-2.5px 0px 3.5px rgba(249, 115, 22, 0.9))
                  drop-shadow(1.5px -2.5px 4.5px rgba(16, 13, 12, 0.95))
                  drop-shadow(3px 1.5px 4px rgba(234, 88, 12, 0.7));
              }
              100% {
                filter: 
                  drop-shadow(0px -2.5px 3.5px rgba(249, 115, 22, 0.9))
                  drop-shadow(3.5px 1.5px 4.5px rgba(16, 13, 12, 0.95))
                  drop-shadow(-3px 1.5px 4px rgba(16, 13, 12, 0.9));
              }
            }

            .pill-aura-layer {
              animation: auraShadowOrbit 4.5s ease-in-out infinite;
            }

            @keyframes auraOuterBreathe {
              0%, 100% {
                transform: scale(0.98);
                opacity: 0.85;
              }
              50% {
                transform: scale(1.03);
                opacity: 1;
              }
            }

            @keyframes auraCoreBreathe {
              0%, 100% {
                transform: scale(0.99);
                opacity: 0.9;
              }
              50% {
                transform: scale(1.02);
                opacity: 1;
              }
            }

            @keyframes auraCoronaPulse {
              0%, 100% {
                opacity: 0.85;
              }
              50% {
                opacity: 1;
              }
            }

            .aura-outer-pulse {
              transform-origin: 0px 0px;
              animation: auraOuterBreathe 3.4s ease-in-out infinite;
            }

            .aura-core-pulse {
              transform-origin: 0px 0px;
              animation: auraCoreBreathe 3.4s ease-in-out infinite;
            }

            .aura-corona-pulse {
              transform-origin: 0px 0px;
              animation: auraCoronaPulse 3.4s ease-in-out infinite;
            }
          `}</style>

          {/* Ethereal Tight Glowing Aura Gradients & Filters (Black & Electric Orange) */}
          <radialGradient id={`aura-outer-rad-${uid}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#100d0c" stopOpacity="0.9" />
            <stop offset="42%" stopColor="#f97316" stopOpacity="0.85" />
            <stop offset="70%" stopColor="#100d0c" stopOpacity="0.85" />
            <stop offset="90%" stopColor="#ea580c" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#100d0c" stopOpacity="0" />
          </radialGradient>

          <radialGradient id={`aura-core-rad-${uid}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#fdfbea" stopOpacity="0.95" />
            <stop offset="35%" stopColor="#fb923c" stopOpacity="0.85" />
            <stop offset="68%" stopColor="#100d0c" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#100d0c" stopOpacity="0" />
          </radialGradient>

          <linearGradient id={`aura-corona-grad-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#100d0c" />
            <stop offset="25%" stopColor="#f97316" />
            <stop offset="50%" stopColor="#100d0c" />
            <stop offset="75%" stopColor="#fb923c" />
            <stop offset="100%" stopColor="#100d0c" />
          </linearGradient>

          <filter id={`aura-outer-blur-${uid}`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3.8" />
          </filter>

          <filter id={`aura-core-blur-${uid}`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2.0" />
          </filter>

          <filter id={`aura-corona-blur-${uid}`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="1.0" />
          </filter>

          {/* Mascot bottom gradient blend mask for seamless ribbon integration */}
          <linearGradient id={`mascot-fade-grad-${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
            <stop offset="75%" stopColor="#ffffff" stopOpacity="1" />
            <stop offset="92%" stopColor="#ffffff" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>
          <mask id={`mascot-fade-mask-${uid}`} maskContentUnits="objectBoundingBox">
            <rect x="0" y="0" width="1" height="1" fill={`url(#mascot-fade-grad-${uid})`} />
          </mask>

          {/* Master continuous black ribbon path */}
          <path ref={geomRef} d={d} fill="none" id={`brand-geom-${uid}`} />
          {/* Payout output path (left-to-right geometry for upright textPath flow) */}
          <path ref={payoutGeomRef} d={payoutD} fill="none" id={`payout-geom-${uid}`} />

          {/* Guide paths for curved capsule labels */}
          {strip &&
            Array.from({ length: strip.count }).map((_, i) => (
              <path key={`capsule-guide-${i}`} id={`capsule-guide-${uid}-${i}`} d="" fill="none" />
            ))}

          {/* Pill shadow */}
          <filter id={`pill-shadow-${uid}`} x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="4" stdDeviation="6" floodOpacity="0.18" />
          </filter>

          {/* Inbound capsule clip path: clips anything extending past the pill into the left side */}
          <clipPath id={`capsule-inbound-clip-${uid}`}>
            <rect
              x={scene.pill.cx - scene.pill.w * 0.35}
              y="-2000"
              width="10000"
              height="4000"
            />
          </clipPath>

          {/* Payout stream clip path: money only emerges to the left of the pill */}
          <clipPath id={`payout-clip-${uid}`}>
            <rect
              x="-3000"
              y="-2000"
              width={scene.pill.cx + 3000 - scene.pill.w * 0.35}
              height="4000"
            />
          </clipPath>

          {/* Rounded clip paths for thumbnails */}
          {SELLR_CAPSULES.map((_, i) => (
            <clipPath key={`thumb-clip-${i}`} id={`clip-thumb-${uid}-${i}`}>
              <rect
                x={-thumbSize / 2}
                y={-thumbSize / 2}
                width={thumbSize}
                height={thumbSize}
                rx={thumbRadius}
              />
            </clipPath>
          ))}
        </defs>

        {/* Hidden measurement node for single payout unit */}
        <text
          ref={payoutMeasureRef}
          className="opacity-0 pointer-events-none absolute"
          fontSize={scene.payoutFontSize}
          fontFamily="'Montserrat', 'Inter', sans-serif"
          fontWeight="600"
          letterSpacing="0.02em"
          aria-hidden="true"
        >
          {TRADITIONAL_PAYOUTS.map((p) => `${p.text}\u00A0\u00A0✦\u00A0\u00A0`).join("")}
        </text>

        {/* 0. Brand Mascot Characters (underlay: sits behind ribbon band, naturally blending without cutting edges) */}
        <g className="brand-mascot-layer pointer-events-none" mask={`url(#mascot-fade-mask-${uid})`}>
          {/* Traditional Stressed Mascot (working hard on ads) */}
          <image
            ref={tradMascotRef}
            href="/brand_mascot_traditional.png"
            x={tradX}
            y={tradY}
            width={tradW}
            height={tradH}
            preserveAspectRatio="xMidYMid meet"
            className="select-none"
            style={{ transformOrigin: `${character.cx}px ${character.bottom}px` }}
          />

          {/* sellr. Relaxed Mascot (chill, hands behind head, eyes closed) */}
          <image
            ref={sellrMascotRef}
            href="/brand_mascot_sellr.png"
            x={sellrX}
            y={sellrY}
            width={sellrW}
            height={sellrH}
            preserveAspectRatio="xMidYMid meet"
            className="select-none"
            style={{ transformOrigin: `${character.cx}px ${character.bottom}px` }}
          />
        </g>

        {/* 1. Base Continuous Black Ribbon */}
        <path
          d={d}
          fill="none"
          stroke={INK}
          strokeWidth={scene.band}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* 2. Under-layer Capsules (clipped cleanly at the sellr. pill checkpoint) */}
        <g ref={underCapsulesRef} clipPath={`url(#capsule-inbound-clip-${uid})`}>
          {strip &&
            Array.from({ length: strip.count }).map((_, i) => {
              const tradItem = TRADITIONAL_CAPSULES[i % TRADITIONAL_CAPSULES.length];
              const sellrItem = SELLR_CAPSULES[i % SELLR_CAPSULES.length];
              return (
                <g key={`capsule-${i}`} className="pointer-events-none">
                  {/* Cylindrical curved outline */}
                  <path
                    className="capsule-outline"
                    fill="rgba(16, 13, 12, 0.65)"
                    strokeWidth="1.5"
                  />

                  {/* Traditional Mode: curved text bending along the loop */}
                  <g className="capsule-trad-view">
                    <text
                      dominantBaseline="central"
                      fill={CREAM}
                      fontSize={scene.fontSize}
                      fontFamily="'Montserrat', 'Inter', sans-serif"
                      fontWeight="600"
                      letterSpacing="0.02em"
                    >
                      <textPath
                        href={`#capsule-guide-${uid}-${i}`}
                        startOffset="50%"
                        textAnchor="middle"
                      >
                        {tradItem.text}
                      </textPath>
                    </text>
                  </g>

                  {/* sellr. Mode: thumbnail at left end + curved text bending along loop */}
                  <g className="capsule-sellr-view">
                    <g className="capsule-thumb-anchor">
                      <image
                        href={sellrItem.imageUrl}
                        x={-thumbSize / 2}
                        y={-thumbSize / 2}
                        width={thumbSize}
                        height={thumbSize}
                        preserveAspectRatio="xMidYMid slice"
                        clipPath={`url(#clip-thumb-${uid}-${i % SELLR_CAPSULES.length})`}
                      />
                      <rect
                        x={-thumbSize / 2}
                        y={-thumbSize / 2}
                        width={thumbSize}
                        height={thumbSize}
                        rx={thumbRadius}
                        fill="none"
                        stroke="#ffffff"
                        strokeWidth="1.2"
                        strokeOpacity="0.8"
                      />
                    </g>
                    <text
                      dominantBaseline="central"
                      fill={CREAM}
                      fontSize={scene.fontSize}
                      fontFamily="'Montserrat', 'Inter', sans-serif"
                      fontWeight="600"
                      letterSpacing="0.01em"
                    >
                      <textPath
                        href={`#capsule-guide-${uid}-${i}`}
                        startOffset={isWide ? "22px" : "18px"}
                        textAnchor="start"
                      >
                        {sellrItem.text}
                      </textPath>
                    </text>
                  </g>

                  {/* Separator star midway in the common gap between this capsule and trailing capsule */}
                  <g className="capsule-sep-anchor">
                    <text
                      className="capsule-separator-star select-none pointer-events-none"
                      dominantBaseline="central"
                      textAnchor="middle"
                      fontSize={scene.payoutFontSize}
                      fontFamily="'Montserrat', 'Inter', sans-serif"
                      fontWeight="600"
                    >
                      ✦
                    </text>
                  </g>
                </g>
              );
            })}
        </g>

        {/* 3. Over-band restated stroke (paints over incoming tail at crossing) */}
        <path
          ref={overBandRef}
          d={d}
          fill="none"
          stroke={INK}
          strokeWidth={scene.band}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* 4. Over-layer Capsules (descending flank & crossing, clipped at pill) */}
        <g ref={overCapsulesRef} clipPath={`url(#capsule-inbound-clip-${uid})`} />

        {/* 5. Left-side Payout Stream (Continuous marquee with elegant typography and inline '✦' separator matching creator ribbon) */}
        <g clipPath={`url(#payout-clip-${uid})`} className="pointer-events-none">
          {/* Traditional mode payout stream */}
          <text
            className="payout-trad-view"
            dominantBaseline="central"
            fontSize={scene.payoutFontSize}
            fontFamily="'Montserrat', 'Inter', sans-serif"
            fontWeight="600"
            letterSpacing="0.02em"
          >
            <textPath
              ref={payoutTradPathRef}
              href={`#payout-geom-${uid}`}
              startOffset="0px"
            >
              {Array.from({ length: payoutReps }).map((_, r) => (
                <React.Fragment key={`rep-trad-${r}`}>
                  {TRADITIONAL_PAYOUTS.map((p, idx) => (
                    <React.Fragment key={`p-trad-${r}-${idx}`}>
                      <tspan fill={p.isProfit ? "#86efac" : "#fca5a5"}>{p.text}</tspan>
                      <tspan fill="#fdfbea" fillOpacity={0.9}>
                        {"\u00A0\u00A0✦\u00A0\u00A0"}
                      </tspan>
                    </React.Fragment>
                  ))}
                </React.Fragment>
              ))}
            </textPath>
          </text>

          {/* sellr. mode payout stream */}
          <text
            className="payout-sellr-view"
            dominantBaseline="central"
            fontSize={scene.payoutFontSize}
            fontFamily="'Montserrat', 'Inter', sans-serif"
            fontWeight="600"
            letterSpacing="0.02em"
          >
            <textPath
              ref={payoutSellrPathRef}
              href={`#payout-geom-${uid}`}
              startOffset="0px"
            >
              {Array.from({ length: payoutReps }).map((_, r) => (
                <React.Fragment key={`rep-sellr-${r}`}>
                  {SELLR_PAYOUTS.map((p, idx) => (
                    <React.Fragment key={`p-sellr-${r}-${idx}`}>
                      <tspan fill="#86efac">{p.text}</tspan>
                      <tspan fill="#ffffff" fillOpacity={0.95}>
                        {"\u00A0\u00A0✦\u00A0\u00A0"}
                      </tspan>
                    </React.Fragment>
                  ))}
                </React.Fragment>
              ))}
            </textPath>
          </text>
        </g>

        {/* 6. Interactive sellr. Pill Button (Checkpoint on flat lower run) */}
        <g
          ref={pillRef}
          transform={`translate(${scene.pill.cx} ${scene.pill.cy})`}
          onClick={handlePillClick}
          onKeyDown={handleKeyDown}
          tabIndex={0}
          role="button"
          aria-label={`Switch Brand mode from ${mode === "traditional" ? "Traditional to sellr." : "sellr. to Traditional"}`}
          className="cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-orange-500 rounded-full"
          style={{ transformOrigin: `${scene.pill.cx}px ${scene.pill.cy}px` }}
        >
          {/* Luminous Ethereal Aura in sellr mode with dynamic rotating outer shadow movement */}
          {mode === "sellr" && (
            <g className="pill-aura-layer pointer-events-none">
              {/* 1. Tight Outer Bloom: obsidian black and electric orange halo hugging the pill rim */}
              <rect
                x={-scene.pill.w / 2 - 6}
                y={-scene.pill.h / 2 - 5}
                width={scene.pill.w + 12}
                height={scene.pill.h + 10}
                rx={(scene.pill.h + 10) / 2}
                fill={`url(#aura-outer-rad-${uid})`}
                filter={`url(#aura-outer-blur-${uid})`}
                className="aura-outer-pulse"
              />

              {/* 2. Tight Core Aura: bright luminous golden-orange bloom */}
              <rect
                x={-scene.pill.w / 2 - 3}
                y={-scene.pill.h / 2 - 2.5}
                width={scene.pill.w + 6}
                height={scene.pill.h + 5}
                rx={(scene.pill.h + 5) / 2}
                fill={`url(#aura-core-rad-${uid})`}
                filter={`url(#aura-core-blur-${uid})`}
                className="aura-core-pulse"
              />

              {/* 3. Luminous Corona Stroke: smooth glowing perimeter halo */}
              <rect
                x={-scene.pill.w / 2 - 1}
                y={-scene.pill.h / 2 - 1}
                width={scene.pill.w + 2}
                height={scene.pill.h + 2}
                rx={(scene.pill.h + 2) / 2}
                fill="none"
                stroke={`url(#aura-corona-grad-${uid})`}
                strokeWidth="2"
                filter={`url(#aura-corona-blur-${uid})`}
                className="aura-corona-pulse"
              />
            </g>
          )}

          {/* Pill background */}
          <rect
            x={-scene.pill.w / 2}
            y={-scene.pill.h / 2}
            width={scene.pill.w}
            height={scene.pill.h}
            rx={scene.pill.h / 2}
            fill={mode === "traditional" ? "#18181b" : "#fdfbea"}
            stroke={mode === "traditional" ? "#52525b" : "#100d0c"}
            strokeWidth="2.5"
            filter={`url(#pill-shadow-${uid})`}
            className="transition-colors duration-200"
          />

          {/* Pill text */}
          <text
            textAnchor="middle"
            dominantBaseline="middle"
            fill={mode === "traditional" ? "#ffffff" : "#100d0c"}
            fontSize={scene.pill.fontSize}
            fontFamily="'Montserrat', 'Inter', sans-serif"
            fontWeight="800"
            letterSpacing="-0.01em"
            className="select-none pointer-events-none transition-colors duration-200"
          >
            {mode === "traditional" ? "Traditional" : "sellr."}
          </text>
        </g>

        {/* 7. First-Arrival Interactive Hint ("try me" / "click here" arrow pointing to pill) */}
        {!hasInteractedPill && (
          <g
            transform={`translate(${scene.hint.x} ${scene.hint.y})`}
            className="pointer-events-none"
          >
            <g ref={hintBounceRef}>
              {/* Hand-drawn curved arrow pointing toward pill */}
              <path
                d="M -16 -24 Q 0 -12 0 10 M -6 2 L 0 10 L 6 2"
                fill="none"
                stroke="#000000"
                strokeWidth="2.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* Pill badge with 'try me! ✦' */}
              <rect
                x="-52"
                y="-52"
                width="104"
                height="24"
                rx="12"
                fill="#f97316"
                filter={`url(#pill-shadow-${uid})`}
              />
              <text
                x="0"
                y="-37"
                textAnchor="middle"
                dominantBaseline="middle"
                fill="#000000"
                fontSize="11.5"
                fontFamily="'Montserrat', 'Inter', sans-serif"
                fontWeight="800"
                letterSpacing="0.02em"
              >
                click me! ✦
              </text>
            </g>
          </g>
        )}
      </svg>
    </div>
  );
};

export default BrandRibbon;
