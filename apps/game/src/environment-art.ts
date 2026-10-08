import { obstacles, random, WORLD, type Obstacle } from '@panda/shared';

// A single deterministic 2D backdrop shared by solo and co-op clients.
// The positions of all obstacles remain authoritative in @panda/shared.
type Point = { x: number; y: number };
const ink = (
  ctx: CanvasRenderingContext2D,
  color: string,
  x: number,
  y: number,
  w: number,
  h: number,
) => {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
};
const polygon = (
  ctx: CanvasRenderingContext2D,
  points: Point[],
  color: string,
) => {
  ctx.fillStyle = color;
  ctx.beginPath();
  points.forEach((p, i) =>
    i
      ? ctx.lineTo(Math.round(p.x), Math.round(p.y))
      : ctx.moveTo(Math.round(p.x), Math.round(p.y)),
  );
  ctx.closePath();
  ctx.fill();
};
export function trailPoint(t: number): Point {
  const s = Math.max(0, Math.min(1, t));
  const u = 1 - s;
  return {
    x:
      u * u * u * 200 +
      3 * u * u * s * 700 +
      3 * u * s * s * 850 +
      s * s * s * 1580,
    y:
      u * u * u * 1150 +
      3 * u * u * s * 1150 +
      3 * u * s * s * 650 +
      s * s * s * 340,
  };
}
function stampRoad(ctx: CanvasRenderingContext2D, randomNumber: () => number) {
  const center: Point[] = [];
  const left: Point[] = [];
  const right: Point[] = [];
  const margin: Point[] = [];
  const drawBand = (width: number, color: string, wobble: number) => {
    left.length = 0;
    right.length = 0;
    for (let n = 0; n <= 125; n++) {
      const t = n / 125;
      const p = trailPoint(t);
      const before = trailPoint(Math.max(0, t - 0.004));
      const after = trailPoint(Math.min(1, t + 0.004));
      const angle = Math.atan2(after.y - before.y, after.x - before.x);
      const nx = -Math.sin(angle),
        ny = Math.cos(angle);
      const edge = (randomNumber() - 0.5) * wobble;
      left.push({ x: p.x + nx * (width + edge), y: p.y + ny * (width + edge) });
      right.push({
        x: p.x - nx * (width + edge),
        y: p.y - ny * (width + edge),
      });
      if (width === 47) center.push(p);
    }
    polygon(ctx, left.concat(right.reverse()), color);
  };
  // Moss bank, raised earth edge and a warm beaten footpath.
  drawBand(77, '#18372e', 10);
  drawBand(69, '#476142', 8);
  drawBand(58, '#8d8055', 9);
  drawBand(50, '#c4aa73', 7);
  drawBand(47, '#d7bd81', 4);
  // Two thin wheel-worn tracks make the road read as terrain, not a beige slab.
  ctx.save();
  ctx.setLineDash([18, 12, 34, 19]);
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#b49b68';
  for (const sign of [-1, 1]) {
    ctx.beginPath();
    for (let i = 0; i <= 160; i++) {
      const t = i / 160;
      const p = trailPoint(t);
      const prev = trailPoint(Math.max(0, t - 0.003));
      const next = trailPoint(Math.min(1, t + 0.003));
      const angle = Math.atan2(next.y - prev.y, next.x - prev.x);
      const x = p.x - Math.sin(angle) * sign * 22;
      const y = p.y + Math.cos(angle) * sign * 22;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  ctx.restore();
  for (let i = 0; i < 820; i++) {
    const t = randomNumber();
    const p = trailPoint(t);
    const prev = trailPoint(Math.max(0, t - 0.004));
    const next = trailPoint(Math.min(1, t + 0.004));
    const a = Math.atan2(next.y - prev.y, next.x - prev.x);
    const side = (randomNumber() - 0.5) * 96;
    const x = p.x - Math.sin(a) * side,
      y = p.y + Math.cos(a) * side;
    const color = randomNumber() > 0.56 ? '#ab9065' : '#e2cc90';
    ink(ctx, color, x, y, 2 + randomNumber() * 5, 2 + randomNumber() * 3);
  }
  void margin;
}
function clearing(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  rx: number,
  ry: number,
  seed: () => number,
) {
  for (let i = 4; i >= 0; i--) {
    ctx.fillStyle = ['#657b4d', '#6e8153', '#78905c', '#82935c', '#91a06a'][
      4 - i
    ]!;
    ctx.beginPath();
    ctx.ellipse(x, y, rx - i * 6, ry - i * 6, -0.08, 0, Math.PI * 2);
    ctx.fill();
  }
  for (let k = 0; k < 120; k++) {
    const x0 = x + (seed() - 0.5) * rx * 1.7,
      y0 = y + (seed() - 0.5) * ry * 1.7;
    ink(ctx, seed() > 0.5 ? '#b0b079' : '#577349', x0, y0, 3, 2);
  }
}
function shoreline(
  ctx: CanvasRenderingContext2D,
  o: Obstacle,
  rng: () => number,
) {
  // Jagged rounded pond silhouette fully contains the rectangular collision.
  // Bank colors live outside the collision boundary, preventing invisible bridges.
  const ring = (pad: number): Point[] => {
    const result: Point[] = [];
    const stepsX = Math.ceil(o.w / 20),
      stepsY = Math.ceil(o.h / 20);
    const stagger = () => (rng() - 0.5) * 7;
    for (let i = 0; i <= stepsX; i++)
      result.push({
        x: o.x - pad + (i * (o.w + 2 * pad)) / stepsX + stagger(),
        y: o.y - pad + stagger(),
      });
    for (let i = 1; i <= stepsY; i++)
      result.push({
        x: o.x + o.w + pad + stagger(),
        y: o.y - pad + (i * (o.h + 2 * pad)) / stepsY + stagger(),
      });
    for (let i = stepsX - 1; i >= 0; i--)
      result.push({
        x: o.x - pad + (i * (o.w + 2 * pad)) / stepsX + stagger(),
        y: o.y + o.h + pad + stagger(),
      });
    for (let i = stepsY - 1; i > 0; i--)
      result.push({
        x: o.x - pad + stagger(),
        y: o.y - pad + (i * (o.h + 2 * pad)) / stepsY + stagger(),
      });
    return result;
  };
  polygon(ctx, ring(48), '#1b3d34');
  polygon(ctx, ring(41), '#5a704b');
  polygon(ctx, ring(33), '#9b9460');
  polygon(ctx, ring(25), '#497b72');
  polygon(ctx, ring(20), '#285f69');
  polygon(ctx, ring(13), '#387c86');
  polygon(ctx, ring(5), '#438591');
  for (let i = 0; i < 125; i++) {
    const x = o.x + rng() * o.w,
      y = o.y + rng() * o.h;
    ink(ctx, rng() > 0.48 ? '#588f92' : '#2b737f', x, y, 5 + rng() * 23, 2);
  }
  // Reeds and white waterflowers grow at the banks only.
  for (let i = 0; i < 38; i++) {
    const edge = i % 4;
    const x =
      edge < 2 ? o.x + rng() * o.w : edge === 2 ? o.x - 34 : o.x + o.w + 25;
    const y =
      edge >= 2 ? o.y + rng() * o.h : edge === 0 ? o.y - 28 : o.y + o.h + 28;
    ink(ctx, '#284f3d', x, y - 9, 3, 14);
    ink(ctx, '#91a46a', x + 3, y - 13, 3, 13);
    if (i % 7 === 0) {
      ink(ctx, '#dfc8b3', x - 5, y - 11, 12, 4);
      ink(ctx, '#eecb71', x - 1, y - 12, 4, 3);
    }
  }
}
function forge(ctx: CanvasRenderingContext2D) {
  // Cozy half-timbered smithy, pitched roof and working forge in the clearing.
  // Rendered as background scenery to preserve the existing passable map.
  ink(ctx, '#203e31', 228, 956, 180, 33);
  ink(ctx, '#4f4331', 250, 899, 137, 68);
  ink(ctx, '#bd9362', 257, 905, 122, 54);
  for (let x = 260; x < 380; x += 23) {
    ink(ctx, '#63432b', x, 905, 6, 59);
    ink(ctx, '#e6c38d', x + 6, 909, 3, 48);
  }
  ink(ctx, '#3a493a', 243, 879, 150, 15);
  polygon(
    ctx,
    [
      { x: 239, y: 895 },
      { x: 296, y: 825 },
      { x: 348, y: 827 },
      { x: 408, y: 900 },
    ],
    '#253d35',
  );
  polygon(
    ctx,
    [
      { x: 248, y: 889 },
      { x: 297, y: 832 },
      { x: 347, y: 833 },
      { x: 396, y: 891 },
    ],
    '#497056',
  );
  polygon(
    ctx,
    [
      { x: 251, y: 884 },
      { x: 299, y: 836 },
      { x: 344, y: 836 },
      { x: 391, y: 885 },
    ],
    '#628369',
  );
  for (let row = 0; row < 6; row++) {
    const py = 844 + row * 8;
    for (let px = 296 - row * 7; px < 349 + row * 7; px += 19) {
      ink(ctx, row % 2 ? '#3f6857' : '#517966', px, py, 14, 3);
      ink(ctx, '#799b7a', px + 2, py - 1, 6, 2);
    }
  }
  ink(ctx, '#42544c', 343, 819, 21, 28);
  ink(ctx, '#b48e61', 346, 816, 15, 4);
  ink(ctx, '#7b4e34', 268, 923, 35, 41);
  ink(ctx, '#3a3028', 274, 928, 23, 36);
  ink(ctx, '#d0a263', 291, 944, 4, 4);
  ink(ctx, '#4a3529', 323, 913, 39, 28);
  ink(ctx, '#f3cd83', 328, 917, 29, 20);
  ink(ctx, '#9c643d', 339, 918, 5, 19);
  ink(ctx, '#9c643d', 328, 924, 28, 5);
  // Little smithing forge: warm embers, chimney pipe, anvil and wood stacks.
  ink(ctx, '#3b3430', 349, 966, 62, 22);
  ink(ctx, '#875c43', 354, 964, 53, 15);
  ink(ctx, '#f4b15e', 360, 967, 39, 7);
  ink(ctx, '#e56e3c', 366, 969, 29, 6);
  ink(ctx, '#d9bb85', 342, 979, 14, 3);
  ink(ctx, '#414944', 414, 982, 30, 8);
  ink(ctx, '#67716d', 416, 973, 26, 8);
  ink(ctx, '#465955', 424, 987, 10, 8);
  for (let n = 0; n < 4; n++) {
    ink(ctx, '#5a4730', 217 + n * 7, 963 - n * 3, 27, 9);
    ink(ctx, '#bf9461', 220 + n * 7, 966 - n * 3, 9, 4);
  }
  // Camp furniture, lanterns, plants.
  ink(ctx, '#524738', 444, 1095, 62, 12);
  ink(ctx, '#c49a61', 447, 1090, 56, 7);
  ink(ctx, '#523e32', 473, 1079, 4, 15);
  ink(ctx, '#e4b766', 475, 1063, 11, 14);
  ink(ctx, '#f9e1a2', 478, 1066, 5, 7);
  ink(ctx, '#5e5638', 469, 1076, 21, 4);
}
function boulders(ctx: CanvasRenderingContext2D, o: Obstacle) {
  ink(ctx, '#1f4033', o.x - 12, o.y + o.h - 2, o.w + 24, 17);
  polygon(
    ctx,
    [
      { x: o.x - 9, y: o.y + o.h - 7 },
      { x: o.x + 3, y: o.y - 10 },
      { x: o.x + o.w - 12, y: o.y - 17 },
      { x: o.x + o.w + 12, y: o.y + 8 },
      { x: o.x + o.w + 8, y: o.y + o.h },
      { x: o.x - 9, y: o.y + o.h },
    ],
    '#566e65',
  );
  polygon(
    ctx,
    [
      { x: o.x + 2, y: o.y + 5 },
      { x: o.x + 10, y: o.y - 13 },
      { x: o.x + o.w - 13, y: o.y - 14 },
      { x: o.x + o.w + 2, y: o.y + 6 },
    ],
    '#9daa96',
  );
  ink(ctx, '#b6bea7', o.x + 10, o.y - 8, Math.max(6, o.w * 0.34), 5);
  ink(ctx, '#405d50', o.x + o.w - 14, o.y + 13, 8, Math.max(8, o.h - 15));
}
export function paintForestWorld(
  ctx: CanvasRenderingContext2D,
  importedTiles?: HTMLImageElement,
): void {
  ctx.imageSmoothingEnabled = false;
  const rng = random(93104);
  ink(ctx, '#305a3d', 0, 0, WORLD.width, WORLD.height);
  // Soft 32px terrain cells, clustered moss, and short individual grass tufts.
  for (let y = 0; y < WORLD.height; y += 32)
    for (let x = 0; x < WORLD.width; x += 32) {
      const v = rng();
      ink(
        ctx,
        v > 0.69 ? '#345e42' : v > 0.32 ? '#315a3d' : '#2f573b',
        x,
        y,
        32,
        32,
      );
      if (rng() > 0.72) ink(ctx, '#3f6c49', x + 9, y + 12, 11, 8);
      if (rng() > 0.75) ink(ctx, '#254c35', x + 4, y + 23, 15, 3);
      if (importedTiles && rng() > 0.88) {
        ctx.save();
        ctx.globalAlpha = 0.22;
        // Small world-atlas samples serve as moss and texture, not random opaque squares.
        ctx.drawImage(importedTiles, 16, 16, 16, 16, x + 8, y + 8, 16, 16);
        ctx.restore();
      }
    }
  // Camp and boss clearing are made first, so the path meets them cleanly.
  clearing(ctx, 450, 1030, 178, 124, rng);
  clearing(ctx, 1580, 340, 188, 145, rng);
  stampRoad(ctx, rng);
  for (const o of obstacles) {
    if (o.kind === 'water') shoreline(ctx, o, rng);
    else if (o.kind === 'rock') boulders(ctx, o);
  }
  // Much less noise than the original checkerboard-like forest scatter.
  for (let i = 0; i < 1750; i++) {
    const x = rng() * WORLD.width,
      y = rng() * WORLD.height;
    if (
      obstacles.some(
        (o) =>
          x > o.x - 45 &&
          x < o.x + o.w + 45 &&
          y > o.y - 45 &&
          y < o.y + o.h + 45,
      )
    )
      continue;
    const t = rng();
    if (t < 0.53) {
      ink(ctx, '#214e37', x, y + 3, 3, 8);
      ink(ctx, '#83a66b', x + 3, y + 1, 3, 7);
    } else if (t < 0.78) {
      ink(ctx, '#28533c', x, y + 3, 8, 3);
      ink(ctx, '#e2c88b', x + 2, y, 4, 3);
    } else {
      ink(ctx, '#66816c', x, y + 2, 8, 4);
      ink(ctx, '#a5b29c', x + 1, y, 5, 2);
    }
  }
  forge(ctx);
  // Ancient gate: weathered carved standing stones and an overgrown lintel.
  ink(ctx, '#263f36', 1764, 244, 143, 144);
  ink(ctx, '#778475', 1780, 231, 27, 141);
  ink(ctx, '#a5ae93', 1782, 232, 10, 128);
  ink(ctx, '#788574', 1851, 231, 27, 141);
  ink(ctx, '#a5af97', 1854, 234, 9, 128);
  ink(ctx, '#5d7562', 1771, 219, 117, 30);
  ink(ctx, '#aab49a', 1774, 219, 110, 13);
  ink(ctx, '#416a4b', 1778, 216, 23, 7);
  ink(ctx, '#416a4b', 1861, 220, 21, 7);
  ink(ctx, '#24453e', 1810, 248, 40, 124);
  ink(ctx, '#6e9a7d', 1824, 264, 13, 85);
}
