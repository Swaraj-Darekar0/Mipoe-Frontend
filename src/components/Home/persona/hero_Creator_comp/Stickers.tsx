import React from "react";

/**
 * The sticker layer, rebuilt against a close read of the reference.
 *
 * Four corrections to the first pass, all of them things the reference is doing
 * that I had guessed at:
 *
 * 1. NOTHING IS ROTATED. Every label in the reference sits dead square. The
 *    tilt I had added reads as scrapbook; the reference reads as a design
 *    canvas with UI chrome parked on it, and the axis alignment is most of why.
 * 2. SHADOWS ARE SOFT, not hard offsets. A hard offset shadow is a sticker
 *    convention; a soft one is an interface convention. The reference is going
 *    for the second.
 * 3. THERE ARE TWO LABEL SYSTEMS, not one. Serif tags carry descriptive
 *    sentences and are set in the display face, Title Case. Sans pills carry
 *    short status chips, are set in the grotesque with a dot, and are fully
 *    rounded. Collapsing them into one loses the hierarchy.
 * 4. LABELS OVERLAP THE TYPE and are trusted to. The headline is large enough
 *    to lose a letter and still read.
 *
 * Everything except the emoji is drawn, so labels take the site's ink and paper
 * values rather than importing a second black, and stay sharp at any density.
 * All of it is decorative and `aria-hidden` — the labels restate claims the copy
 * already makes, so announcing them again is just the page stuttering.
 */

/**
 * Interface-style shadow, not sticker-style. See note 2 above.
 *
 * Applied as a FILTER on the wrapper rather than a box-shadow on the panel,
 * because a speech bubble is a panel plus a tail and a box-shadow only knows
 * about the box — it would cast the shadow of a rectangle and leave the tail
 * floating shadowless on top of it. `drop-shadow` follows the composited alpha
 * of the whole subtree, so the panel and its tail throw one silhouette.
 */
const SHADOW = "drop-shadow-[0_3px_6px_rgba(23,19,16,0.20)]";

interface Positioned {
  /** Positioning only. These hang off a `relative` headline wrapper with
   *  percentage offsets so they track the type as it reflows. */
  className?: string;
}

/**
 * Descriptive tag: display face, Title Case, one to two short lines, tail on
 * whichever edge points back at the thing being annotated.
 *
 * The tail direction is the whole point of the component and was the thing most
 * obviously missing before: every tag pointed down regardless of where it sat,
 * so a tag above the headline gestured at the headline while a tag below it
 * gestured off into empty canvas. A bubble whose tail points at nothing stops
 * reading as a bubble and just reads as a floating box.
 */
export const SerifTag: React.FC<
  Positioned & {
    lines: readonly string[];
    tone?: string;
    /** Where along the edge the tail sits, as a % of the panel's width. */
    tailAt?: number;
    /** Which edge the tail leaves from. Point it at what the tag annotates. */
    tail?: "down" | "up";
  }
> = ({ lines, tone = "#cfe8a8", tailAt = 24, tail = "down", className = "" }) => (
  <div
    className={`hero-sticker absolute pointer-events-none select-none ${SHADOW} ${className}`}
    aria-hidden="true"
  >
    <div className="relative">
      <div
        className="rounded-[8px] border-[1.5px] border-ink px-3.5 py-[7px]"
        style={{ background: tone }}
      >
        {lines.map((line, i) => (
          // Playfair at 700, not the fat face: Abril has one weight and its
          // hairlines disappear entirely at 13px. See the note on --font-fat.
          <p
            key={i}
            className="font-HomeDisplay font-bold text-[11px] md:text-[12.5px] leading-[1.3] text-ink whitespace-nowrap text-center"
          >
            {line}
          </p>
        ))}
      </div>
      {/* The tail overlaps the panel border by 2px so the two read as one
          outline; the panel's 1.5px border would otherwise cut across its neck.
          The path is deliberately left open (no Z) — closing it would stroke a
          line across the mouth. */}
      <svg
        className={`absolute ${tail === "down" ? "top-full -mt-[2px]" : "bottom-full -mb-[2px]"}`}
        style={{ left: `${tailAt}%` }}
        width="26"
        height="20"
        viewBox="0 0 26 20"
        fill="none"
      >
        <path
          d={tail === "down" ? "M 0 0 L 13 19 L 26 0" : "M 0 20 L 13 1 L 26 20"}
          fill={tone}
          stroke="#171310"
          strokeWidth={1.5}
          strokeLinejoin="round"
        />
      </svg>
    </div>
  </div>
);

/** Status chip: grotesque, dot, fully rounded, white. Reads as UI. */
export const SansPill: React.FC<Positioned & { label: string; dot?: string }> = ({
  label,
  dot = "#f9a8cd",
  className = "",
}) => (
  <div
    className={`hero-sticker absolute pointer-events-none select-none ${SHADOW} ${className}`}
    aria-hidden="true"
  >
    <div className="flex items-center gap-2 rounded-full border-[1.5px] border-ink bg-white pl-[7px] pr-3.5 py-[5px]">
      <span className="h-[13px] w-[13px] shrink-0 rounded-full" style={{ background: dot }} />
      <span className="font-body text-[11.5px] md:text-[12.5px] font-bold text-ink whitespace-nowrap">
        {label}
      </span>
    </div>
  </div>
);

/**
 * The pointer. In the reference it is always aimed at a label, never floating —
 * that is what sells the labels as interface rather than decoration, so place it
 * just below-right of a pill.
 */
export const StickerCursor: React.FC<Positioned> = ({ className = "" }) => (
  <svg
    className={`hero-sticker absolute pointer-events-none select-none drop-shadow-[0_2px_4px_rgba(23,19,16,0.25)] ${className}`}
    width="24"
    height="32"
    viewBox="0 0 24 32"
    fill="none"
    aria-hidden="true"
  >
    <path
      d="M 2 1 L 2 30 L 9 23 L 15 32 L 21 29 L 15 20 L 23 19 Z"
      fill="#ffffff"
      stroke="#171310"
      strokeWidth={1.8}
      strokeLinejoin="round"
    />
  </svg>
);

/**
 * Microsoft Fluent Emoji, 3D style — MIT, so no attribution needed. Self-host
 * under /public/emoji; raw.githubusercontent.com is not a CDN.
 *
 * These read softer than the reference's photoreal cutouts. That is the better
 * call here: photoreal cherries beside a drawn character would fight, where
 * these sit in the same illustrative register. The reference itself mixes —
 * photoreal cherries next to an emoji-style lightning bolt.
 */
export const EmojiSticker: React.FC<Positioned & { name: string; size?: number }> = ({
  name,
  size = 52,
  className = "",
}) => (
  <img
    // Root-relative. This was `${name}_3d.png` — no leading slash and no files
    // on disk, so every emoji resolved against the CURRENT route and 404'd.
    // That is why none of them were on screen. The assets now live in
    // public/emoji; a bare relative src would still break on any nested route.
    src={`/emoji/${name}_3d.png`}
    alt=""
    aria-hidden="true"
    // Above the fold and tiny — lazy costs a round trip after paint and makes
    // them pop in behind the entrance animation.
    loading="eager"
    decoding="async"
    width={size}
    height={size}
    className={`hero-sticker absolute pointer-events-none select-none drop-shadow-[0_3px_5px_rgba(23,19,16,0.22)] ${className}`}
    style={{ width: size, height: size }}
  />
);

/**
 * The graph-paper grid. Easy to miss and doing real work: it is what makes the
 * labels read as parked on a working canvas rather than floating in space, and
 * it gives the whole composition a plane to sit on. Keep it near-invisible —
 * at the reference's weight it is barely there, and any more competes with the
 * ribbon.
 *
 * Two gradients rather than a background image so it stays crisp at any density
 * and costs no request. The cell is 40px because that is roughly the reference's
 * ratio against its type size; scale the two together or the plane stops
 * reading as paper and starts reading as a table.
 */
export const StickerGrid: React.FC<{ className?: string }> = ({ className = "" }) => (
  <div
    className={`pointer-events-none absolute inset-0 ${className}`}
    aria-hidden="true"
    style={{
      backgroundImage:
        "linear-gradient(to right, rgba(23,19,16,0.062) 1px, transparent 1px)," +
        "linear-gradient(to bottom, rgba(23,19,16,0.062) 1px, transparent 1px)",
      backgroundSize: "40px 40px",
      // Fades out before the bottom edge so the grid never cuts a hard line
      // across the ribbon scene, which sits on the same plane.
      maskImage: "linear-gradient(to bottom, #000 0%, #000 58%, transparent 88%)",
      WebkitMaskImage: "linear-gradient(to bottom, #000 0%, #000 58%, transparent 88%)",
    }}
  />
);
