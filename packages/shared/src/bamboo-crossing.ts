/** Eastern Bamboo Crossing: static authored navigation geometry shared by client/server.
 * A single continuous world avoids teleporting, new save fields or network protocol changes.
 */
import type { Bounds } from './forest-layout.js';

export const BAMBOO_GATE_X = 1910;
export const BAMBOO_WORLD_WIDTH = 2848;
export const BAMBOO_BRIDGE = { x: 2182, y: 418, w: 210, h: 90 } as const;
export const BAMBOO_SHRINE = { x: 2640, y: 432 } as const;
export const BAMBOO_SHRINE_CLEARING: Bounds = {
  x: 2520,
  y: 345,
  w: 260,
  h: 230,
};

/** Shared centerline and variable-width banks for both visuals and collisions.
 * The bridge is the only dry crossing; curvature fades gently near its deck.
 */
export function bambooRiverSpan(y: number): { left: number; right: number } {
  const fromBridge = y - (BAMBOO_BRIDGE.y + BAMBOO_BRIDGE.h / 2);
  const center =
    2285 +
    Math.sin(fromBridge / 136) * 35 +
    Math.sin(fromBridge / 59) * 11 +
    Math.sin(fromBridge / 310) * 13;
  const halfWidth =
    66 +
    Math.sin(fromBridge / 178) * 12 +
    (1 - Math.cos(fromBridge / 110)) * 5;
  return {
    left: Math.round(center - halfWidth),
    right: Math.round(center + halfWidth),
  };
}

/** The river flows under the bridge; only the full deck is collision-free. */
export const bambooRiverColliders: Bounds[] = (() => {
  const bands: Bounds[] = [];
  for (let y = 0; y < 1440; y += 8) {
    // Crossing without invisible rails. Player radius requires room to turn.
    if (y >= BAMBOO_BRIDGE.y && y < BAMBOO_BRIDGE.y + BAMBOO_BRIDGE.h) continue;
    const span = bambooRiverSpan(y + 4);
    bands.push({ x: span.left, y, w: span.right - span.left, h: 8 });
  }
  return bands;
})();

/** Positions describe feet, so trunk collision and the rendered stem agree.
 * Clustered away from the approach, bridge and eastern shrine court.
 */
export const bambooStands = [
  [1990, 172],
  [2074, 190],
  [2155, 242],
  [2018, 292],
  [2110, 305],
  [1988, 666],
  [2072, 724],
  [2146, 646],
  [2008, 845],
  [2140, 942],
  [2050, 1086],
  [2158, 1232],
  [1980, 1312],
  [2450, 172],
  [2540, 143],
  [2670, 158],
  [2770, 240],
  [2465, 698],
  [2525, 785],
  [2660, 723],
  [2760, 660],
  [2455, 950],
  [2575, 1048],
  [2720, 943],
  [2770, 1150],
  [2475, 1260],
  [2630, 1320],
  [2775, 1360],
] as const;

export const bambooObstacles: Bounds[] = bambooStands.map(([x, y]) => ({
  x: x - 17,
  y: y - 34,
  w: 34,
  h: 34,
}));

/** Existing forest is stable. New site is discoverable by walking east. */
export function worldRegion(x: number): 'forest' | 'bamboo' {
  return x >= BAMBOO_GATE_X ? 'bamboo' : 'forest';
}
