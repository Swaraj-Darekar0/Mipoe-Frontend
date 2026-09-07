// C:/Users/Swaraj/.gemini/antigravity/brain/ff27d34a-fa4f-4480-9bcc-dd9fc2cbfa56/scratch/generate_3d_companion.ts
import fs from "fs";

// src/avatar/core/surfaces.ts
var signedPower = (value, exponent) => Math.sign(value) * Math.abs(value) ** exponent;
var superellipsoid = (longitude, latitude, width, height, depth, verticalExponent, horizontalExponent) => {
  const latitudeCosine = signedPower(Math.cos(latitude), verticalExponent);
  return [
    width / 2 * latitudeCosine * signedPower(Math.sin(longitude), horizontalExponent),
    height / 2 * signedPower(Math.sin(latitude), verticalExponent),
    depth / 2 * latitudeCosine * signedPower(Math.cos(longitude), horizontalExponent)
  ];
};
var capsule = (config, longitude, latitude) => {
  const radiusX = config.width / 2;
  const radiusZ = config.depth / 2;
  const capRadius = Math.min(radiusX, config.height / 2);
  const straightHalf = Math.max(0, (config.height - capRadius * 2) / 2);
  const meridianLength = straightHalf * 2 + Math.PI * capRadius;
  const distance = (latitude + Math.PI / 2) / Math.PI * meridianLength;
  let radial = radiusX;
  let y = 0;
  if (distance < Math.PI * capRadius / 2) {
    const angle = -Math.PI / 2 + distance / capRadius;
    radial = radiusX * Math.cos(angle);
    y = -straightHalf + capRadius * Math.sin(angle);
  } else if (distance <= Math.PI * capRadius / 2 + straightHalf * 2) {
    y = -straightHalf + distance - Math.PI * capRadius / 2;
  } else {
    const angle = (distance - Math.PI * capRadius / 2 - straightHalf * 2) / capRadius;
    radial = radiusX * Math.cos(angle);
    y = straightHalf + capRadius * Math.sin(angle);
  }
  const depthScale = radiusX ? radiusZ / radiusX : 1;
  return [radial * Math.sin(longitude), y, radial * depthScale * Math.cos(longitude)];
};
var clampRoundness = (roundness) => Math.max(0, Math.min(2, roundness ?? 0));
var diamondExponent = (config) => 1 + clampRoundness(config.roundness) / 2;
var MIN_CUBE_SURFACE_POWER = 0.04;
var cubeExponent = (config) => {
  if (config.roundness <= 0) return Infinity;
  const surfacePower = MIN_CUBE_SURFACE_POWER + clampRoundness(config.roundness) / 2 * (1 - MIN_CUBE_SURFACE_POWER);
  return 2 / surfacePower;
};
var lpSurface = (config, longitude, latitude, exponent) => {
  const sphereX = Math.cos(latitude) * Math.sin(longitude);
  const sphereY = Math.sin(latitude);
  const sphereZ = Math.cos(latitude) * Math.cos(longitude);
  const length = Number.isFinite(exponent) ? (Math.abs(sphereX) ** exponent + Math.abs(sphereY) ** exponent + Math.abs(sphereZ) ** exponent) ** (1 / exponent) || 1 : Math.max(Math.abs(sphereX), Math.abs(sphereY), Math.abs(sphereZ)) || 1;
  return [
    config.width / 2 * (sphereX / length),
    config.height / 2 * (sphereY / length),
    config.depth / 2 * (sphereZ / length)
  ];
};
var diamond = (config, longitude, latitude) => {
  return lpSurface(config, longitude, latitude, diamondExponent(config));
};
var cube = (config, longitude, latitude) => lpSurface(config, longitude, latitude, cubeExponent(config));
var MAX_CONE_TIP_FRACTION = 0.24;
var MAX_CONE_BASE_FRACTION = 0.2;
var MAX_CYLINDER_EDGE_FRACTION = 0.22;
var morphProgress = (config) => clampRoundness(config.morphRoundness) / 2;
var morphProfileToEllipsoid = (config, progress, profile) => {
  const amount = morphProgress(config);
  const clampedProgress = Math.max(0, Math.min(1, progress));
  const ellipsoidRadius = Math.sin(clampedProgress * Math.PI);
  const ellipsoidVerticalProgress = (1 - Math.cos(clampedProgress * Math.PI)) / 2;
  return {
    radiusScale: profile.radiusScale + (ellipsoidRadius - profile.radiusScale) * amount,
    verticalProgress: profile.verticalProgress + (ellipsoidVerticalProgress - profile.verticalProgress) * amount
  };
};
var cubic = (start, firstControl, secondControl, end, progress) => {
  const inverse = 1 - progress;
  return inverse ** 3 * start + 3 * inverse * inverse * progress * firstControl + 3 * inverse * progress * progress * secondControl + progress ** 3 * end;
};
var coneRounding = (config) => ({
  tipFraction: (config.tipRoundness ?? 0) * MAX_CONE_TIP_FRACTION,
  baseFraction: (config.baseRoundness ?? 0) * MAX_CONE_BASE_FRACTION
});
var cylinderProfileAt = (config, progress) => {
  const clampedProgress = Math.max(0, Math.min(1, progress));
  const edgeFraction = config.roundness * MAX_CYLINDER_EDGE_FRACTION;
  if (edgeFraction <= 0) {
    return {
      radiusScale: 1,
      verticalProgress: (Math.sin((clampedProgress - 0.5) * Math.PI) + 1) / 2
    };
  }
  if (clampedProgress < edgeFraction) {
    const angle = -Math.PI / 2 + clampedProgress / edgeFraction * (Math.PI / 2);
    return {
      radiusScale: 1 - edgeFraction + edgeFraction * Math.cos(angle),
      verticalProgress: (edgeFraction + edgeFraction * Math.sin(angle)) / 2
    };
  }
  if (clampedProgress > 1 - edgeFraction) {
    const angle = (clampedProgress - (1 - edgeFraction)) / edgeFraction * (Math.PI / 2);
    return {
      radiusScale: 1 - edgeFraction + edgeFraction * Math.cos(angle),
      verticalProgress: 1 - edgeFraction / 2 + edgeFraction * Math.sin(angle) / 2
    };
  }
  const middleProgress = (clampedProgress - edgeFraction) / (1 - edgeFraction * 2);
  return {
    radiusScale: 1,
    verticalProgress: edgeFraction / 2 + middleProgress * (1 - edgeFraction)
  };
};
var morphedCylinderProfileAt = (config, progress) => morphProfileToEllipsoid(config, progress, cylinderProfileAt(config, progress));
var radiusScaleAtVerticalProgress = (config, verticalProgress, profileAt) => {
  const progress = Math.max(0, Math.min(1, verticalProgress));
  let lower = 0;
  let upper = 1;
  for (let iteration = 0; iteration < 14; iteration += 1) {
    const candidate = (lower + upper) / 2;
    if (profileAt(config, candidate).verticalProgress < progress) lower = candidate;
    else upper = candidate;
  }
  return profileAt(config, (lower + upper) / 2).radiusScale;
};
var coneProfileAt = (config, progress) => {
  const clampedProgress = Math.max(0, Math.min(1, progress));
  const { tipFraction, baseFraction } = coneRounding(config);
  if (baseFraction > 0 && clampedProgress < baseFraction) {
    const curveProgress = clampedProgress / baseFraction;
    return {
      radiusScale: cubic(
        1 - baseFraction,
        1,
        1 - baseFraction / 2,
        1 - baseFraction,
        curveProgress
      ),
      verticalProgress: cubic(0, 0, baseFraction / 2, baseFraction, curveProgress)
    };
  }
  if (tipFraction > 0 && clampedProgress > 1 - tipFraction) {
    const curveProgress = (clampedProgress - (1 - tipFraction)) / tipFraction;
    return {
      radiusScale: cubic(tipFraction, tipFraction / 2, tipFraction / 4, 0, curveProgress),
      verticalProgress: cubic(1 - tipFraction, 1 - tipFraction / 2, 1, 1, curveProgress)
    };
  }
  return {
    radiusScale: 1 - clampedProgress,
    verticalProgress: clampedProgress
  };
};
var morphedConeProfileAt = (config, progress) => morphProfileToEllipsoid(config, progress, coneProfileAt(config, progress));
var cursorLayout = (config) => {
  const coneHeight = config.height * 0.36;
  const bodyHeight = config.height - coneHeight;
  return {
    coneApexY: -config.height / 2,
    coneBaseY: -config.height / 2 + coneHeight,
    bodyHeight,
    bodyCenterY: config.height / 2 - bodyHeight / 2,
    bodyWidth: config.width * 0.54,
    bodyDepth: config.depth * 0.62
  };
};
var surfacePointAt = (config, longitude, latitude) => {
  const { width, height, depth } = config;
  switch (config.type) {
    case "sphere":
    case "mickey":
      return superellipsoid(longitude, latitude, width, height, depth, 1, 1);
    case "cube":
      return cube(config, longitude, latitude);
    case "cylinder": {
      const progress = (latitude + Math.PI / 2) / Math.PI;
      const profile = morphedCylinderProfileAt(config, progress);
      return [
        width / 2 * profile.radiusScale * Math.sin(longitude),
        -height / 2 + height * profile.verticalProgress,
        depth / 2 * profile.radiusScale * Math.cos(longitude)
      ];
    }
    case "cursor": {
      const layout = cursorLayout(config);
      const progress = (latitude + Math.PI / 2) / Math.PI;
      const bodyConfig = {
        ...config,
        width: layout.bodyWidth,
        height: layout.bodyHeight,
        depth: layout.bodyDepth
      };
      const profile = cylinderProfileAt(bodyConfig, progress);
      return [
        layout.bodyWidth / 2 * profile.radiusScale * Math.sin(longitude),
        layout.bodyCenterY - layout.bodyHeight / 2 + layout.bodyHeight * profile.verticalProgress,
        layout.bodyDepth / 2 * profile.radiusScale * Math.cos(longitude)
      ];
    }
    case "diamond":
      return diamond(config, longitude, latitude);
    case "capsule":
      return capsule(config, longitude, latitude);
    case "cone": {
      const progress = (latitude + Math.PI / 2) / Math.PI;
      const profile = morphedConeProfileAt(config, progress);
      return [
        width / 2 * profile.radiusScale * Math.sin(longitude),
        height / 2 - height * profile.verticalProgress,
        depth / 2 * profile.radiusScale * Math.cos(longitude)
      ];
    }
  }
};
var normalize = ([x, y, z]) => {
  const length = Math.hypot(x, y, z) || 1;
  return [x / length, y / length, z / length];
};
var signedMagnitude = (value, exponent) => Math.sign(value) * Math.abs(value) ** exponent;
var lpNormal = (config, point, exponent) => {
  const radiusX = config.width / 2 || 1;
  const radiusY = config.height / 2 || 1;
  const radiusZ = config.depth / 2 || 1;
  return normalize([
    signedMagnitude(point[0] / radiusX, exponent - 1) / radiusX,
    signedMagnitude(point[1] / radiusY, exponent - 1) / radiusY,
    signedMagnitude(point[2] / radiusZ, exponent - 1) / radiusZ
  ]);
};
var diamondNormal = (config, point) => lpNormal(config, point, diamondExponent(config));
var cubeNormal = (config, point) => {
  const exponent = cubeExponent(config);
  if (Number.isFinite(exponent)) return lpNormal(config, point, exponent);
  const normalized = [
    point[0] / (config.width / 2 || 1),
    point[1] / (config.height / 2 || 1),
    point[2] / (config.depth / 2 || 1)
  ];
  const dominantAxis = normalized.reduce(
    (largest, value, index) => Math.abs(value) > Math.abs(normalized[largest]) ? index : largest,
    0
  );
  const normal = [
    dominantAxis === 0 ? Math.sign(normalized[0]) : 0,
    dominantAxis === 1 ? Math.sign(normalized[1]) : 0,
    dominantAxis === 2 ? Math.sign(normalized[2]) : 0
  ];
  return normal;
};
var lpFrontSample = (config, x, y, exponent, normalAt) => {
  const radiusX = config.width / 2 || 1;
  const radiusY = config.height / 2 || 1;
  const radiusZ = config.depth / 2 || 1;
  if (!Number.isFinite(exponent)) {
    const point2 = [
      Math.max(-radiusX, Math.min(radiusX, x)),
      Math.max(-radiusY, Math.min(radiusY, y)),
      radiusZ
    ];
    return { point: point2, normal: normalAt(config, point2) };
  }
  const normalizedY = Math.max(-1, Math.min(1, y / radiusY));
  const availableX = Math.max(0, 1 - Math.abs(normalizedY) ** exponent) ** (1 / exponent);
  const surfaceX = Math.max(-radiusX * availableX, Math.min(radiusX * availableX, x));
  const normalizedX = surfaceX / radiusX;
  const normalizedZ = Math.max(0, 1 - Math.abs(normalizedX) ** exponent - Math.abs(normalizedY) ** exponent) ** (1 / exponent);
  const point = [surfaceX, normalizedY * radiusY, radiusZ * normalizedZ];
  return { point, normal: normalAt(config, point) };
};
var ellipsoidFrontSample = (x, y, radiusX, radiusY, radiusZ, centerY = 0) => {
  const localY = y - centerY;
  const remaining = Math.max(0, 1 - (x / (radiusX || 1)) ** 2 - (localY / (radiusY || 1)) ** 2);
  const z = radiusZ * Math.sqrt(remaining);
  return {
    point: [x, y, z],
    normal: normalize([
      x / (radiusX * radiusX || 1),
      localY / (radiusY * radiusY || 1),
      z / (radiusZ * radiusZ || 1)
    ])
  };
};
var radialProfileFrontSample = (config, x, y, profileAt, verticalDirection) => {
  const radiusX = config.width / 2 || 1;
  const radiusZ = config.depth / 2 || 1;
  const verticalProgress = Math.max(0, Math.min(1, 0.5 + verticalDirection * (y / config.height)));
  const radialScale = radiusScaleAtVerticalProgress(config, verticalProgress, profileAt);
  const sectionRadiusX = radiusX * radialScale;
  const sectionRadiusZ = radiusZ * radialScale;
  const surfaceX = Math.max(-sectionRadiusX, Math.min(sectionRadiusX, x));
  const remaining = sectionRadiusX > 0 ? Math.max(0, 1 - (surfaceX / sectionRadiusX) ** 2) : 0;
  const z = sectionRadiusZ * Math.sqrt(remaining);
  const derivativeStep = 1e-4;
  const previousProgress = Math.max(0, verticalProgress - derivativeStep);
  const nextProgress = Math.min(1, verticalProgress + derivativeStep);
  const previousScale = radiusScaleAtVerticalProgress(config, previousProgress, profileAt);
  const nextScale = radiusScaleAtVerticalProgress(config, nextProgress, profileAt);
  const scaleDerivative = (nextScale - previousScale) / (nextProgress - previousProgress || 1);
  const radialRemainder = Math.max(Math.sqrt(remaining), 1e-4);
  const depthRatio = radiusZ / radiusX;
  const depthXDerivative = -depthRatio * surfaceX / (sectionRadiusX * radialRemainder || 1);
  const depthYDerivative = verticalDirection * radiusZ * scaleDerivative / (config.height * radialRemainder || 1);
  return {
    point: [surfaceX, y, z],
    normal: normalize([-depthXDerivative, -depthYDerivative, 1])
  };
};
var surfaceFrontSampleAt = (config, x, y) => {
  const radiusX = config.width / 2 || 1;
  const radiusY = config.height / 2 || 1;
  const radiusZ = config.depth / 2 || 1;
  switch (config.type) {
    case "sphere":
    case "mickey":
      return ellipsoidFrontSample(x, y, radiusX, radiusY, radiusZ);
    case "cube":
      return lpFrontSample(config, x, y, cubeExponent(config), cubeNormal);
    case "capsule": {
      const capRadiusY = Math.min(radiusX, radiusY);
      const straightHalf = Math.max(0, radiusY - capRadiusY);
      const capCenterY = y < -straightHalf ? -straightHalf : y > straightHalf ? straightHalf : y;
      return ellipsoidFrontSample(x, y, radiusX, capRadiusY, radiusZ, capCenterY);
    }
    case "cylinder":
      return radialProfileFrontSample(config, x, y, morphedCylinderProfileAt, 1);
    case "cursor": {
      const layout = cursorLayout(config);
      const bodyConfig = {
        ...config,
        width: layout.bodyWidth,
        height: layout.bodyHeight,
        depth: layout.bodyDepth
      };
      const sample = radialProfileFrontSample(
        bodyConfig,
        x,
        y - layout.bodyCenterY,
        cylinderProfileAt,
        1
      );
      return {
        point: [sample.point[0], sample.point[1] + layout.bodyCenterY, sample.point[2]],
        normal: sample.normal
      };
    }
    case "cone":
      return radialProfileFrontSample(config, x, y, morphedConeProfileAt, -1);
    case "diamond":
      return lpFrontSample(config, x, y, diamondExponent(config), diamondNormal);
  }
};

// src/avatar/core/geometry.ts
var FOCAL_LENGTH = 620;
var QUARTER_ARC_SAMPLES = 14;
var radians = (degrees) => degrees * Math.PI / 180;
var normalizeQuaternion = ([w, x, y, z]) => {
  const length = Math.hypot(w, x, y, z) || 1;
  return [w / length, x / length, y / length, z / length];
};
var multiplyQuaternions = ([aw, ax, ay, az], [bw, bx, by, bz]) => normalizeQuaternion([
  aw * bw - ax * bx - ay * by - az * bz,
  aw * bx + ax * bw + ay * bz - az * by,
  aw * by - ax * bz + ay * bw + az * bx,
  aw * bz + ax * by - ay * bx + az * bw
]);
var quaternionFromAxisAngle = ([x, y, z], angle) => {
  const halfAngle = angle / 2;
  const sine = Math.sin(halfAngle);
  return normalizeQuaternion([Math.cos(halfAngle), x * sine, y * sine, z * sine]);
};
var quaternionFromEuler = (x, y, z) => {
  const xRotation = quaternionFromAxisAngle([1, 0, 0], x);
  const yRotation = quaternionFromAxisAngle([0, 1, 0], y);
  const zRotation = quaternionFromAxisAngle([0, 0, 1], z);
  return multiplyQuaternions(multiplyQuaternions(zRotation, xRotation), yRotation);
};
var rotateWithQuaternion = ([w, x, y, z], [px, py, pz]) => {
  const tx = 2 * (y * pz - z * py);
  const ty = 2 * (z * px - x * pz);
  const tz = 2 * (x * py - y * px);
  return [
    px + w * tx + (y * tz - z * ty),
    py + w * ty + (z * tx - x * tz),
    pz + w * tz + (x * ty - y * tx)
  ];
};
var roundedRectangle = (width, height) => {
  const halfWidth = width / 2;
  const halfHeight = height / 2;
  const cornerRadius = Math.min(halfHeight, halfWidth);
  const points = [];
  const addLine = (start, end) => {
    const samples = Math.max(2, Math.ceil(Math.hypot(end[0] - start[0], end[1] - start[1]) / 1.5));
    for (let index = 0; index < samples; index += 1) {
      const progress = index / samples;
      points.push([
        start[0] + (end[0] - start[0]) * progress,
        start[1] + (end[1] - start[1]) * progress
      ]);
    }
  };
  const addArc = (centerX, centerY, startAngle) => {
    for (let index = 0; index < QUARTER_ARC_SAMPLES; index += 1) {
      const angle = startAngle + index / QUARTER_ARC_SAMPLES * (Math.PI / 2);
      points.push([
        centerX + Math.cos(angle) * cornerRadius,
        centerY + Math.sin(angle) * cornerRadius
      ]);
    }
  };
  addLine([-halfWidth + cornerRadius, -halfHeight], [halfWidth - cornerRadius, -halfHeight]);
  addArc(halfWidth - cornerRadius, -halfHeight + cornerRadius, -Math.PI / 2);
  addLine([halfWidth, -halfHeight + cornerRadius], [halfWidth, halfHeight - cornerRadius]);
  addArc(halfWidth - cornerRadius, halfHeight - cornerRadius, 0);
  addLine([halfWidth - cornerRadius, halfHeight], [-halfWidth + cornerRadius, halfHeight]);
  addArc(-halfWidth + cornerRadius, halfHeight - cornerRadius, Math.PI / 2);
  addLine([-halfWidth, halfHeight - cornerRadius], [-halfWidth, -halfHeight + cornerRadius]);
  addArc(-halfWidth + cornerRadius, -halfHeight + cornerRadius, Math.PI);
  return points;
};
var archEyePoints = (width, height, thickness = 6.5) => {
  const points = [];
  const halfWidth = width / 2;
  const samples = 18;
  const archLift = Math.max(7, height * 0.45);
  for (let i = 0; i <= samples; i++) {
    const t = i / samples;
    const x = -halfWidth + t * width;
    const angle = t * Math.PI;
    const y = -Math.sin(angle) * archLift;
    points.push([x, y]);
  }
  const rightCenterX = halfWidth;
  const rightCenterY = thickness / 2;
  for (let i = 0; i <= 6; i++) {
    const angle = -Math.PI / 2 + i / 6 * Math.PI;
    points.push([rightCenterX + Math.cos(angle) * (thickness / 2), rightCenterY + Math.sin(angle) * (thickness / 2)]);
  }
  for (let i = samples; i >= 0; i--) {
    const t = i / samples;
    const x = -halfWidth + t * width;
    const angle = t * Math.PI;
    const y = -Math.sin(angle) * archLift + thickness;
    points.push([x, y]);
  }
  const leftCenterX = -halfWidth;
  const leftCenterY = thickness / 2;
  for (let i = 0; i <= 6; i++) {
    const angle = Math.PI / 2 + i / 6 * Math.PI;
    points.push([leftCenterX + Math.cos(angle) * (thickness / 2), leftCenterY + Math.sin(angle) * (thickness / 2)]);
  }
  return points;
};
var project = (point, perspective) => {
  const denominator = FOCAL_LENGTH - point[2] * perspective;
  const scale = Math.abs(denominator) < 1e-4 ? FOCAL_LENGTH / 1e-4 : FOCAL_LENGTH / denominator;
  return [point[0] * scale, point[1] * scale, point[2]];
};
var path = (points, close = true) => {
  if (!points.length) return "";
  return `M${points[0][0].toFixed(2)} ${points[0][1].toFixed(2)}${points.slice(1).map((point) => `L${point[0].toFixed(2)} ${point[1].toFixed(2)}`).join("")}${close ? "Z" : ""}`;
};
var convexHull = (points) => {
  const sorted = [...points].sort((left, right) => left[0] - right[0] || left[1] - right[1]);
  const cross = (origin, first, second) => (first[0] - origin[0]) * (second[1] - origin[1]) - (first[1] - origin[1]) * (second[0] - origin[0]);
  const half = (source) => {
    const result = [];
    source.forEach((point) => {
      while (result.length >= 2 && cross(result.at(-2), result.at(-1), point) <= 0) result.pop();
      result.push(point);
    });
    return result;
  };
  return [...half(sorted).slice(0, -1), ...half(sorted.reverse()).slice(0, -1)];
};
var smoothClosedPath = (points) => {
  if (points.length < 3) return path(points);
  const pointAt = (index) => points[(index + points.length) % points.length];
  return `M${points[0][0].toFixed(2)} ${points[0][1].toFixed(2)}${points.map((point, index) => {
    const previous = pointAt(index - 1);
    const next = pointAt(index + 1);
    const afterNext = pointAt(index + 2);
    const firstControl = [
      point[0] + (next[0] - previous[0]) / 6,
      point[1] + (next[1] - previous[1]) / 6,
      point[2]
    ];
    const secondControl = [
      next[0] - (afterNext[0] - point[0]) / 6,
      next[1] - (afterNext[1] - point[1]) / 6,
      next[2]
    ];
    return `C${firstControl[0].toFixed(2)} ${firstControl[1].toFixed(2)} ${secondControl[0].toFixed(2)} ${secondControl[1].toFixed(2)} ${next[0].toFixed(2)} ${next[1].toFixed(2)}`;
  }).join("")}Z`;
};
var densifyClosedPoints = (points, maximumDistance = 7) => points.flatMap((point, index) => {
  const next = points[(index + 1) % points.length];
  const steps = Math.max(
    1,
    Math.ceil(Math.hypot(next[0] - point[0], next[1] - point[1]) / maximumDistance)
  );
  return Array.from({ length: steps }, (_, step) => {
    const progress = step / steps;
    return [
      point[0] + (next[0] - point[0]) * progress,
      point[1] + (next[1] - point[1]) * progress,
      point[2] + (next[2] - point[2]) * progress
    ];
  });
});

// C:/Users/Swaraj/.gemini/antigravity/brain/ff27d34a-fa4f-4480-9bcc-dd9fc2cbfa56/scratch/generate_3d_companion.ts
var facialSphere = {
  type: "sphere",
  width: 148,
  height: 148,
  depth: 144,
  roundness: 1
};
var torsoCapsule = {
  type: "capsule",
  width: 168,
  height: 142,
  depth: 156,
  roundness: 1
};
var sphereCenter = [0, -26, 0];
var capsuleCenter = [0, 24, 0];
function generateUnifiedBodyPath(pose) {
  const points3D = [];
  const LAT_SAMPLES = 25;
  const LON_SAMPLES = 49;
  for (let i = 0; i < LAT_SAMPLES; i++) {
    const lat = -Math.PI / 2 + i / (LAT_SAMPLES - 1) * Math.PI;
    for (let j = 0; j < LON_SAMPLES; j++) {
      const lon = -Math.PI + j / (LON_SAMPLES - 1) * Math.PI * 2;
      const pt = surfacePointAt(facialSphere, lon, lat);
      points3D.push([
        pt[0] + sphereCenter[0],
        pt[1] + sphereCenter[1],
        pt[2] + sphereCenter[2]
      ]);
    }
  }
  for (let i = 0; i < LAT_SAMPLES; i++) {
    const lat = -Math.PI / 2 + i / (LAT_SAMPLES - 1) * Math.PI;
    for (let j = 0; j < LON_SAMPLES; j++) {
      const lon = -Math.PI + j / (LON_SAMPLES - 1) * Math.PI * 2;
      const pt = surfacePointAt(torsoCapsule, lon, lat);
      points3D.push([
        pt[0] + capsuleCenter[0],
        pt[1] + capsuleCenter[1],
        pt[2] + capsuleCenter[2]
      ]);
    }
  }
  const projected = points3D.map((pt) => {
    const rot = rotateWithQuaternion(pose.orientation, pt);
    return project(rot, pose.expression.perspective ?? 1);
  });
  return smoothClosedPath(densifyClosedPoints(convexHull(projected)));
}
function generateLimbPath(pose, config, position, localRotationEuler) {
  const localQ = quaternionFromEuler(
    radians(localRotationEuler[0]),
    radians(localRotationEuler[1]),
    radians(localRotationEuler[2])
  );
  const LAT_SAMPLES = 19;
  const LON_SAMPLES = 33;
  const points3D = [];
  for (let i = 0; i < LAT_SAMPLES; i++) {
    const lat = -Math.PI / 2 + i / (LAT_SAMPLES - 1) * Math.PI;
    for (let j = 0; j < LON_SAMPLES; j++) {
      const lon = -Math.PI + j / (LON_SAMPLES - 1) * Math.PI * 2;
      const localPt = surfacePointAt(config, lon, lat);
      const rotLocal = rotateWithQuaternion(localQ, localPt);
      points3D.push([
        rotLocal[0] + position[0],
        rotLocal[1] + position[1],
        rotLocal[2] + position[2]
      ]);
    }
  }
  const worldPos = rotateWithQuaternion(pose.orientation, position);
  const depth = worldPos[2];
  const projected = points3D.map((pt) => {
    const rot = rotateWithQuaternion(pose.orientation, pt);
    return project(rot, pose.expression.perspective ?? 1);
  });
  return {
    path: smoothClosedPath(densifyClosedPoints(convexHull(projected))),
    depth
  };
}
function projectHeadFacePoint(pose, canonicalX, canonicalY) {
  const [faceX, faceY] = [canonicalX * 1.05, canonicalY * 1.05];
  const sample = surfaceFrontSampleAt(facialSphere, faceX, faceY);
  const worldPt = [
    sample.point[0] + sphereCenter[0],
    sample.point[1] + sphereCenter[1],
    sample.point[2] + sphereCenter[2]
  ];
  const rot = rotateWithQuaternion(pose.orientation, worldPt);
  const rotNormal = rotateWithQuaternion(pose.orientation, sample.normal);
  return {
    point: project(rot, pose.expression.perspective ?? 1),
    normal: rotNormal
  };
}
function computeEyes(pose, blink) {
  const exp = pose.expression;
  const sides = [-1, 1];
  const paths = {
    left: "",
    right: "",
    leftVis: true,
    rightVis: true
  };
  sides.forEach((side) => {
    const suffix = side < 0 ? "Left" : "Right";
    const width = exp[`width${suffix}`];
    const restingHeight = exp[`height${suffix}`];
    const height = Math.max(4, 5 + (restingHeight - 5) * blink);
    const centerX = side * exp.spacing / 2 + exp[`positionX${suffix}`];
    const centerY = exp[`positionY${suffix}`];
    const angle = radians(side < 0 ? exp.leftAngle : exp.rightAngle);
    const isArch = blink > 0.3 && (exp.eyeShape === "arch" || exp.semanticKey === "happy" || exp.semanticKey === "celebration");
    const contour = isArch ? archEyePoints(width, height) : roundedRectangle(width, height);
    const projectedSamples = contour.map(([localX, localY]) => {
      const rotX = localX * Math.cos(angle) - localY * Math.sin(angle);
      const rotY = localX * Math.sin(angle) + localY * Math.cos(angle);
      return projectHeadFacePoint(pose, centerX + rotX, centerY + rotY);
    });
    const isVisible = projectedSamples.reduce((acc, s) => acc + s.normal[2], 0) > 0;
    const d = `M ${projectedSamples[0].point[0].toFixed(1)} ${projectedSamples[0].point[1].toFixed(1)} ` + projectedSamples.slice(1).map((s) => `L ${s.point[0].toFixed(1)} ${s.point[1].toFixed(1)}`).join(" ") + " Z";
    if (side < 0) {
      paths.left = d;
      paths.leftVis = isVisible;
    } else {
      paths.right = d;
      paths.rightVis = isVisible;
    }
  });
  return paths;
}
function computeBlush(pose) {
  const blush = pose.expression.blush ?? 0;
  if (blush <= 0.05) return { left: "", right: "" };
  const rX = 11 * blush;
  const rY = 5.5 * blush;
  const pL = projectHeadFacePoint(pose, -40, 10);
  const pR = projectHeadFacePoint(pose, 40, 10);
  const gen = (p) => {
    if (p.normal[2] <= 0) return "";
    return `M ${(p.point[0] - rX).toFixed(1)} ${p.point[1].toFixed(1)} A ${rX.toFixed(1)} ${rY.toFixed(1)} 0 1 0 ${(p.point[0] + rX).toFixed(1)} ${p.point[1].toFixed(1)} A ${rX.toFixed(1)} ${rY.toFixed(1)} 0 1 0 ${(p.point[0] - rX).toFixed(1)} ${p.point[1].toFixed(1)} Z`;
  };
  return { left: gen(pL), right: gen(pR) };
}
function computeTicks(pose) {
  if (pose.expression.actionMarks !== "ticks" && pose.expression.semanticKey !== "neutral" && pose.expression.semanticKey !== "curious") return "";
  const p1 = projectHeadFacePoint(pose, 36, -64);
  const p2 = projectHeadFacePoint(pose, 46, -80);
  const p3 = projectHeadFacePoint(pose, 48, -58);
  const p4 = projectHeadFacePoint(pose, 58, -74);
  if (p1.normal[2] > 0.05 && p3.normal[2] > 0.05) {
    return `M ${p1.point[0].toFixed(1)} ${p1.point[1].toFixed(1)} L ${p2.point[0].toFixed(1)} ${p2.point[1].toFixed(1)} M ${p3.point[0].toFixed(1)} ${p3.point[1].toFixed(1)} L ${p4.point[0].toFixed(1)} ${p4.point[1].toFixed(1)}`;
  }
  return "";
}
function computeWorryDrop(pose) {
  if (!pose.expression.worryDrop) return "";
  const p = projectHeadFacePoint(pose, 36, -38);
  if (p.normal[2] <= 0) return "";
  const cx = p.point[0];
  const cy = p.point[1];
  return `M ${cx.toFixed(1)} ${(cy - 12).toFixed(1)} C ${(cx + 6).toFixed(1)} ${(cy - 3).toFixed(1)}, ${(cx + 5).toFixed(1)} ${(cy + 5).toFixed(1)}, ${cx.toFixed(1)} ${(cy + 5).toFixed(1)} C ${(cx - 5).toFixed(1)} ${(cy + 5).toFixed(1)}, ${(cx - 6).toFixed(1)} ${(cy - 3).toFixed(1)}, ${cx.toFixed(1)} ${(cy - 12).toFixed(1)} Z`;
}
function renderMascotScene(title, expression, eulerAngles) {
  const orientation = quaternionFromEuler(
    radians(eulerAngles[0]),
    radians(eulerAngles[1]),
    radians(eulerAngles[2])
  );
  const pose = { expression, orientation };
  const bodyD = generateUnifiedBodyPath(pose);
  const leftArm = generateLimbPath(pose, { type: "capsule", width: 34, height: 86, depth: 36, roundness: 1 }, [-82, 16, 2], [4, 0, 18]);
  const rightArm = generateLimbPath(pose, { type: "capsule", width: 34, height: 86, depth: 36, roundness: 1 }, [82, 16, 2], [4, 0, -18]);
  const leftFoot = generateLimbPath(pose, { type: "capsule", width: 38, height: 42, depth: 52, roundness: 1 }, [-36, 88, -6], [22, 0, -5]);
  const rightFoot = generateLimbPath(pose, { type: "capsule", width: 38, height: 42, depth: 52, roundness: 1 }, [36, 88, -6], [22, 0, 5]);
  const limbs = [
    { id: "arm-l", path: leftArm.path, depth: leftArm.depth, type: "arm" },
    { id: "arm-r", path: rightArm.path, depth: rightArm.depth, type: "arm" },
    { id: "foot-l", path: leftFoot.path, depth: leftFoot.depth, type: "foot" },
    { id: "foot-r", path: rightFoot.path, depth: rightFoot.depth, type: "foot" }
  ].sort((a, b) => a.depth - b.depth);
  const backLimbs = limbs.filter((l) => l.depth <= 0);
  const frontLimbs = limbs.filter((l) => l.depth > 0);
  const eyes = computeEyes(pose, 1);
  const blush = computeBlush(pose);
  const ticks = computeTicks(pose);
  const drop = computeWorryDrop(pose);
  return `
    <div style="display:flex; flex-direction:column; align-items:center; background:white; padding:20px; border-radius:24px; box-shadow:0 10px 30px rgba(0,0,0,0.06); width:280px;">
      <h3 style="margin:0 0 14px 0; font-family:system-ui; font-size:15px; color:#1a1a1a;">${title}</h3>
      <svg viewBox="-160 -170 320 340" width="240" height="255" style="overflow:visible;">
        <defs>
          <!-- Soft Ground Shadow Filter -->
          <filter id="shadowBlur" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="9" />
          </filter>

          <!-- 3D Clay Vinyl Body Gradient (top-left warm light, ambient bottom-right tone) -->
          <linearGradient id="body3dGrad" x1="22%" y1="0%" x2="82%" y2="100%">
            <stop offset="0%" stop-color="#FFFDF9" />
            <stop offset="28%" stop-color="#F7EEDF" />
            <stop offset="72%" stop-color="#F2E3CD" />
            <stop offset="100%" stop-color="#DEC6A8" />
          </linearGradient>

          <!-- 3D Limb Shading (Arm) -->
          <linearGradient id="arm3dGrad" x1="15%" y1="10%" x2="85%" y2="90%">
            <stop offset="0%" stop-color="#FDF8F0" />
            <stop offset="45%" stop-color="#EFE2CE" />
            <stop offset="100%" stop-color="#D9C2A4" />
          </linearGradient>

          <!-- 3D Limb Shading (Foot) -->
          <linearGradient id="foot3dGrad" x1="30%" y1="0%" x2="70%" y2="100%">
            <stop offset="0%" stop-color="#F7EDDE" />
            <stop offset="50%" stop-color="#E8DAC5" />
            <stop offset="100%" stop-color="#D3BC9E" />
          </linearGradient>

          <!-- Soft Head Clip for Features -->
          <clipPath id="bodyClip_${title.replace(/[^a-zA-Z0-9]/g, "")}">
            <path d="${bodyD}" />
          </clipPath>
        </defs>

        <!-- Dimensional Floating Ground Shadow -->
        <ellipse cx="0" cy="128" rx="72" ry="15" fill="#1C1814" opacity="0.16" filter="url(#shadowBlur)" />

        <!-- Back Limbs (behind body) -->
        ${backLimbs.map((l) => `<path d="${l.path}" fill="${l.type === "foot" ? "url(#foot3dGrad)" : "url(#arm3dGrad)"}" />`).join("\n")}

        <!-- Primary Pear Body (Unified Smooth Contour) -->
        <path d="${bodyD}" fill="url(#body3dGrad)" />

        <!-- Facial Features (Clipped to Body Surface) -->
        <g clipPath="url(#bodyClip_${title.replace(/[^a-zA-Z0-9]/g, "")})">
          <!-- Eyes -->
          <path d="${eyes.left}" fill="#171717" opacity="${eyes.leftVis ? 1 : 0}" />
          <path d="${eyes.right}" fill="#171717" opacity="${eyes.rightVis ? 1 : 0}" />

          <!-- Blush -->
          ${blush.left ? `<path d="${blush.left}" fill="#FF8282" opacity="0.85" />` : ""}
          ${blush.right ? `<path d="${blush.right}" fill="#FF8282" opacity="0.85" />` : ""}

          <!-- Worry Drop -->
          ${drop ? `<path d="${drop}" fill="#68BAFF" opacity="0.9" />` : ""}
        </g>

        <!-- Action Marks (Ticks above eye) -->
        ${ticks ? `<path d="${ticks}" stroke="#171717" stroke-width="2.5" stroke-linecap="round" fill="none" />` : ""}

        <!-- Front Limbs (in front of body, e.g. when tilted forward) -->
        ${frontLimbs.map((l) => `<path d="${l.path}" fill="${l.type === "foot" ? "url(#foot3dGrad)" : "url(#arm3dGrad)"}" />`).join("\n")}
      </svg>
      <div style="margin-top:8px; padding:4px 14px; border-radius:999px; background:#F5F5F5; font-size:12px; color:#555; font-family:system-ui;">
        Let's get you started.
      </div>
    </div>
  `;
}
var neutralExp = {
  id: "neutral",
  semanticKey: "neutral",
  headX: 0,
  headY: 0,
  headZ: 0,
  widthLeft: 18,
  widthRight: 18,
  heightLeft: 46,
  heightRight: 46,
  spacing: 30,
  positionXLeft: 0,
  positionXRight: 0,
  positionYLeft: -8,
  positionYRight: -8,
  leftAngle: 0,
  rightAngle: 0,
  perspective: 1,
  actionMarks: "ticks"
};
var curiousExp = {
  ...neutralExp,
  id: "curious",
  semanticKey: "curious",
  headX: -3,
  headY: 22,
  headZ: 3,
  widthLeft: 20,
  widthRight: 18,
  heightLeft: 48,
  heightRight: 44,
  spacing: 32,
  positionXLeft: 5,
  positionXRight: 5,
  positionYLeft: -6,
  positionYRight: -6,
  leftAngle: 4,
  rightAngle: -2,
  actionMarks: "ticks"
};
var happyExp = {
  ...neutralExp,
  id: "happy",
  semanticKey: "happy",
  headX: -6,
  headY: 0,
  headZ: 0,
  widthLeft: 22,
  widthRight: 22,
  heightLeft: 26,
  heightRight: 26,
  spacing: 32,
  positionYLeft: -8,
  positionYRight: -8,
  eyeShape: "arch",
  blush: 0.75,
  actionMarks: "none"
};
var shyExp = {
  ...neutralExp,
  id: "shy",
  semanticKey: "shy",
  headX: 8,
  headY: -16,
  headZ: -4,
  widthLeft: 18,
  widthRight: 18,
  heightLeft: 34,
  heightRight: 34,
  spacing: 28,
  positionXLeft: -3,
  positionXRight: -3,
  positionYLeft: -2,
  positionYRight: -2,
  leftAngle: -6,
  rightAngle: 6,
  blush: 0.85,
  actionMarks: "none"
};
var worriedExp = {
  ...neutralExp,
  id: "worried",
  semanticKey: "worried",
  headX: 4,
  headY: 8,
  headZ: 2,
  widthLeft: 20,
  widthRight: 17,
  heightLeft: 48,
  heightRight: 38,
  spacing: 30,
  positionXLeft: 2,
  positionXRight: 2,
  positionYLeft: -6,
  positionYRight: -6,
  worryDrop: true,
  actionMarks: "none"
};
var lookingAtFormExp = {
  ...neutralExp,
  id: "looking-at-form",
  semanticKey: "attentive",
  headX: -2,
  headY: 28,
  headZ: 4,
  widthLeft: 20,
  widthRight: 18,
  heightLeft: 48,
  heightRight: 45,
  spacing: 30,
  positionXLeft: 8,
  positionXRight: 8,
  positionYLeft: -6,
  positionYRight: -6,
  leftAngle: 2,
  rightAngle: -2,
  actionMarks: "none"
};
var html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Creator Companion 3D Clay Verification</title>
  <style>
    body { margin: 0; padding: 40px; background: #F8F6F0; font-family: system-ui, sans-serif; }
    .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 28px; max-width: 960px; margin: 0 auto; }
  </style>
</head>
<body>
  <div style="text-align:center; margin-bottom:32px;">
    <h1 style="margin:0; font-size:26px; color:#171717;">Creator Companion - 3D Clay Multi-Primitive Assembly</h1>
    <p style="margin:6px 0 0 0; color:#666; font-size:15px;">Unified Pear Body + Grounded Underside Feet + 3D Vinyl Shading</p>
  </div>
  <div class="grid">
    ${renderMascotScene("1. Neutral", neutralExp, [0, 0, 0])}
    ${renderMascotScene("2. Curious (3/4 View)", curiousExp, [-3, 22, 3])}
    ${renderMascotScene("3. Happy (Success)", happyExp, [-6, 0, 0])}
    ${renderMascotScene("4. Shy / Embarrassed", shyExp, [8, -16, -4])}
    ${renderMascotScene("5. Worried (Error)", worriedExp, [4, 8, 2])}
    ${renderMascotScene("6. Looking at Form", lookingAtFormExp, [-2, 28, 4])}
  </div>
</body>
</html>
`;
fs.writeFileSync("C:/Users/Swaraj/.gemini/antigravity/brain/ff27d34a-fa4f-4480-9bcc-dd9fc2cbfa56/scratch/companion_3d_preview.html", html);
console.log("Generated companion_3d_preview.html successfully!");
