/**
 * The lanyard's size and drop, in one place.
 *
 * These numbers are needed twice, in two different languages: Lanyard reads them
 * to scale the card and derive the rope length in WORLD units, and HeroBrand
 * reads them to work out where the card's top edge lands in CSS so the copy
 * above it can be given the leftover room. Keeping them here is what stops the
 * two from drifting: the hero used to hardcode `0.2344` for half the card's
 * height, which was correct only for the exact card size Lanyard happened to be
 * using that day.
 *
 * Everything is a FRACTION of the viewport rather than a pixel size, because the
 * card has to hold its proportion from a 360px phone to a 1920px monitor.
 */

/**
 * Card height divided by card width, from the GLB's `card` mesh.
 *
 * Lanyard asserts this against the real mesh in dev (see `assertCardAspect`),
 * because it cannot be measured here: HeroBrand needs it at module scope to
 * build a CSS expression, long before the GLB has loaded.
 */
export const CARD_ASPECT = 1.40625;

/**
 * How far ABOVE the top of the frame the strap's fixed point is parked, in world
 * units. Enough that dpr rounding can never expose the top vertex, small enough
 * to cost no visible strap length. See `anchorY` in Lanyard for why it has to be
 * outside the frame at all.
 */
export const ANCHOR_OVERSHOOT = 0.25;

/**
 * How far the card hangs, and the two layouts genuinely need different answers.
 *
 * `solve` works backwards from where the card should END UP: the card's own
 * scaled offsets already carry it roughly 1.2 card-heights below the last rope
 * node, so the rope only makes up the remainder. That is what keeps a phone's
 * card in the free space under the CTA whatever size the screen is.
 *
 * `fraction` is an EMPIRICAL knob, not an exact target. The `2.7 * k` term below
 * models the card's offsets, and measuring the rendered result shows it
 * over-predicts the drop (the rope joints are maximum distances, so the chain
 * does not always hang fully taut). Nudge it and re-look; do not compute it.
 *
 * `rope` sets the length directly, and is what md+ uses. Solving is the wrong
 * tool there: the card is big enough at that size that its own offsets pay for
 * most of the drop, so the solved remainder collapses to almost nothing, the
 * strap shrinks to a stub, and the four curve points get close enough together
 * that the meshline starts generating degenerate segments. A fixed length in
 * WORLD units is still adaptive to viewport height (world units are a constant
 * share of the frame) and it keeps a real strap on screen.
 */
type CardDrop =
  | {
      kind: "solve";
      fraction: number;
      /**
       * Where the card's centre ACTUALLY lands, as a fraction of viewport
       * height, for anyone who needs to lay out around it.
       *
       * `fraction` is the number fed to the solver and it over-states the drop,
       * so it cannot be used for layout: trusting it left only ~20px between the
       * CTA and the card on a 360x640. This is the measured answer, off rendered
       * output at 360x640 and 390x844, where it predicts the card's top edge to
       * within 5px. Re-measure it if `fraction`, the card size, or the damping
       * changes.
       */
      measuredFraction: number;
    }
  | { kind: "rope"; length: number };

interface CardGeometry {
  /** Card width as a fraction of viewport width. */
  widthFraction: number;
  /** Ceiling on card height as a fraction of viewport height. */
  heightFraction: number;
  drop: CardDrop;
}

/**
 * Two sizings, and the two constraints trade places between them.
 *
 * On a phone the card hangs BELOW the copy, so width is what is plentiful and
 * height is what is scarce: the width fraction leads and the height fraction is
 * the guard that stops a tall narrow screen from growing the card into the CTA.
 *
 * At md+ the card hangs BESIDE the copy in the right half, so height leads (the
 * card can be as tall as the viewport affords) and the width fraction is the
 * guard that stops a portrait tablet from shrinking it to a stamp.
 *
 * Both fractions are up ~20% on what they were, which is the "make it bigger"
 * part: the card was 1/3 of the breadth on a phone and a flat 6.8 world units at
 * md+, which came out cramped on a wide monitor.
 */
export const CARD_GEOMETRY: Record<"mobile" | "desktop", CardGeometry> = {
  mobile: {
    widthFraction: 0.4,
    heightFraction: 0.34,
    drop: { kind: "solve", fraction: 0.78, measuredFraction: 0.68 },
  },
  desktop: {
    widthFraction: 0.34,
    heightFraction: 0.4,
    // 2.1 rather than the old 2.3: the card is bigger now, so its own offsets
    // carry it further down, and the shorter rope hands that back. Measured at
    // 1440x900, this puts the card's top edge within a few px of where the
    // smaller card used to sit while the card itself is ~27% larger.
    drop: { kind: "rope", length: 2.1 },
  },
};

/**
 * Card width, in whatever unit `viewportWidth` and `viewportHeight` are given
 * in. Lanyard passes world units; the CSS builder below passes fractions.
 */
export const cardWidth = (
  geometry: CardGeometry,
  viewportWidth: number,
  viewportHeight: number
): number =>
  Math.min(
    geometry.widthFraction * viewportWidth,
    (geometry.heightFraction * viewportHeight) / CARD_ASPECT
  );

/**
 * Where the card's TOP edge lands below md, as a CSS length.
 *
 * The same `min()` as `cardWidth`, expressed in viewport units so CSS can
 * evaluate it per-viewport with no measuring and no resize listener. Only the
 * mobile sizing is offered, because it is the only layout where the card sits
 * beneath the copy and therefore the only one where the copy needs to know.
 */
export function mobileCardTopCss(): string {
  const { widthFraction, heightFraction, drop } = CARD_GEOMETRY.mobile;
  if (drop.kind !== "solve") {
    throw new Error("mobileCardTopCss expects the mobile card to use a solved drop");
  }
  const width = `min(${widthFraction} * 100vw, ${(heightFraction / CARD_ASPECT).toFixed(4)} * 100svh)`;
  // `measuredFraction`, NOT `fraction`: the solver's input over-states the drop,
  // so building the copy's band from it hands the copy room the card is actually
  // occupying. See CardDrop.
  return `calc(${drop.measuredFraction} * 100svh - ${(CARD_ASPECT / 2).toFixed(4)} * ${width})`;
}

/**
 * Dev-only guard for CARD_ASPECT. The constant above is duplicated knowledge
 * about a binary asset, which is exactly the kind of thing that rots silently
 * when someone swaps the model, so Lanyard calls this once the GLB is in.
 */
export function assertCardAspect(measured: number): void {
  if (import.meta.env.PROD) return;
  if (Math.abs(measured - CARD_ASPECT) / CARD_ASPECT > 0.02) {
    console.warn(
      `[lanyardGeometry] CARD_ASPECT is ${CARD_ASPECT} but card.glb measures ` +
        `${measured.toFixed(4)}. HeroBrand sizes its copy against the constant, ` +
        `so update it or the hero's spacing will be wrong.`
    );
  }
}
