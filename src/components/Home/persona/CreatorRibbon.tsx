import React, { useEffect, useId, useMemo, useRef, useState } from "react";
import gsap from "gsap";
import TextLoop from "./textloop";
import ThoughtBubble from "./ThoughtBubble";
import { DEFAULT_CLIPS } from "../UGCShowcase";

/**
 * The hero's ribbon scene, rebuilt on React Bits' TextLoop.
 *
 * ONE continuous ribbon now, instead of two marquees that each dead-ended at the
 * badge. It enters off-canvas left, throws a single open loop that crosses back
 * over its own incoming tail, runs down through the wordmark badge, and rises
 * away off the right edge.
 *
 * The two halves are still content-in / money-out, they just share a path:
 *   - everything BEFORE the badge is the film strip — clip thumbnails riding the
 *     band, which is what the loop is carrying;
 *   - everything AFTER the badge is the payout text.
 * Both seams fall under the badge, so neither is ever visible.
 *
 * The character is no longer floating: her artwork's flat bottom crop is tucked
 * INSIDE the band, so the ribbon is her crop line and the old fade mask is gone.
 * The badge sits directly beneath her as a plinth.
 */

/** Illustrative payout signals, not live platform data (hence aria-hidden). */
const EARNING_SIGNALS = [
  "₹2,400 for one reel",
  "₹1,100 payout cleared",
  "₹5,600 earned this month",
  "₹1,850 in 48 hours",
  "₹3,200 from CPV payouts",
  "₹900 from the first campaign",
  "₹7,300 from three clips",
  "₹12,400 this quarter",
  "₹2,050 for a 20s clip",
] as const;

/** character_asset.png, and the bounds of the opaque artwork inside it: the file
 *  carries ~146px of transparent padding down its right edge. The scene places
 *  the *artwork*, so every box below is derived from `ASSET_CONTENT_W` rather
 *  than the file width. */
const ASSET_W = 1448;
const ASSET_H = 1086;
const ASSET_CONTENT_W = 1302;

const INK = "#100d0c";
const CREAM = "#fdfbea";



type Anchor = readonly [number, number];

interface Scene {
  vbW: number;
  vbH: number;
  /** Anchors in travel order. One path, self-crossing. */
  anchors: readonly Anchor[];
  band: number;
  cell: { w: number; h: number; gap: number };
  fontSize: number;
  letterSpacing: number;
  /** Ribbon travel in viewBox units per second — the strip and the text share
   *  it, so the two halves read as one moving object. */
  speed: number;
  /** Character artwork box: `cx` centre, `bottom` baseline of the artwork. */
  character: { cx: number; bottom: number; width: number };
  badge: { cx: number; cy: number; w: number; h: number; fontSize: number };
  /** Comment bubble anchor, plus the x range it must stay inside. Null
   *  disables it for this breakpoint. */
  bubble: {
    cx: number;
    cy: number;
    h: number;
    fontSize: number;
    bounds: [number, number];
  } | null;
  signals: readonly string[];
}

/**
 * Desktop. The loop sits left of the character and crosses its own tail at about
 * (165, 285); the run underneath is deliberately flat where she stands.
 *
 * INVARIANT: across the character's width the path's vertical travel must stay
 * comfortably under `band` — that is the whole reason her cropped edge stays
 * hidden at every x. Here the safe window for `character.bottom` is [489, 526]
 * and she sits at 500. Nudge the run's anchors and re-check that budget before
 * anything else.
 */
const DESKTOP: Scene = {
  vbW: 1200,
  vbH: 580,
  anchors: [
    // 1. enters far off-canvas left. The tails are deliberately enormous: the
    // scene is scaled to fit the hero, so on a wide, short window the viewBox
    // renders much narrower than the viewport and a short tail stops mid-air.
    // 4000 units of span keeps the ribbon bleeding edge to edge everywhere.
    [-1700, 462], [-1100, 456], [-600, 448], [-240, 436], [20, 422], [126, 408],
    // 2. climbs the loop's right flank
    [206, 386], [272, 338], [300, 268],
    // 3. crown — a tall teardrop, not a ring: the reference's loop is much
    // taller than it is wide, which is what stops it reading as a doughnut.
    [296, 190], [258, 132], [194, 106], [122, 126], [80, 186],
    // 4. left flank down — crosses the incoming tail here
    [66, 256], [76, 326], [110, 388],
    // 5. out of the loop and down to the floor
    [170, 438], [262, 474], [370, 494],
    // 6. flat run under the character, through the badge
    [486, 506], [610, 510], [740, 508],
    // 7. rises away off-canvas right
    [880, 500], [1030, 484], [1220, 456], [1500, 414], [1950, 348], [2400, 284],
  ],
  band: 42,
  cell: { w: 22, h: 28, gap: 6 },
  fontSize: 21,
  letterSpacing: 0.2,
  speed: 40,
  character: { cx: 600, bottom: 500, width: 266 },
  badge: { cx: 600, cy: 508, w: 140, h: 56, fontSize: 45 },
  // Beside her head rather than over it: the copy block bottoms out around
  // y 272, and her silhouette owns x 467–733, so this is the one pocket that
  // is clear of both.
  bubble: { cx: 750, cy: 370, h: 58, fontSize: 21, bounds: [650, 1180] },
  signals: EARNING_SIGNALS,
};

/**
 * Compact, for anything narrower than `WIDE_SCENE_MIN`. Rebalanced for a
 * portrait fold: the loop is small and low, the character is scaled up to 300
 * of 420 units so the illustration rises to meet the copy instead of leaving a
 * dead band across the middle of the screen, and the floor sits at ~94% of the
 * viewBox so `YMax` lands it on the bottom edge of the phone.
 *
 * Safe window for `character.bottom` here is [449, 462] against a 44 band —
 * only 13 units wide, and it narrows fast as she grows. Re-check it on a real
 * device if you touch either the run's anchors or her width.
 */
const COMPACT: Scene = {
  vbW: 420,
  vbH: 400,
  anchors: [
    // Portrait folds the desktop topology vertically instead of squashing it
    // sideways. The loop sits high and left, the strip then drops down the far
    // edge as a chute and runs INTO the badge, and the payout text leaves the
    // badge heading right. Both halves still terminate at the badge, which is
    // the whole concept: content in one side, money out the other.
    [-600, 176], [-300, 172], [-90, 166], [26, 156],
    // loop, kept small. Every unit of height it takes is a unit the copy block
    // loses, and the copy has to sit near the fold.
    [92, 134], [144, 100], [160, 60],
    [146, 24], [100, 10], [56, 28], [38, 68],
    [38, 110], [56, 146], [84, 174],
    // the chute. It hugs the far left because the floor has to be LEVEL by the
    // time it reaches her: a band still descending under the character cannot
    // cover her cropped edge. That constraint is what puts the turn at x < 130
    // and pushes her off-centre to the right.
    [98, 212], [96, 252], [82, 292],
    [74, 322], [94, 348], [132, 362],
    [196, 370], [272, 372], [348, 371],
    [430, 367], [560, 358], [820, 336], [1250, 296],
  ],
  band: 40,
  cell: { w: 18, h: 23, gap: 5 },
  fontSize: 14,
  letterSpacing: 0.1,
  speed: 26,
  character: { cx: 275, bottom: 362, width: 290 },
  badge: { cx: 275, cy: 371, w: 96, h: 42, fontSize: 28 },
  // Beside the phone, which is what the comments are about. Measured off a
  // render, then rescaled for her 290 width: the phone occupies x 222–320 with
  // its top at y ≈ 267 (its bottom is under the band), and her face owns
  // y 184–258 — so the bubble cannot sit above the phone without covering her
  // eyes. It sits to the phone's right over her hand and hair (the bubble is
  // meant to land on top of the scene), and its lower-left tail — tip lands at
  // roughly (box.x, cy+42) — drops onto the phone body at every comment
  // length once the bounds clamp is counted in. The high bound keeps the box
  // and its 4-unit shadow inside the 420 frame; the low bound keeps a long
  // comment off the loop's chute.
  bubble: { cx: 358, cy: 285, h: 44, fontSize: 15, bounds: [156, 408] },
  // A shorter cycle keeps the glyph count down on phones.
  signals: EARNING_SIGNALS.slice(0, 5),
};

/**
 * Uniform Catmull-Rom through the anchors, one cubic per span. The anchors stay
 * the art-directable part — nudge a point and the curve stays smooth, which
 * hand-authored bezier handles would not.
 */
const smoothPath = (pts: readonly Anchor[]): string => {
  const p = [pts[0], ...pts, pts[pts.length - 1]];
  const r = (n: number) => Math.round(n * 10) / 10;
  let d = `M ${p[1][0]} ${p[1][1]}`;
  for (let i = 1; i < p.length - 2; i += 1) {
    const [x0, y0] = p[i - 1];
    const [x1, y1] = p[i];
    const [x2, y2] = p[i + 1];
    const [x3, y3] = p[i + 2];
    d += ` C ${r(x1 + (x2 - x0) / 6)} ${r(y1 + (y2 - y0) / 6)},`;
    d += ` ${r(x2 - (x3 - x1) / 6)} ${r(y2 - (y3 - y1) / 6)},`;
    d += ` ${x2} ${y2}`;
  }
  return d;
};

const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Narrower than this and the loop has no room to read as a loop. That's a
 *  property of the artwork, not of the device, so it lives here rather than
 *  borrowing the app's mobile breakpoint. */
const WIDE_SCENE_MIN = 1024;

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

/** Everything the strip needs, all of it derived from the measured path. */
interface Strip {
  total: number;
  /** Length at which the ribbon reaches the badge — the strip's cycle. */
  split: number;
  count: number;
  step: number;
}

const CreatorRibbon: React.FC = () => {
  const scene = useWideScene() ? DESKTOP : COMPACT;
  const uid = useId().replace(/:/g, "");

  const d = useMemo(() => smoothPath(scene.anchors), [scene]);
  const text = useMemo(() => scene.signals.join("\u00A0\u00A0✦\u00A0\u00A0"), [scene]);

  const geomRef = useRef<SVGPathElement>(null);
  /**
   * THE CROSSING, solved by draw order and nothing else.
   *
   * The strip is painted as two layers split at the loop's crown: everything
   * BEFORE the crown (the incoming tail and the climb) lives in `underCellsRef`;
   * the band from the crown onward is restated once in `overBandRef`; the cells
   * from the crown onward ride it in `overCellsRef`. Painter's algorithm does
   * the rest: where the descending branch crosses the incoming tail, its band
   * and its thumbnails simply paint over them — which is exactly what a
   * physical ribbon does.
   *
   * This replaced a numeric crossing solver + a dash patch + <use> "ghost"
   * machinery, and the reason is visual, not just code size. The patch's dash
   * ENDS were cuts straight across the band with no visible counterpart (ink
   * over ink), so a thumbnail straddling one survived as a floating sliver —
   * the clutter at the junction. Here the only thing that ever covers a
   * thumbnail is the over band's actual silhouette, so every occlusion edge is
   * a real, visible band edge. A partially covered cell reads as passing UNDER
   * the ribbon, not as debris.
   */
  const underCellsRef = useRef<SVGGElement>(null);
  const overBandRef = useRef<SVGPathElement>(null);
  const overCellsRef = useRef<SVGGElement>(null);
  const [strip, setStrip] = useState<Strip | null>(null);

  // Reset between breakpoints so the ticker never positions the previous
  // scene's cell count against the new path.
  useEffect(() => setStrip(null), [scene]);

  useEffect(() => {
    const path = geomRef.current;
    if (!path) return;
    const total = path.getTotalLength();
    if (!total) return;

    // The strip ends where the ribbon reaches the badge. x is only monotonic
    // after the loop is done, so start the walk past halfway.
    let split = total;
    for (let at = total * 0.5; at <= total; at += 2) {
      if (path.getPointAtLength(at).x >= scene.badge.cx) {
        split = at;
        break;
      }
    }

    // Round the spacing to divide the strip exactly. Left as-is, the strip
    // carries one odd-sized gap that visibly travels around the loop.
    const count = Math.max(1, Math.round(split / (scene.cell.w + scene.cell.gap)));
    setStrip({ total, split, count, step: split / count });
  }, [scene, d]);

  useEffect(() => {
    const path = geomRef.current;
    const underGroup = underCellsRef.current;
    const overGroup = overCellsRef.current;
    const overBand = overBandRef.current;
    if (!path || !underGroup || !overGroup || !overBand || !strip) return;

    // Sample the strip's span once into flat arrays. Per-frame work is then an
    // array lookup per cell instead of ~200 getPointAtLength() calls.
    const RES = 2;
    const samples = Math.ceil(strip.split / RES) + 1;
    const xs = new Float32Array(samples);
    const ys = new Float32Array(samples);
    const angles = new Float32Array(samples);
    for (let i = 0; i < samples; i += 1) {
      const at = Math.min(i * RES, strip.split);
      const point = path.getPointAtLength(at);
      const before = path.getPointAtLength(Math.max(0, at - 3));
      const after = path.getPointAtLength(Math.min(strip.total, at + 3));
      xs[i] = point.x;
      ys[i] = point.y;
      angles[i] = (Math.atan2(after.y - before.y, after.x - before.x) * 180) / Math.PI;
    }

    // The under/over split point: the loop's crown, i.e. the sampled minimum of
    // y. For this topology it always lies strictly between the two visits to
    // the crossing — the tail passes under BEFORE the crown, the flank comes
    // back over AFTER it — which is the only property the split needs. Free to
    // compute, no solver, and it tracks any anchor move automatically.
    let crown = 0;
    for (let i = 1; i < samples; i += 1) {
      if (ys[i] < ys[crown]) crown = i;
    }
    const crownAt = crown * RES;

    // The over band restarts half a cell past the crown so a cell whose centre
    // is just short of the crown (still in the under layer) can never poke past
    // the band's dash start and get cut by an invisible line. The offset lands
    // on the loop's crown, nowhere near the crossing, and the two strokes are
    // the same ink, so the hand-off itself cannot be seen.
    const bandFrom = crownAt + scene.cell.w / 2 + 2;
    // ...and it must STOP at the badge, because the payout text rides the path
    // beyond it and a full-length restated band would paint over the glyphs.
    // The badge covers the butt end, the same way it covers the strip's seam.
    overBand.setAttribute(
      "stroke-dasharray",
      `0 ${bandFrom.toFixed(1)} ${(strip.split - bandFrom).toFixed(1)} ${strip.total.toFixed(1)}`
    );

    const cells = [
      ...(Array.from(underGroup.children) as SVGGElement[]),
      ...(Array.from(overGroup.children) as SVGGElement[]),
    ];
    // Which layer each cell currently sits in, tracked so the reparent only
    // happens on membership change — roughly one cell every second or two, not
    // per frame. appendChild MOVES the node, so this is one DOM op when it does.
    const inOver = cells.map((c) => c.parentNode === overGroup);

    const place = (shift: number) => {
      for (let i = 0; i < cells.length; i += 1) {
        // Cells recycle over the strip's span, not the whole path: one end is
        // off-canvas left, the other is under the badge, so the seam is never
        // on screen.
        const at = (i * strip.step + shift) % strip.split;

        const over = at >= crownAt;
        if (over !== inOver[i]) {
          (over ? overGroup : underGroup).appendChild(cells[i]);
          inOver[i] = over;
        }

        const k = Math.min(samples - 1, Math.round(at / RES));
        cells[i].setAttribute(
          "transform",
          `translate(${xs[k].toFixed(1)} ${ys[k].toFixed(1)}) rotate(${angles[k].toFixed(1)})`
        );
      }
    };

    place(0);

    const stop = prefersReducedMotion()
      ? undefined
      : (() => {
          const tick = (time: number) => place((time * scene.speed) % strip.split);
          gsap.ticker.add(tick);
          return () => gsap.ticker.remove(tick);
        })();

    return () => {
      stop?.();
      // Hand every cell back to the under group before React reconciles this
      // subtree again. React records each cell's parent at mount; unmounting a
      // cell it believes is in one group while the ticker has moved it to the
      // other throws NotFoundError mid-commit. Cheap insurance: ~1 appendChild
      // per moved cell, only on scene change or unmount.
      for (let i = 0; i < cells.length; i += 1) {
        if (inOver[i]) underGroup.appendChild(cells[i]);
      }
    };
  }, [scene, strip]);

  const { cell, character, badge } = scene;
  const charW = (character.width * ASSET_W) / ASSET_CONTENT_W;
  const charH = (character.width * ASSET_H) / ASSET_CONTENT_W;
  const charX = character.cx - character.width / 2;
  const charY = character.bottom - charH;

  const badgeX = badge.cx - badge.w / 2;
  const badgeY = badge.cy - badge.h / 2;

  const inkId = `creator-ink-${uid}`;

  return (
    // Decorative: the figures are illustrative and a marquee is hostile to read
    // linearly, so the whole scene stays out of the accessibility tree.
    <div className="absolute inset-0" aria-hidden="true" role="presentation">
      {/* The scene now fills the whole hero rather than the leftover row under
          the copy, so the loop can rise beside the headline the way it does in
          the reference. `YMax` pins it to the bottom, which keeps the ribbon's
          floor on the fold at any window height; whatever slack is left spills
          off the top, behind the copy, where the loop already lives. */}
      <TextLoop
        text={text}
        path={d}
        viewBox={{ w: scene.vbW, h: scene.vbH }}
        separator=""
        fitToPath={false}
        speed={scene.speed}
        fontSize={scene.fontSize}
        fontWeight={500}
        letterSpacing={scene.letterSpacing}
        color={`url(#${inkId})`}
        ribbonColor={INK}
        ribbonWidth={scene.band}
        preserveAspectRatio="xMidYMax meet"
        textClassName="font-body"
        className="pointer-events-none"
        defs={
          <>
            {/* The payout text only exists downstream of the badge. Rather than
                clip it, its fill goes transparent-to-cream across the badge's
                middle — so the glyph stream is continuous and the changeover is
                hidden under the wordmark. The band before the badge is carrying
                thumbnails, and text under them would be noise.
                Safe because the badge is the only place the path occupies these
                x values: the loop tops out at x≈300 desktop, x≈160 compact. */}
            <linearGradient
              id={inkId}
              gradientUnits="userSpaceOnUse"
              x1={badge.cx - badge.w * 0.2}
              y1={0}
              x2={badge.cx + badge.w * 0.2}
              y2={0}
            >
              <stop offset="0" stopColor={CREAM} stopOpacity="0" />
              <stop offset="1" stopColor={CREAM} stopOpacity="1" />
            </linearGradient>
            {/* Geometry twin, measured for the strip. Lives in defs so it is
                never painted. */}
            <path ref={geomRef} d={d} />
          </>
        }
        underlay={
          // Behind the band, so her flat bottom crop lands inside it. Her head
          // and body stay clear of the ribbon; only that edge is covered.
          <image href="/character_asset.png" x={charX} y={charY} width={charW} height={charH} />
        }
        overlay={
          <>
            {/* Clip strip, painted in path order — see the crossing note by the
                refs. All cells mount in the under layer; the ticker moves each
                one to the over layer the moment it passes the loop's crown, and
                back when it recycles. The band showing through the gaps between
                cells is what gives the film-strip framing. */}
            <g ref={underCellsRef}>
              {Array.from({ length: strip?.count ?? 0 }, (_, i) => {
                const clip = DEFAULT_CLIPS[i % DEFAULT_CLIPS.length];
                return (
                  <g key={i}>
                    <image
                      href={clip.imageUrl}
                      x={-cell.w / 2}
                      y={-cell.h / 2}
                      width={cell.w}
                      height={cell.h}
                      preserveAspectRatio="xMidYMid slice"
                    />
                  </g>
                );
              })}
            </g>
            {/* The forward half's band, restated over the under layer's cells.
                Dash is set by the effect: crown → badge. Same `d`, same ink, so
                everywhere except the crossing it repaints the band on itself
                invisibly; AT the crossing it is the over strip burying the tail
                it passes across. */}
            <path
              ref={overBandRef}
              d={d}
              fill="none"
              stroke={INK}
              strokeWidth={scene.band}
              strokeLinecap="butt"
              strokeDasharray="0 1"
            />
            <g ref={overCellsRef} />


            {/* Last, over everything: the badge is the plinth she stands on and
                the junction the flow passes through. It covers the strip's
                recycle seam and the text's fade-in at the same time. */}
            <g>
              <rect
                x={badgeX}
                y={badgeY}
                width={badge.w}
                height={badge.h}
                rx={badge.h / 2}
                fill={CREAM}
                stroke="#141414"
                strokeWidth={2.5}
              />
              {/* One <text>, wordmark and mark together. The ™ used to be its
                  own element pinned to the pill's top-right corner, where it
                  read as part of the pill rather than of the name; and the
                  wordmark carried a -0.1em x nudge to "make room" for it, which
                  is exactly the off-centre look it had. In one run, the ™ sits
                  where a trademark sits — superscript, right after the final
                  period — and the whole ensemble centres itself, so neither
                  needs a hand-tuned offset. */}
              <text
                x={badge.cx}
                y={badge.cy + 1}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={badge.fontSize}
                letterSpacing={-1.4}
                fill="#0b0b0b"
              >
                <tspan className="font-HomeDisplay">sellr.</tspan>
                <tspan
                  className="font-body"
                  fontSize={badge.fontSize * 0.22}
                  fontWeight={600}
                  letterSpacing={0}
                  dx={badge.fontSize * 0.08}
                  dy={-badge.fontSize * 0.38}
                >
                  ™
                </tspan>
              </text>
            </g>

            {/* Last of all: it should read as landing on top of the scene, and
                it briefly overlaps her hair on the compact layout. */}
            {scene.bubble && (
              <ThoughtBubble
                cx={scene.bubble.cx}
                cy={scene.bubble.cy}
                height={scene.bubble.h}
                fontSize={scene.bubble.fontSize}
                bounds={scene.bubble.bounds}
              />
            )}
          </>
        }
      />
    </div>
  );
};

export default CreatorRibbon;