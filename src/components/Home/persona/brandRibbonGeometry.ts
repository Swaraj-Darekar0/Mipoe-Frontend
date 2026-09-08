export type Anchor = readonly [number, number];

export interface BrandScene {
  vbW: number;
  vbH: number;
  anchors: readonly Anchor[];
  payoutAnchors: readonly Anchor[];
  band: number;
  capsule: { w: number; h: number; gap: number };
  fontSize: number;
  payoutFontSize: number;
  speed: number;
  pill: { cx: number; cy: number; w: number; h: number; fontSize: number };
  character: { cx: number; bottom: number; width: number };
  hint: { x: number; y: number };
}

/**
 * Desktop Brand Scene (Horizontal mirror of CreatorRibbon, right-to-left travel).
 */
export const DESKTOP_BRAND_SCENE: BrandScene = {
  vbW: 1200,
  vbH: 580,
  anchors: [
    // 1. Right input tail
    [2900, 462],
    [2300, 456],
    [1800, 448],
    [1440, 436],
    [1180, 422],
    [1074, 408],
    // 2. Climbs outer/left flank of right-side loop
    [994, 386],
    [928, 338],
    [900, 268],
    // 3. Loop crown — tall teardrop
    [904, 190],
    [942, 132],
    [1006, 106],
    [1078, 126],
    [1120, 186],
    // 4. Descending flank — crossing
    [1134, 256],
    [1124, 326],
    [1090, 388],
    // 5. Down to floor
    [1030, 438],
    [938, 474],
    [830, 494],
    // 6. Flat lower run through the sellr. pill at (600, 508)
    [714, 506],
    [600, 509],
    [460, 508],
    // 7. Output segment continuing off-canvas left
    [320, 500],
    [170, 484],
    [-20, 456],
    [-300, 414],
    [-750, 348],
    [-1200, 284],
  ],
  payoutAnchors: [
    [-1200, 284],
    [-750, 348],
    [-300, 414],
    [-20, 456],
    [170, 484],
    [320, 500],
    [460, 508],
    [600, 509],
  ],
  band: 44,
  capsule: { w: 156, h: 34, gap: 38 },
  fontSize: 12,
  payoutFontSize: 21,
  speed: 40,
  pill: { cx: 600, cy: 508, w: 160, h: 56, fontSize: 24 },
  character: { cx: 600, bottom: 504, width: 250 },
  hint: { x: 600, y: 440 },
};

/**
 * Compact / Mobile Brand Scene (< 1024px).
 */
export const COMPACT_BRAND_SCENE: BrandScene = {
  vbW: 420,
  vbH: 400,
  anchors: [
    [1020, 176],
    [720, 172],
    [510, 166],
    [394, 156],
    [328, 134],
    [276, 100],
    [260, 60],
    [274, 24],
    [320, 10],
    [364, 28],
    [382, 68],
    [382, 110],
    [364, 146],
    [336, 174],
    [322, 212],
    [324, 252],
    [338, 292],
    [346, 322],
    [326, 348],
    [288, 362],
    [224, 370],
    [190, 372],
    [120, 371],
    [40, 367],
    [-140, 358],
    [-400, 336],
    [-830, 296],
  ],
  payoutAnchors: [
    [-830, 296],
    [-400, 336],
    [-140, 358],
    [40, 367],
    [120, 371],
    [190, 372],
  ],
  band: 40,
  capsule: { w: 124, h: 28, gap: 28 },
  fontSize: 10,
  payoutFontSize: 14,
  speed: 26,
  pill: { cx: 190, cy: 371, w: 114, h: 44, fontSize: 18 },
  character: { cx: 190, bottom: 372, width: 290 },
  hint: { x: 190, y: 326 },
};

export const smoothPath = (pts: readonly Anchor[]): string => {
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
