import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";

/**
 * The comment bubble that surfaces above the character.
 *
 * Drawn as SVG rather than dropped in as the PNG, for three reasons: it lives
 * inside CreatorRibbon's viewBox so it scales with the character instead of
 * against her, it takes the site's ink/cream palette instead of importing a
 * second black, and it resizes itself to whatever comment is showing. The
 * offset shadow is the same sticker device the PNG uses.
 *
 * It is not a permanent fixture — it pops, holds, and clears, then waits a
 * random beat. That randomness is the point: a bubble that is always there
 * reads as a label, while one that arrives unannounced reads as a notification
 * landing, which is the thing being depicted.
 */

/**
 * The comments an affiliate post actually collects.
 *
 * Register is the whole point and it is not "polite enquiry". This is the
 * friend who saw the fit and is not letting it go: short, blunt, entitled,
 * slightly bossy. Two or three words, mostly lowercase, full stops used as
 * pressure rather than punctuation. No emoji, no "please", no "didi" softener.
 * The joke only lands if it sounds like someone who already assumes you will
 * send it.
 *
 * Keeping them this short also keeps the bubble narrow, which is what stopped
 * it running off the right edge of a phone.
 */
export const DEFAULT_COMMENTS = [
  "drop the link",
  "don't gatekeep",
  "link. now.",
  "where's the link",
  "send it na",
  "stop gatekeeping",
  "spill. link.",
  "okay but link",
  "kaha se liya",
] as const;

export interface ThoughtBubbleProps {
  /** Centre of the bubble, in the parent SVG's coordinate space. */
  cx: number;
  cy: number;
  height: number;
  fontSize: number;
  comments?: readonly string[];
  /** How long a comment stays up, in seconds. */
  hold?: number;
  /** Bounds of the random wait between comments, in seconds. */
  gap?: [number, number];
  /**
   * Horizontal bounds in the parent's coordinate space, as [min, max].
   *
   * The bubble sizes itself to whatever comment is showing, and it grows out
   * from `cx` in both directions, so a long comment near the frame edge used to
   * run straight off it. With bounds set, `cx` is treated as a preference: the
   * box slides back inside rather than being cropped. Leave the low end clear
   * of the loop so a wide comment does not land on top of the ribbon.
   */
  bounds?: [number, number];
  className?: string;
  ink?: string;
  paper?: string;
}

const PAD_X = 22;

const ThoughtBubble: React.FC<ThoughtBubbleProps> = ({
  cx,
  cy,
  height,
  fontSize,
  comments = DEFAULT_COMMENTS,
  hold = 1.3,
  gap = [2.5,3],
  bounds,
  className = "",
  ink = "#14100e",
  paper = "#fdfbea",
}) => {
  const groupRef = useRef<SVGGElement>(null);
  const textRef = useRef<SVGTextElement>(null);
  const [index, setIndex] = useState(() => Math.floor(Math.random() * comments.length));
  const [width, setWidth] = useState(height * 3.4);

  // Measure the comment that is actually showing and size the bubble to it —
  // "price kya hai?" and "where did you buy this??" are nowhere near the same
  // width, and a fixed box would leave one cramped and the other swimming.
  useLayoutEffect(() => {
    const el = textRef.current;
    if (!el) return;
    const fit = () => {
      try {
        setWidth(el.getComputedTextLength() + PAD_X * 2);
      } catch {
        /* not laid out yet */
      }
    };
    fit();
    if (typeof document !== "undefined" && document.fonts?.ready) {
      document.fonts.ready.then(fit).catch(() => {});
    }
  }, [index, fontSize, comments]);

  useEffect(() => {
    const el = groupRef.current;
    if (!el) return;

    // A shape that appears at unpredictable intervals is precisely what reduced
    // motion is asking us not to do, so it settles as a single static comment.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      gsap.set(el, { opacity: 1, scale: 1 });
      return;
    }

    let cancelled = false;
    const timers: number[] = [];
    // Pop from the tail, not the middle, so it reads as coming out of the
    // thing it is pointing at. Computed from the CLAMPED box, not from `cx`:
    // with the bubble parked against a frame edge the clamp shifts the box by
    // tens of units, and an origin still derived from `cx` made it pop from
    // past its own right edge.
    let originX = cx - width / 2;
    if (bounds) {
      if (originX + width > bounds[1]) originX = bounds[1] - width;
      if (originX < bounds[0]) originX = bounds[0];
    }
    const origin = { svgOrigin: `${originX + width * 0.16} ${cy + height * 0.5}` };

    const show = () => {
      if (cancelled) return;
      const tl = gsap.timeline({
        onComplete: () => {
          if (cancelled) return;
          const [lo, hi] = gap;
          timers.push(
            window.setTimeout(() => {
              // Never the same comment twice running — a repeat reads as a bug
              // rather than as a second person commenting.
              setIndex(prev => {
                if (comments.length < 2) return prev;
                const next = Math.floor(Math.random() * (comments.length - 1));
                return next >= prev ? next + 1 : next;
              });
              show();
            }, (lo + Math.random() * (hi - lo)) * 1000)
          );
        },
      });
      tl.fromTo(
        el,
        { opacity: 0, scale: 0.55, rotate: -6, ...origin },
        { opacity: 1, scale: 1, rotate: 0, duration: 0.42, ease: "back.out(2.2)", ...origin }
      )
        .to(el, { duration: hold })
        .to(el, { opacity: 0, scale: 0.85, duration: 0.25, ease: "power2.in", ...origin });
      timers.push(tl as unknown as number);
    };

    gsap.set(el, { opacity: 0 });
    timers.push(window.setTimeout(show, 1400));

    return () => {
      cancelled = true;
      timers.forEach(t => (typeof t === "number" ? window.clearTimeout(t) : (t as gsap.core.Timeline).kill()));
      gsap.killTweensOf(el);
    };
    // `width` deliberately excluded: it settles on the first measure, and
    // re-running would restart the cycle every time a longer comment arrives.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cx, cy, height, comments, hold, gap[0], gap[1]]);

  // Centre on `cx` where there is room, otherwise slide inside `bounds`.
  let x = cx - width / 2;
  if (bounds) {
    const [lo, hi] = bounds;
    if (x + width > hi) x = hi - width;
    if (x < lo) x = lo;
  }
  const y = cy - height / 2;
  const r = height / 2;
  // Tail springs from the lower-left corner, angled down toward her head.
  const tail = `M ${x + width * 0.16} ${y + height - 6} L ${x + width * 0.02} ${y + height + 20} L ${x + width * 0.34} ${y + height - 3} Z`;
  const shadow = 4;

  return (
    <g ref={groupRef} className={className} style={{ opacity: 0 }}>
      {/* Hard offset shadow — the sticker look, no blur. */}
      <g transform={`translate(${shadow} ${shadow})`} fill={ink}>
        <rect x={x} y={y} width={width} height={height} rx={r} />
        <path d={tail} />
      </g>
      <path d={tail} fill={paper} stroke={ink} strokeWidth={2.5} strokeLinejoin="round" />
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        rx={r}
        fill={paper}
        stroke={ink}
        strokeWidth={2.5}
      />
      <text
        ref={textRef}
        className="font-body"
        // Centred on the BOX, not on `cx`. The box slides inside `bounds` when
        // a long comment would run off the frame; the text was staying behind
        // at `cx`, hanging off-centre — or clean off the pill — exactly when
        // the clamp kicked in.
        x={x + width / 2}
        y={cy}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={fontSize}
        fontWeight={600}
        fill={ink}
      >
        {comments[index] ?? comments[0]}
      </text>
    </g>
  );
};

export default ThoughtBubble;