import React, {
  CSSProperties,
  ReactNode,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { gsap } from "gsap";

/**
 * React Bits — Text Loop (https://reactbits.dev/text-animations/text-loop), MIT,
 * vendored so it can be tuned. The upstream mechanism is unchanged: measure one
 * unit of text, repeat it to cover the path, and slide two twin <textPath>s
 * against each other so the marquee has no seam.
 *
 * Local changes, all additive:
 *   - `viewBox` is a prop instead of a 1200x520 constant, and the <svg> renders
 *     `overflow: visible` so a path's tails can run off-canvas.
 *   - TextLoop.css is inlined, so there's no second file to copy in.
 *   - `defs` / `underlay` / `overlay` slots render inside the same <svg>, which
 *     is the only way to put artwork in the ribbon's own coordinate space.
 *   - `fitToPath` (see below).
 *   - `uppercase` and `pauseOnHover` now default to false.
 *
 * On `fitToPath`: upstream stretches the text with textLength so one repetition
 * spans the path exactly, which is what makes a slide of `pathLength` seamless.
 * That's right for a short phrase, but our unit is a nine-item payout list —
 * rounding it to the path length would squeeze the tracking by ~20%. With
 * `fitToPath={false}` the text keeps its natural metrics, is repeated past the
 * end of the path, and the slide distance becomes one *unit* width instead.
 * Same seamlessness, no distortion.
 */

export type TextLoopDirection = "forward" | "reverse";

export interface TextLoopProps {
  text?: string;
  /** Path `d`, authored in the `viewBox` coordinate space. */
  path: string;
  viewBox?: { w: number; h: number };
  /** `xMidYMax meet` pins the scene to the bottom of its box, which is what
   *  keeps the ribbon's floor on the fold when the hero is taller than the
   *  viewBox's aspect. */
  preserveAspectRatio?: string;
  speed?: number;
  direction?: TextLoopDirection;
  separator?: string;
  fitToPath?: boolean;
  fontSize?: number;
  fontWeight?: number | string;
  letterSpacing?: number;
  uppercase?: boolean;
  /** Any paint value — a plain hex, or `url(#…)` pointing at a `defs` gradient. */
  color?: string;
  ribbon?: boolean;
  ribbonColor?: string;
  ribbonWidth?: number;
  pauseOnHover?: boolean;
  /** For the app's own font utility, e.g. `font-body`. */
  textClassName?: string;
  defs?: ReactNode;
  /** Drawn first — behind the ribbon band and the text. */
  underlay?: ReactNode;
  /** Drawn last — over everything. */
  overlay?: ReactNode;
  ariaLabel?: string;
  className?: string;
  style?: CSSProperties;
}

interface Metrics {
  /** Total length of the path, in viewBox units. */
  length: number;
  /** Width of one `unit` of text at its natural metrics. */
  unitWidth: number;
  reps: number;
}

const TextLoop: React.FC<TextLoopProps> = ({
  text = "Sellr",
  path,
  viewBox = { w: 1200, h: 520 },
  preserveAspectRatio = "xMidYMid meet",
  speed = 90,
  direction = "forward",
  separator = "✦",
  fitToPath = true,
  fontSize = 46,
  fontWeight = 800,
  letterSpacing = 2,
  uppercase = false,
  color = "#ffffff",
  ribbon = true,
  ribbonColor = "#5227FF",
  ribbonWidth = 86,
  pauseOnHover = false,
  textClassName = "",
  defs,
  underlay,
  overlay,
  ariaLabel,
  className = "",
  style = {},
}) => {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const pathRef = useRef<SVGPathElement | null>(null);
  const measureRef = useRef<SVGTextElement | null>(null);
  const headRef = useRef<SVGTextPathElement | null>(null);
  const tailRef = useRef<SVGTextPathElement | null>(null);

  const [metrics, setMetrics] = useState<Metrics>({ length: 0, unitWidth: 0, reps: 1 });

  // useId can contain colons, which are legal in an id but awkward in a URL
  // fragment — strip them so href="#…" resolves everywhere.
  const pathId = `text-loop-${useId().replace(/:/g, "")}`;

  const unit = useMemo(() => {
    const base = uppercase ? String(text).toUpperCase() : String(text);
    const gap = separator ? `\u00A0${separator}\u00A0` : "\u00A0\u00A0\u00A0";
    return `${base}${gap}`;
  }, [text, separator, uppercase]);

  const textStyle = useMemo<CSSProperties>(
    () => ({ fontSize: `${fontSize}px`, fontWeight, letterSpacing: `${letterSpacing}px` }),
    [fontSize, fontWeight, letterSpacing]
  );

  useLayoutEffect(() => {
    const pathEl = pathRef.current;
    const measureEl = measureRef.current;
    if (!pathEl || !measureEl) return undefined;

    let cancelled = false;

    const measure = () => {
      if (cancelled) return;
      let length = 0;
      let unitWidth = 0;
      try {
        length = pathEl.getTotalLength();
        unitWidth = measureEl.getComputedTextLength();
      } catch {
        return;
      }
      if (!length || !unitWidth) return;

      // Fitted: round to the nearest whole repetition, then textLength absorbs
      // the remainder. Unfitted: overshoot by a full unit so the string still
      // covers the path end once it has slid forward by one cycle.
      const reps = fitToPath
        ? Math.max(1, Math.round(length / unitWidth))
        : Math.max(2, Math.ceil((length + unitWidth) / unitWidth));

      setMetrics(prev =>
        prev.length === length && prev.unitWidth === unitWidth && prev.reps === reps
          ? prev
          : { length, unitWidth, reps }
      );
    };

    measure();
    // First paint can measure fallback metrics; the webfont landing changes the
    // unit width, and a stale width is exactly what puts a seam in the loop.
    if (typeof document !== "undefined" && document.fonts?.ready) {
      document.fonts.ready.then(measure).catch(() => {});
    }

    return () => {
      cancelled = true;
    };
  }, [path, unit, fontSize, fontWeight, letterSpacing, fitToPath]);

  useEffect(() => {
    const { length, unitWidth } = metrics;
    const head = headRef.current;
    if (!head || !length) return undefined;

    // The content is periodic in `period`, so sliding forward by exactly that
    // lands on an identical frame.
    const period = fitToPath ? length : unitWidth;
    if (!period) return undefined;

    const apply = (offset: number) => {
      head.setAttribute("startOffset", String(offset));
      const tail = tailRef.current;
      if (tail) tail.setAttribute("startOffset", String(offset >= 0 ? offset - period : offset + period));
    };

    apply(0);

    const prefersReduced =
      typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced || speed <= 0) return undefined;

    const state = { offset: 0 };
    const tween = gsap.to(state, {
      offset: direction === "reverse" ? -period : period,
      duration: period / speed,
      ease: "none",
      repeat: -1,
      onUpdate: () => apply(state.offset),
    });

    const root = rootRef.current;
    const pause = () => tween.pause();
    const resume = () => tween.resume();

    if (pauseOnHover && root) {
      root.addEventListener("pointerenter", pause);
      root.addEventListener("pointerleave", resume);
    }

    return () => {
      tween.kill();
      if (pauseOnHover && root) {
        root.removeEventListener("pointerenter", pause);
        root.removeEventListener("pointerleave", resume);
      }
    };
  }, [metrics, speed, direction, pauseOnHover, fitToPath]);

  const loopText = unit.repeat(metrics.reps);
  const fitLength = fitToPath ? metrics.length || undefined : undefined;

  const textRun = (ref: React.RefObject<SVGTextPathElement | null>) => (
    <text
      className={textClassName}
      style={textStyle}
      fill={color}
      dominantBaseline="central"
      aria-hidden="true"
    >
      <textPath
        ref={ref}
        href={`#${pathId}`}
        startOffset={0}
        textLength={fitLength}
        lengthAdjust={fitToPath ? "spacing" : undefined}
      >
        {loopText}
      </textPath>
    </text>
  );

  return (
    <div
      ref={rootRef}
      className={className}
      style={{ width: "100%", height: "100%", ...style }}
      aria-hidden={ariaLabel ? undefined : true}
      role={ariaLabel ? undefined : "presentation"}
    >
      <svg
        viewBox={`0 0 ${viewBox.w} ${viewBox.h}`}
        preserveAspectRatio={preserveAspectRatio}
        style={{ display: "block", width: "100%", height: "100%", overflow: "visible" }}
        role={ariaLabel ? "img" : undefined}
        aria-label={ariaLabel}
        fill="none"
      >
        <defs>
          {defs}
          {/* Geometry only — the visible band is stroked separately below so the
              two can carry different paint without duplicating the `d`. */}
          <path id={pathId} d={path} />
        </defs>

        {underlay}

        <path
          ref={pathRef}
          d={path}
          fill="none"
          stroke={ribbon ? ribbonColor : "none"}
          strokeWidth={ribbon ? ribbonWidth : 0}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Unconstrained twin: glyphs that fall off a path's ends are dropped,
            so measuring the textPath itself under-reports the unit width. */}
        <text
          ref={measureRef}
          className={textClassName}
          style={textStyle}
          x={0}
          y={-9999}
          visibility="hidden"
          aria-hidden="true"
        >
          {unit}
        </text>

        {textRun(headRef)}
        {/* The trailing twin only earns its cost in fitted mode; unfitted, the
            head already overshoots the path end. */}
        {fitToPath && textRun(tailRef)}

        {overlay}
      </svg>
    </div>
  );
};

export default TextLoop;