import { paintMiniFarmGrass } from './mini-farm-tiles';
import { WOODLAND, pixelOval } from './world-style';
import { regionLight } from './world-composition';
import {
  obstacles,
  random,
  WORLD,
  lakes,
  lakeSpan,
  sceneryFits,
  collides,
  type Obstacle,
  type ShorePoint,
} from '@panda/shared';

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
  const left: Point[] = [];
  const right: Point[] = [];
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
      const edge =
        Math.sin(t * 27) * 5 +
        Math.sin(t * 63 + 1) * 3 +
        (randomNumber() - 0.5) * wobble;
      left.push({ x: p.x + nx * (width + edge), y: p.y + ny * (width + edge) });
      right.push({
        x: p.x - nx * (width + edge),
        y: p.y - ny * (width + edge),
      });
    }
    const start = trailPoint(0);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.ellipse(start.x, start.y, width, width * 0.75, 0, 0, Math.PI * 2);
    ctx.fill();
    polygon(ctx, left.concat(right.reverse()), color);
  };
  // Moss bank, raised earth edge and a warm beaten footpath.
  drawBand(67, '#426c43', 13);
  drawBand(59, '#6b8150', 12);
  drawBand(52, '#a18e61', 11);
  drawBand(46, '#b6a070', 8);
  drawBand(39, '#c4ad7a', 6);
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
  for (let i = 0; i < 150; i++) {
    const t = randomNumber();
    const p = trailPoint(t);
    const next = trailPoint(Math.min(1, t + 0.004));
    const angle = Math.atan2(next.y - p.y, next.x - p.x);
    const side = (i % 2 ? 1 : -1) * (45 + randomNumber() * 17);
    const x = p.x - Math.sin(angle) * side;
    const y = p.y + Math.cos(angle) * side;
    ink(ctx, '#53774a', x - 3, y + 2, 10, 3);
    ink(ctx, '#89a461', x, y - 3, 2, 7);
    ink(ctx, '#6f9052', x + 4, y - 1, 2, 5);
    if (i % 6 === 0) {
      ink(ctx, '#7c8165', x - 8, y + 4, 5, 3);
      ink(ctx, '#b5b494', x - 8, y + 3, 3, 1);
    }
  }
  for (let i = 0; i < 400; i++) {
    const t = randomNumber();
    const p = trailPoint(t);
    const prev = trailPoint(Math.max(0, t - 0.004));
    const next = trailPoint(Math.min(1, t + 0.004));
    const a = Math.atan2(next.y - prev.y, next.x - prev.x);
    const side = (randomNumber() - 0.5) * 96;
    const x = p.x - Math.sin(a) * side,
      y = p.y + Math.cos(a) * side;
    const color = randomNumber() > 0.56 ? '#ab9065' : '#cbb784';
    ink(ctx, color, x, y, 2 + randomNumber() * 5, 2 + randomNumber() * 3);
  }
}
function clearing(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  rx: number,
  ry: number,
  seed: () => number,
) {
  const edge = Array.from({ length: 64 }, (_, i) => {
    const a = (i / 64) * Math.PI * 2;
    const r = 1 + Math.sin(a * 5) * 0.05 + Math.cos(a * 9) * 0.025;
    return { x: x + Math.cos(a) * rx * r, y: y + Math.sin(a) * ry * r };
  });
  polygon(ctx, edge, '#61804d');
  for (let k = 0; k < 280; k++) {
    const a = seed() * Math.PI * 2,
      r = Math.sqrt(seed());
    const x0 = x + Math.cos(a) * rx * r;
    const y0 = y + Math.sin(a) * ry * r;
    ink(
      ctx,
      r > 0.84 ? '#4f7448' : seed() > 0.5 ? '#879564' : '#708453',
      x0,
      y0,
      3 + seed() * 7,
      2 + seed() * 4,
    );
  }
}

function shoreline(
  ctx: CanvasRenderingContext2D,
  points: readonly ShorePoint[],
  rng: () => number,
) {
  const cx = points.reduce((sum, p) => sum + p.x, 0) / points.length;
  const cy = points.reduce((sum, p) => sum + p.y, 0) / points.length;
  const ring = (pad: number): Point[] =>
    points.map((p, i) => {
      const bank = pad > 0 ? pad * (0.8 + Math.sin(i * 0.43) * 0.16) : pad;
      const dx = p.x - cx,
        dy = p.y - cy;
      const length = Math.hypot(dx, dy);
      return { x: p.x + (dx / length) * bank, y: p.y + (dy / length) * bank };
    });
  // Continuous authored banks instead of four jittered rectangular edges.
  polygon(ctx, ring(29), WOODLAND.leafDark);
  polygon(ctx, ring(19), '#628454');
  polygon(ctx, ring(7), '#a2a078');
  polygon(ctx, ring(3), '#749d86');
  polygon(ctx, [...points], '#559494');
  polygon(ctx, ring(-8), '#48868b');
  polygon(ctx, ring(-19), '#3e7881');
  polygon(ctx, ring(-34), '#396f7c');
  polygon(ctx, ring(-52), '#356978');
  const top = Math.min(...points.map((p) => p.y));
  const bottom = Math.max(...points.map((p) => p.y));
  for (let i = 0; i < 36; i++) {
    const y = top + 12 + rng() * (bottom - top - 24);
    const span = lakeSpan(points, y);
    if (!span || span.right - span.left < 40) continue;
    const x = span.left + 12 + rng() * (span.right - span.left - 36);
    ink(ctx, rng() > 0.48 ? '#588f92' : '#2b737f', x, y, 5 + rng() * 16, 2);
  }
  // Broken reflected sky and floating gardens, clipped to the actual water.
  ctx.save();
  ctx.beginPath();
  points.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
  ctx.closePath();
  ctx.clip();
  for (let n = 0; n < 12; n++) {
    const y = top + 20 + n * 4;
    const span = lakeSpan(points, y);
    if (!span) continue;
    ink(
      ctx,
      n % 3 ? '#4b8991' : '#57969a',
      cx - 24 + Math.sin(n * 1.7) * 18,
      y,
      10 + rng() * 30,
      1,
    );
  }
  for (const fraction of [0.22, 0.59, 0.81]) {
    const p = ring(-18)[Math.floor(fraction * points.length)]!;
    for (let i = 0; i < 4; i++) {
      const x = p.x + i * 7,
        y = p.y + Math.sin(i * 3) * 7;
      ink(ctx, '#28625e', x - 3, y + 3, 13, 3);
      ink(ctx, '#6aab79', x, y, 9, 4);
      ink(ctx, '#a1ca8f', x + 1, y, 5, 1);
      ink(ctx, '#43886c', x + 4, y + 2, 2, 2);
      if (i === 1) {
        ink(ctx, '#efcccd', x + 2, y - 3, 5, 3);
        ink(ctx, '#ffe3a4', x + 3, y - 3, 2, 1);
      }
    }
  }
  ctx.restore();
  for (const fraction of [0.1, 0.34, 0.73]) {
    const p = ring(20)[Math.floor(fraction * points.length)]!;
    pixelOval(ctx, WOODLAND.leafDark, p.x, p.y + 1, 15, 5);
    pixelOval(ctx, WOODLAND.leaf, p.x - 2, p.y - 1, 11, 4);
    ink(ctx, WOODLAND.leafLight, p.x - 8, p.y - 2, 7, 2);
  }
  // Sparse, composed reed clusters leave most of the shoreline unobstructed.
  const reedBank = ring(16);
  for (const fraction of [0, 0.13, 0.38, 0.63, 0.84]) {
    const p = reedBank[Math.floor(fraction * points.length)]!;
    for (let n = 0; n < 3; n++) {
      ink(ctx, '#284f3d', p.x + n * 5, p.y - 9, 2, 12);
      ink(ctx, '#91a46a', p.x + n * 5 + 2, p.y - 12, 2, 12);
    }
    ink(ctx, '#dfc8b3', p.x - 5, p.y - 3, 6, 3);
  }
}
function forge(ctx: CanvasRenderingContext2D) {
  // Taller copper-roofed woodland smithy; footprint and interaction lanes
  // remain unchanged. The high gable is the hub's warm visual anchor.
  ink(ctx, WOODLAND.shadow, 228, 956, 186, 33);
  ink(ctx, WOODLAND.ink, 247, 897, 145, 70);
  ink(ctx, '#c39e6f', 255, 905, 127, 54);
  ink(ctx, '#dfc08b', 257, 905, 121, 7);
  for (let x = 258; x < 386; x += 24) {
    ink(ctx, WOODLAND.barkDark, x, 905, 6, 58);
    ink(ctx, WOODLAND.barkLight, x + 6, 910, 2, 44);
  }
  ink(ctx, '#8d7858', 250, 958, 143, 9);
  for (let i = 0; i < 7; i++) {
    ink(ctx, '#b4ae8c', 254 + i * 20, 959, 16, 4);
    ink(ctx, '#5d6350', 270 + i * 20, 960, 2, 6);
  }
  polygon(
    ctx,
    [
      { x: 228, y: 896 },
      { x: 293, y: 803 },
      { x: 349, y: 807 },
      { x: 414, y: 896 },
    ],
    WOODLAND.ink,
  );
  polygon(
    ctx,
    [
      { x: 238, y: 889 },
      { x: 296, y: 810 },
      { x: 347, y: 813 },
      { x: 404, y: 889 },
    ],
    '#76533d',
  );
  polygon(
    ctx,
    [
      { x: 245, y: 879 },
      { x: 297, y: 815 },
      { x: 345, y: 818 },
      { x: 397, y: 879 },
    ],
    '#a1794c',
  );
  for (let row = 0; row < 8; row++) {
    const y = 820 + row * 8;
    for (let x = 293 - row * 6; x < 349 + row * 6; x += 18) {
      ink(ctx, row % 2 ? '#826345' : '#957047', x, y, 15, 4);
      ink(ctx, '#c29c63', x + 1, y, 10, 1);
    }
  }
  // Patinated chimney stone and a distinct little window beneath the ridge.
  ink(ctx, WOODLAND.ink, 342, 796, 26, 52);
  ink(ctx, '#7a8370', 346, 799, 18, 45);
  for (let n = 0; n < 5; n++) ink(ctx, '#b5b18e', 347, 801 + n * 8, 13, 3);
  ink(ctx, WOODLAND.barkDark, 340, 790, 29, 7);
  ink(ctx, '#c0a36e', 342, 790, 25, 2);
  polygon(
    ctx,
    [
      { x: 282, y: 860 },
      { x: 308, y: 826 },
      { x: 335, y: 860 },
    ],
    WOODLAND.ink,
  );
  polygon(
    ctx,
    [
      { x: 289, y: 854 },
      { x: 308, y: 833 },
      { x: 328, y: 854 },
    ],
    '#d3b079',
  );
  ink(ctx, WOODLAND.barkDark, 299, 843, 18, 18);
  ink(ctx, WOODLAND.cream, 302, 846, 12, 12);
  ink(ctx, WOODLAND.bark, 307, 846, 3, 12);
  ink(ctx, '#ba9761', 240, 889, 165, 4);
  ink(ctx, '#e4c58a', 243, 889, 157, 1);
  ink(ctx, WOODLAND.barkDark, 265, 921, 41, 43);
  ink(ctx, '#46382b', 273, 927, 25, 37);
  ink(ctx, WOODLAND.bark, 271, 924, 3, 39);
  ink(ctx, WOODLAND.cream, 291, 944, 3, 3);
  ink(ctx, WOODLAND.barkDark, 323, 913, 39, 28);
  ink(ctx, '#efcd89', 328, 917, 29, 20);
  ink(ctx, WOODLAND.bark, 340, 918, 4, 19);
  ink(ctx, WOODLAND.bark, 328, 926, 28, 3);
  // Workbench and anvil sit beside the house, clear of Bramble's silhouette.
  ink(ctx, '#3b3430', 225, 1012, 62, 22);
  ink(ctx, '#875c43', 230, 1010, 53, 15);
  ink(ctx, '#f4b15e', 236, 1013, 39, 7);
  ink(ctx, '#e56e3c', 242, 1015, 29, 6);
  ink(ctx, '#414944', 304, 1022, 30, 8);
  ink(ctx, '#67716d', 306, 1013, 26, 8);
  ink(ctx, '#465955', 314, 1027, 10, 8);
  for (let n = 0; n < 3; n++) {
    ink(ctx, '#5a4730', 217 + n * 7, 963 - n * 3, 27, 9);
    ink(ctx, '#bf9461', 220 + n * 7, 966 - n * 3, 9, 4);
  }
  // A separate hearth anchors the east side, leaving the central camp open.
  for (let n = 0; n < 8; n++) {
    const angle = (n * Math.PI) / 4;
    ink(
      ctx,
      '#7e8976',
      570 + Math.cos(angle) * 18,
      1140 + Math.sin(angle) * 10,
      7,
      5,
    );
  }
  ink(ctx, '#5d402d', 554, 1142, 34, 5);
  polygon(
    ctx,
    [
      { x: 561, y: 1143 },
      { x: 565, y: 1127 },
      { x: 570, y: 1135 },
      { x: 577, y: 1120 },
      { x: 583, y: 1143 },
    ],
    '#d78648',
  );
  polygon(
    ctx,
    [
      { x: 567, y: 1143 },
      { x: 573, y: 1131 },
      { x: 578, y: 1143 },
    ],
    '#f4ce78',
  );
  // Camp furniture, lanterns, plants.
  ink(ctx, '#524738', 444, 1165, 62, 12);
  ink(ctx, '#c49a61', 447, 1160, 56, 7);
  ink(ctx, '#523e32', 473, 1149, 4, 15);
  ink(ctx, '#e4b766', 475, 1133, 11, 14);
  ink(ctx, '#f9e1a2', 478, 1136, 5, 7);
  ink(ctx, '#5e5638', 469, 1146, 21, 4);
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
/** Composed beds frame the trail and shoreline, rather than filling open lanes. */
export const woodlandBeds = [
  { x: 680, y: 1090, rx: 74, ry: 38, kind: 'fern' },
  { x: 770, y: 870, rx: 63, ry: 31, kind: 'flower' },
  { x: 1158, y: 1120, rx: 60, ry: 34, kind: 'fern' },
  { x: 1302, y: 1240, rx: 54, ry: 30, kind: 'flower' },
  { x: 1180, y: 470, rx: 76, ry: 36, kind: 'fern' },
  { x: 1430, y: 560, rx: 70, ry: 35, kind: 'flower' },
  { x: 590, y: 620, rx: 78, ry: 39, kind: 'fern' },
  { x: 300, y: 460, rx: 68, ry: 31, kind: 'flower' },
  { x: 430, y: 235, rx: 94, ry: 35, kind: 'fern' },
  { x: 850, y: 330, rx: 76, ry: 31, kind: 'flower' },
  { x: 1240, y: 155, rx: 90, ry: 33, kind: 'fern' },
  { x: 1680, y: 800, rx: 87, ry: 37, kind: 'fern' },
] as const;

export function trailDistance(x: number, y: number): number {
  let distance = Infinity;
  for (let n = 0; n <= 125; n++) {
    const p = trailPoint(n / 125);
    distance = Math.min(distance, Math.hypot(x - p.x, y - p.y));
  }
  return distance;
}
export function groundDetailFits(x: number, y: number): boolean {
  return (
    sceneryFits({ x: x - 12, y: y - 18, w: 24, h: 24 }) &&
    !collides(x, y, 22) &&
    trailDistance(x, y) > 78
  );
}
function fern(ctx: CanvasRenderingContext2D, x: number, y: number) {
  pixelOval(ctx, WOODLAND.shadow, x, y + 2, 12, 3);
  for (let n = 0; n < 4; n++) {
    const spread = 9 - n * 2;
    ink(ctx, WOODLAND.leaf, x - spread, y - n * 3, spread - 1, 2);
    ink(ctx, WOODLAND.leafLight, x + 1, y - n * 3 - 2, spread, 2);
  }
  ink(ctx, WOODLAND.leafLight, x, y - 11, 2, 12);
}
function shrub(ctx: CanvasRenderingContext2D, x: number, y: number) {
  pixelOval(ctx, WOODLAND.shadow, x, y + 3, 15, 4);
  pixelOval(ctx, WOODLAND.leafDark, x, y - 3, 13, 8);
  pixelOval(ctx, WOODLAND.leaf, x - 2, y - 6, 11, 6);
  pixelOval(ctx, WOODLAND.leafLight, x - 5, y - 8, 6, 3);
  ink(ctx, WOODLAND.leafSun, x - 6, y - 10, 4, 2);
}
function undergrowth(ctx: CanvasRenderingContext2D) {
  const rng = random(16082);
  for (const bed of woodlandBeds) {
    for (let n = 0; n < 23; n++) {
      const a = rng() * Math.PI * 2,
        r = Math.sqrt(rng());
      const x = bed.x + Math.cos(a) * bed.rx * r;
      const y = bed.y + Math.sin(a) * bed.ry * r;
      if (!groundDetailFits(x, y)) continue;
      if (n % 7 === 0) shrub(ctx, x, y);
      else if (bed.kind === 'fern' || n % 5 === 0) fern(ctx, x, y);
      else {
        ink(ctx, '#315f40', x - 3, y, 9, 3);
        ink(ctx, '#8aa36a', x, y - 7, 2, 8);
        ink(ctx, n % 3 ? '#d9c492' : '#c99bb6', x - 2, y - 9, 6, 3);
        ink(ctx, '#f7e6ba', x, y - 9, 2, 2);
      }
    }
  }
  for (const o of obstacles) {
    if (o.kind !== 'tree') continue;
    const x = o.x + o.w / 2,
      y = o.y + o.h;
    for (let n = 0; n < 3; n++) {
      const px = x + (n - 1) * 19,
        py = y + 12 + rng() * 10;
      if (!groundDetailFits(px, py)) continue;
      fern(ctx, px, py);
      ink(ctx, '#b39a59', px - 4, py + 6, 4, 2);
    }
  }
}

/** Ground props stay in the reserved hub and clear of NPC feet and labels. */
export const campProps = [
  { x: 201, y: 991, w: 25, h: 30, kind: 'barrel' },
  { x: 238, y: 1046, w: 25, h: 30, kind: 'barrel' },
  { x: 275, y: 1051, w: 26, h: 24, kind: 'crate' },
  { x: 431, y: 879, w: 42, h: 33, kind: 'tools' },
  { x: 518, y: 886, w: 65, h: 25, kind: 'herbs' },
  { x: 592, y: 1043, w: 30, h: 45, kind: 'sign' },
  { x: 195, y: 871, w: 30, h: 23, kind: 'fence' },
] as const;
function campDetails(ctx: CanvasRenderingContext2D) {
  // Short, broken flagstones connect the workshop with the warm trail apron.
  for (let i = 0; i < 7; i++) {
    const x = 297 + i * 14,
      y = 966 + i * 12;
    ink(ctx, '#566650', x, y + 3, 18, 7);
    ink(ctx, '#9a9a7b', x, y, 17, 7);
    ink(ctx, '#bcb497', x + 2, y, 10, 2);
  }
  // Brass roof trim, ivy climbing the western beam, glowing window sill.
  ink(ctx, '#d3b680', 244, 889, 159, 2);
  ink(ctx, '#e5be79', 324, 941, 39, 3);
  for (let i = 0; i < 11; i++) {
    const y = 903 + i * 5,
      x = 254 + Math.sin(i) * 4;
    ink(ctx, '#386044', x, y, 7, 5);
    ink(ctx, '#799358', x + 1, y, 3, 2);
  }
  for (const p of campProps) {
    ink(ctx, '#354f3b', p.x - 3, p.y + p.h - 3, p.w + 7, 7);
    switch (p.kind) {
      case 'barrel':
        ink(ctx, '#533b2d', p.x + 2, p.y, p.w - 4, p.h);
        ink(ctx, '#a57549', p.x + 4, p.y + 2, p.w - 8, p.h - 4);
        ink(ctx, '#c49a62', p.x + 6, p.y + 3, 4, p.h - 6);
        for (const dy of [7, 21])
          ink(ctx, '#637169', p.x + 1, p.y + dy, p.w - 2, 3);
        ink(ctx, '#d2ab74', p.x + 5, p.y, p.w - 10, 3);
        break;
      case 'crate':
        ink(ctx, '#65482f', p.x, p.y, p.w, p.h);
        ink(ctx, '#b68d56', p.x + 3, p.y + 3, p.w - 6, p.h - 6);
        for (let i = 0; i < 4; i++)
          ink(ctx, '#dfb778', p.x + 4 + i * 5, p.y + 3 + i * 4, 5, 4);
        break;
      case 'tools':
        ink(ctx, '#493f30', p.x, p.y, p.w, 4);
        for (let i = 0; i < 3; i++) {
          ink(ctx, '#c29157', p.x + 8 + i * 13, p.y + 4, 3, 23);
          ink(ctx, '#8faaa2', p.x + 4 + i * 13, p.y + 6, 12, 5);
          ink(ctx, '#d0d4b5', p.x + 4 + i * 13, p.y + 6, 8, 2);
        }
        break;
      case 'herbs':
        ink(ctx, '#604a34', p.x, p.y + 10, p.w, 13);
        ink(ctx, '#a08351', p.x, p.y + 9, p.w, 4);
        for (let i = 0; i < 5; i++) {
          fern(ctx, p.x + 7 + i * 12, p.y + 12);
          ink(ctx, '#ceafd1', p.x + 7 + i * 12, p.y + 1, 3, 3);
        }
        break;
      case 'sign':
        ink(ctx, '#795535', p.x + 12, p.y, 5, p.h);
        ink(ctx, '#533e2c', p.x, p.y + 3, p.w, 15);
        ink(ctx, '#d0ad72', p.x + 2, p.y + 4, p.w - 4, 11);
        ink(ctx, '#735939', p.x + 5, p.y + 8, 11, 3);
        ink(ctx, '#735939', p.x + 8, p.y + 11, 4, 3);
        ink(ctx, '#735939', p.x + 17, p.y + 6, 3, 6);
        break;
      case 'fence':
        for (let i = 0; i < 2; i++) {
          ink(ctx, '#665135', p.x + i * (p.w - 6), p.y, 6, p.h);
          ink(ctx, '#c3a46a', p.x + i * (p.w - 6), p.y, 3, p.h - 3);
        }
        ink(ctx, '#96784c', p.x, p.y + 6, p.w, 4);
        ink(ctx, '#bea166', p.x, p.y + 6, p.w, 1);
        break;
    }
  }
  // A rolled blanket and a cup beside the fire tell a quiet camp story.
  ink(ctx, '#38595b', 594, 1155, 22, 9);
  ink(ctx, '#76a2a0', 594, 1155, 22, 3);
  ink(ctx, '#b4ad89', 544, 1163, 5, 5);
}

export function paintForestWorld(ctx: CanvasRenderingContext2D): void {
  ctx.imageSmoothingEnabled = false;
  const rng = random(93104);
  ink(ctx, WOODLAND.shadow, 0, 0, WORLD.width, WORLD.height);
  // Mini Farm CC0 grass base. Large-scale meadow highlights break repeated tile edges.
  paintMiniFarmGrass(ctx, WORLD.width, WORLD.height);
  ctx.fillStyle = 'rgba(47, 139, 52, 0.07)';
  for (let n = 0; n < 120; n++) {
    const x = rng() * WORLD.width;
    const y = rng() * WORLD.height;
    ctx.fillRect(Math.floor(x / 16) * 16, Math.floor(y / 16) * 16, 32, 16);
  }
  // Sparse leaf litter ties trunks to the groves. Contact shadows belong to
  // the tree sprites, keeping the floor free of repeated circular patches.
  for (const tree of obstacles) {
    if (tree.kind !== 'tree') continue;
    const x = tree.x + tree.w / 2,
      y = tree.y + tree.h;
    for (let n = 0; n < 10; n++) {
      const px = x + (rng() - 0.5) * 68,
        py = y + (rng() - 0.5) * 22;
      ink(ctx, n % 3 ? '#63734a' : '#92845b', px, py, 4, 2);
    }
  }
  // Camp and boss clearing are made first, so the path meets them cleanly.
  clearing(ctx, 430, 1030, 235, 155, rng);
  clearing(ctx, 1580, 340, 188, 145, rng);
  stampRoad(ctx, rng);
  for (const lake of lakes) shoreline(ctx, lake, rng);
  for (const o of obstacles) if (o.kind === 'rock') boulders(ctx, o);
  // Much less noise than the original checkerboard-like forest scatter.
  for (let i = 0; i < 360; i++) {
    const x = rng() * WORLD.width,
      y = rng() * WORLD.height;
    if (
      collides(x, y, 18) ||
      trailDistance(x, y) < 78 ||
      !sceneryFits({ x, y: y - 12, w: 12, h: 24 }) ||
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
  // Farm-adjacent meadow accents: deterministic, sparse and away from paths
  // and the crop grid, so these details never suggest blocking obstacles.
  for (let n = 0; n < 230; n++) {
    const x = 190 + rng() * 690;
    const y = 1070 + rng() * 345;
    if (x > 355 && x < 745 && y > 1165) continue;
    if (collides(x, y, 15) || trailDistance(x, y) < 72) continue;
    const variant = rng();
    if (variant < 0.4) {
      ink(ctx, '#426d42', x + 2, y, 2, 8);
      ink(ctx, '#95aa64', x - 1, y + 4, 3, 4);
      ink(ctx, '#a9bf78', x + 5, y + 2, 2, 5);
    } else if (variant < 0.78) {
      ink(ctx, '#4d7849', x + 3, y + 3, 2, 5);
      ink(ctx, variant < 0.59 ? '#f4d8a1' : '#e6abb7', x, y, 7, 4);
      ink(ctx, '#f9ebbd', x + 2, y + 1, 2, 2);
    } else {
      ink(ctx, '#997c55', x, y + 3, 9, 3);
      ink(ctx, '#c2a477', x + 2, y + 2, 4, 2);
    }
  }
  undergrowth(ctx);
  polygon(
    ctx,
    [
      { x: 223, y: 994 },
      { x: 270, y: 978 },
      { x: 335, y: 988 },
      { x: 348, y: 1038 },
      { x: 303, y: 1093 },
      { x: 228, y: 1082 },
    ],
    '#7b7956',
  );
  for (let n = 0; n < 26; n++) {
    const x = 240 + rng() * 88,
      y = 997 + rng() * 70;
    ink(ctx, '#a39b72', x, y, 8, 2);
  }
  forge(ctx);
  campDetails(ctx);
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
