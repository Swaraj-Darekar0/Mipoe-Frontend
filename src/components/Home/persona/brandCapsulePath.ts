/**
 * Pure geometry helpers for generating curved cylindrical capsule outlines and
 * oriented guide paths that bend with ribbon curvature.
 *
 * The capsule outline is a true cylinder:
 * - Upper and lower boundary rails offset by ± halfHeight along ribbon normals.
 * - Convex semi-circular end caps that arc outward from the capsule body,
 *   guaranteeing a clean rounded cylinder shape without inversion or pinched chevrons.
 *
 * The centerline guide path is oriented left-to-right (reading order), ensuring
 * text rendered on `<textPath>` always flows naturally and bends with the curve
 * while remaining right-side up.
 */

export interface PathSamples {
  xs: Float32Array;
  ys: Float32Array;
  angles: Float32Array;
  res: number;
  totalLength: number;
}

export interface CapsuleGuide {
  d: string;
  thumbX: number;
  thumbY: number;
  thumbAngle: number;
}

const r1 = (n: number): number => Math.round(n * 10) / 10;

/**
 * Generates an SVG path string for a true cylindrical capsule around center position `s`.
 * Both end caps are mathematically guaranteed to bulge outward in the tangent/normal frame.
 */
export function buildCurvedCapsuleD(
  samples: PathSamples,
  centerS: number,
  length: number,
  height: number,
  steps: number = 8
): string {
  const { xs, ys, angles, res, totalLength } = samples;
  const bodyLen = Math.max(height * 0.4, length - height);
  const halfLen = bodyLen / 2;
  const halfH = height / 2;

  const upper: Array<[number, number]> = [];
  const lower: Array<[number, number]> = [];
  const pts: Array<{ x: number; y: number; rad: number }> = [];

  const stepSize = bodyLen / (steps - 1);
  const maxIdx = xs.length - 1;

  for (let i = 0; i < steps; i++) {
    const currS = Math.max(0, Math.min(totalLength, centerS - halfLen + i * stepSize));
    const k = Math.min(maxIdx, Math.max(0, Math.round(currS / res)));

    const x = xs[k];
    const y = ys[k];
    const rad = (angles[k] * Math.PI) / 180;
    pts.push({ x, y, rad });

    // Unit normal: tangent = (cos(rad), sin(rad)), normal = (-sin(rad), cos(rad))
    const nx = -Math.sin(rad);
    const ny = Math.cos(rad);

    upper.push([r1(x + nx * halfH), r1(y + ny * halfH)]);
    lower.push([r1(x - nx * halfH), r1(y - ny * halfH)]);
  }

  if (upper.length < 2) return "";

  // 1. Front cap: semi-circle around front tip (pts[steps - 1])
  // Arcs from upper rail (phi = pi/2) through tip (+T * halfH, phi = 0) to lower rail (phi = -pi/2).
  // Because cos(phi) >= 0 for phi in [-pi/2, pi/2], it ALWAYS bulges outward in direction of +T!
  const front = pts[steps - 1];
  const tx_f = Math.cos(front.rad);
  const ty_f = Math.sin(front.rad);
  const nx_f = -Math.sin(front.rad);
  const ny_f = Math.cos(front.rad);

  const frontCap: Array<[number, number]> = [];
  const capSteps = 6;
  for (let s = 1; s < capSteps; s++) {
    const phi = Math.PI / 2 - s * (Math.PI / capSteps);
    const c = Math.cos(phi);
    const sn = Math.sin(phi);
    frontCap.push([
      r1(front.x + (tx_f * c + nx_f * sn) * halfH),
      r1(front.y + (ty_f * c + ny_f * sn) * halfH),
    ]);
  }

  // 2. Rear cap: semi-circle around rear tip (pts[0])
  // Arcs from lower rail (phi = -pi/2) through rear tip (-T * halfH, phi = -pi) to upper rail (phi = -3pi/2).
  // It ALWAYS bulges outward in direction of -T!
  const rear = pts[0];
  const tx_0 = Math.cos(rear.rad);
  const ty_0 = Math.sin(rear.rad);
  const nx_0 = -Math.sin(rear.rad);
  const ny_0 = Math.cos(rear.rad);

  const rearCap: Array<[number, number]> = [];
  for (let s = 1; s < capSteps; s++) {
    const phi = -Math.PI / 2 - s * (Math.PI / capSteps);
    const c = Math.cos(phi);
    const sn = Math.sin(phi);
    rearCap.push([
      r1(rear.x + (tx_0 * c + nx_0 * sn) * halfH),
      r1(rear.y + (ty_0 * c + ny_0 * sn) * halfH),
    ]);
  }

  // Assemble full closed path
  let d = `M ${upper[0][0]} ${upper[0][1]}`;
  for (let i = 1; i < upper.length; i++) {
    d += ` L ${upper[i][0]} ${upper[i][1]}`;
  }
  for (const p of frontCap) {
    d += ` L ${p[0]} ${p[1]}`;
  }
  for (let i = lower.length - 1; i >= 0; i--) {
    d += ` L ${lower[i][0]} ${lower[i][1]}`;
  }
  for (const p of rearCap) {
    d += ` L ${p[0]} ${p[1]}`;
  }
  d += " Z";

  return d;
}

/**
 * Builds an oriented centerline path for SVG `<textPath>` so text inside the capsule
 * bends with ribbon curvature while remaining right-side up (reading left-to-right).
 */
export function buildCapsuleCenterline(
  samples: PathSamples,
  centerS: number,
  length: number,
  height: number,
  steps: number = 7
): CapsuleGuide {
  const { xs, ys, res, totalLength } = samples;
  const bodyLen = Math.max(height * 0.4, length - height);
  const halfLen = bodyLen / 2;
  const stepSize = bodyLen / (steps - 1);
  const maxIdx = xs.length - 1;

  const pts: Array<{ x: number; y: number }> = [];
  for (let i = 0; i < steps; i++) {
    // Option 1: Sample along continuous physical direction from leading front to trailing rear
    const currS = Math.max(0, Math.min(totalLength, centerS + halfLen - i * stepSize));
    const k = Math.min(maxIdx, Math.max(0, Math.round(currS / res)));
    pts.push({ x: xs[k], y: ys[k] });
  }

  let d = `M ${r1(pts[0].x)} ${r1(pts[0].y)}`;
  for (let i = 1; i < pts.length; i++) {
    d += ` L ${r1(pts[i].x)} ${r1(pts[i].y)}`;
  }

  // Thumbnail anchor point on visual front/leading end of capsule
  const p0 = pts[0];
  const p1 = pts[1] || pts[0];
  const tdx = p1.x - p0.x;
  const tdy = p1.y - p0.y;
  const thumbAngle = (Math.atan2(tdy, tdx) * 180) / Math.PI;

  const thumbX = r1(p0.x);
  const thumbY = r1(p0.y);

  return {
    d,
    thumbX,
    thumbY,
    thumbAngle,
  };
}
