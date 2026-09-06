/**
 * Optical line sizing for the persona heroes' display headlines.
 *
 * Both heroes set their headline as LINES, not inline segments, because each
 * line is sized toward a COMMON MEASURE — longer line, smaller type — so the
 * lines fuse into one mass instead of reading as text with a ragged edge. You
 * cannot do that with a single font-size and spans; each line needs its own
 * size, and each size has to be derived from the line's own length.
 *
 * Container units, not `vw`. The headline block's width is capped by a
 * `max-w`, so past that cap a vw-based size keeps growing while the box it is
 * meant to be filling stops — on a wide monitor the type sizes past its own
 * wrapper. `cqw` measures the thing the type is actually fitted to, which also
 * means the relationship holds at every width with no resize listener and no
 * breakpoints. The caller must therefore set `container-type: inline-size` on
 * the headline's wrapper, or every `cqw` here resolves against the viewport.
 *
 * The formula is just `len × charEm × size = 100cqw` solved for size, where
 * charEm is the display face's average mixed-case advance.
 *
 * ONE DRIVER, PROPORTIONAL LINES, and that is the part worth not
 * re-discovering: clamping each line independently looks equivalent and is
 * not. As soon as the ceiling binds, every line lands on the ceiling, they all
 * come out the same size, and the block collapses back into ragged text — the
 * exact look this exists to avoid. Scaling every line as a RATIO of one
 * clamped driver keeps them on a shared measure whether the binding constraint
 * is the container width, a height budget, or the hard ceiling.
 */

export interface HeadlineLine {
  text: string;
  /** Carries the band-and-dot emphasis treatment. */
  highlight?: boolean;
}

export interface OpticalScaleOptions {
  /** Average mixed-case advance of the display face, in em. */
  charEm?: number;
  /** Floor for the driver. Fat faces clog below ~30px: counters fill in and
   *  hairline serifs vanish, so on a phone the optical variation is
   *  deliberately given up to keep the type legible. */
  floorPx?: number;
  /** Hard ceiling for the driver. */
  capPx?: number;
  /** Line-height the caller applies. Only used to report `h1Factor`. */
  leading?: number;
  /** Name of a custom property carrying a height-derived ceiling, for callers
   *  whose headline has to fit a measured vertical budget. Folded into the
   *  driver as a `min()`, so whichever ceiling is lower wins. */
  capVar?: string;
}

export interface OpticalScale {
  /** CSS `font-size` value for line `i`. */
  lineSize: (index: number) => string;
  /** Height of the whole headline as a multiple of the driver size. A caller
   *  with a height budget divides by this to get the ceiling to pass as
   *  `capVar`, which is what keeps the budget derived from the copy rather
   *  than hardcoded against it. */
  h1Factor: number;
}

export function opticalScale(
  lines: readonly HeadlineLine[],
  { charEm = 0.5, floorPx = 30, capPx = 84, leading = 0.94, capVar }: OpticalScaleOptions = {}
): OpticalScale {
  const lineCqw = lines.map((l) => 100 / (charEm * l.text.length));
  const maxCqw = Math.max(...lineCqw);
  const ceiling = capVar
    ? `min(${maxCqw.toFixed(2)}cqw, var(${capVar}))`
    : `${maxCqw.toFixed(2)}cqw`;
  const driver = `clamp(${floorPx}px, ${ceiling}, ${capPx}px)`;

  return {
    lineSize: (i) => `calc(${(lineCqw[i] / maxCqw).toFixed(4)} * ${driver})`,
    h1Factor: lineCqw.reduce((sum, c) => sum + c / maxCqw, 0) * leading,
  };
}
