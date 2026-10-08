import {
  BAMBOO_BRIDGE,
  BAMBOO_SHRINE,
  bambooRiverSpan,
  random,
} from '@panda/shared';

type Canvas = CanvasRenderingContext2D;
type Point = { x: number; y: number };
const px = (c: Canvas, color: string, x: number, y: number, w: number, h: number) => {
  c.fillStyle = color;
  c.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
};
const polygon = (c: Canvas, points: Point[], color: string) => {
  c.fillStyle = color;
  c.beginPath();
  points.forEach((p, i) => i ? c.lineTo(p.x, p.y) : c.moveTo(p.x, p.y));
  c.closePath();
  c.fill();
};

/** Re-paint the gate after the connecting path: the road now travels beneath
 * the doorway instead of covering the stone silhouette with a thick ribbon.
 */
export function paintEasternGate(c: Canvas): void {
  // Two weathered ruins frame a wide, clear route at y≈347.
  for (const x of [1760, 1908]) {
    px(c, '#213c35', x - 4, 236, 28, 98);
    px(c, '#67796a', x, 235, 24, 91);
    px(c, '#adb399', x + 2, 235, 9, 80);
    px(c, '#455f53', x + 18, 244, 5, 74);
    px(c, '#9fa38c', x - 4, 236, 32, 9);
    px(c, '#486a4d', x, 230, 19, 6);
    px(c, '#a6aa90', x - 8, 322, 40, 11);
    px(c, '#496d50', x - 6, 330, 14, 4);
  }
  px(c, '#263e36', 1773, 214, 153, 19);
  px(c, '#778b75', 1775, 208, 151, 16);
  px(c, '#b4b59c', 1780, 205, 140, 6);
  for (let i = 0; i < 7; i++) {
    const x = 1785 + i * 21;
    px(c, '#476c50', x, 201 + (i % 2) * 2, 11, 7);
    px(c, '#9cae79', x + 2, 201, 7, 2);
  }
}

/** Narrow footbridge: visible planks, shallow perspective, delicate side rails
 * and bank-connected entry aprons. The shared bridge collision remains untouched.
 */
export function paintBambooFootbridge(c: Canvas): void {
  const { x, y, w, h } = BAMBOO_BRIDGE;
  // Footings below the deck create depth without painting a giant crate.
  px(c, '#213d32', x - 11, y - 2, w + 22, h + 12);
  px(c, '#65513b', x - 7, y + 1, w + 14, h + 5);
  px(c, '#aa865c', x - 5, y + 5, w + 10, h - 4);
  px(c, '#d4b584', x + 1, y + 9, w - 2, h - 15);
  // The deck end grain joins naturally into the approach instead of a wall.
  for (let i = 0; i < 18; i++) {
    const sx = x + i * 12;
    px(c, i % 3 ? '#cba77a' : '#bb9369', sx, y + 9, 10, h - 16);
    px(c, '#71563f', sx + 10, y + 9, 2, h - 16);
    px(c, '#edcb96', sx + 2, y + 13, 5, 2);
    if (i % 2 === 0) {
      px(c, '#796348', sx + 4, y + 24, 2, 2);
      px(c, '#796348', sx + 7, y + h - 24, 2, 2);
    }
  }
  // Fine railings are elevated by a few pixels, not solid wood barriers.
  for (const [railY, side] of [[y - 7, -1], [y + h + 4, 1]] as const) {
    px(c, '#3b4134', x - 10, railY + 4, w + 20, 5);
    px(c, '#98704a', x - 10, railY, w + 20, 6);
    px(c, '#dfbb83', x - 7, railY, w + 14, 2);
    for (const dx of [10, 73, 139, 195]) {
      // Uprights never intrude far into the actual walkable corridor.
      const py = railY + (side > 0 ? -3 : -12);
      px(c, '#574734', x + dx - 3, py, 10, 19);
      px(c, '#b8915f', x + dx, py, 5, 16);
      px(c, '#e7c58a', x + dx, py, 5, 2);
    }
  }
  // Light gaps / shadows below planks.
  px(c, '#4b4233', x - 3, y + h - 8, w + 5, 3);
  px(c, '#e4bc84', x, y + 9, w, 2);
}

function outlinedMossStone(c: Canvas, x: number, y: number, w: number, h: number, tall = false) {
  px(c, '#283e37', x - 3, y - 3, w + 6, h + 6);
  px(c, '#60756b', x, y, w, h);
  px(c, '#abb29a', x + 3, y, Math.max(4, w / 3), h - 4);
  px(c, '#425d51', x + w - 8, y + 7, 7, h - 7);
  px(c, '#8fa589', x - 2, y - 4, w + 5, 7);
  px(c, '#3d714d', x + 3, y - 7, Math.max(4, w / 2), 4);
  px(c, '#afbb84', x + 7, y - 8, 7, 2);
  if (tall) {
    px(c, '#43674b', x + w - 6, y + 14, 7, 9);
    px(c, '#79a36a', x + w - 11, y + 23, 6, 5);
    px(c, '#456b4a', x + 2, y + h - 28, 6, 13);
  }
}

/** Mossbound Shrine is the visual reward at the far end of the bridge,
 * intentionally background-only: no hidden solids or new gameplay rules.
 */
export function paintMossboundShrine(c: Canvas): void {
  const { x, y } = BAMBOO_SHRINE;
  const rng = random(40850);
  c.fillStyle = '#2d5642';
  c.beginPath();
  c.ellipse(x, y + 36, 152, 103, -0.06, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = '#647959';
  c.beginPath();
  c.ellipse(x, y + 37, 142, 91, -0.06, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = '#8e9880';
  c.beginPath();
  c.ellipse(x, y + 37, 123, 74, -0.06, 0, Math.PI * 2);
  c.fill();
  // Stepped large flagstones, dirt seams and tiny cracks replace a plain disc.
  for (let i = 0; i < 102; i++) {
    const dx = (rng() - 0.5) * 220;
    const dy = (rng() - 0.5) * 120;
    if ((dx / 120) ** 2 + (dy / 72) ** 2 > 0.91) continue;
    const px0 = x + dx, py0 = y + 36 + dy;
    px(c, i % 3 === 0 ? '#aeb19a' : '#7f8f7d', px0, py0, 11 + rng() * 21, 4);
    px(c, '#465e50', px0 + 3, py0 + 5, 4, 2);
  }
  // Semi-circular broken outer stones imply an ancient enclosure.
  for (let i = 0; i < 13; i++) {
    const t = (-0.05 + i / 12) * Math.PI;
    const px0 = x + Math.cos(t) * 132;
    const py0 = y + 37 + Math.sin(t) * 76;
    outlinedMossStone(c, px0 - 8, py0, 13, 12);
  }
  // Asymmetrical columns, capitals and ruined masonry.
  outlinedMossStone(c, x - 113, y - 100, 28, 94, true);
  outlinedMossStone(c, x + 79, y - 114, 28, 108, true);
  outlinedMossStone(c, x - 139, y - 31, 23, 34);
  outlinedMossStone(c, x + 115, y - 26, 23, 34);
  px(c, '#243d35', x - 91, y - 126, 179, 16);
  px(c, '#718976', x - 88, y - 132, 175, 12);
  px(c, '#bcc0a5', x - 77, y - 135, 164, 5);
  for (let i = 0; i < 12; i++) {
    const xx = x - 82 + i * 14;
    px(c, '#456e4c', xx, y - 136 + (i % 3) * 2, 8, 7);
    px(c, '#8fa871', xx + 2, y - 137, 4, 2);
  }
  // Ancient altar and emerald centerpiece, still reachable from the south.
  px(c, '#263f37', x - 37, y + 7, 76, 46);
  px(c, '#617d6c', x - 33, y + 5, 68, 36);
  px(c, '#a7af94', x - 29, y + 3, 61, 9);
  px(c, '#d1c8a3', x - 21, y + 5, 15, 2);
  polygon(c, [
    { x, y: y - 46 }, { x: x + 22, y: y - 19 },
    { x, y: y + 10 }, { x: x - 22, y: y - 19 },
  ], '#275953');
  polygon(c, [
    { x, y: y - 38 }, { x: x + 14, y: y - 18 },
    { x, y: y + 1 }, { x: x - 14, y: y - 18 },
  ], '#74b6a2');
  px(c, '#d7ead0', x - 6, y - 33, 5, 15);
  // Two small garden lanterns frame the entrance but leave the reward exposed.
  for (const lx of [x - 76, x + 72]) {
    px(c, '#2c4239', lx - 5, y + 48, 12, 9);
    px(c, '#a1a788', lx - 3, y + 31, 8, 19);
    px(c, '#f0d59b', lx - 2, y + 33, 6, 7);
    px(c, '#556f60', lx - 7, y + 29, 16, 5);
    px(c, '#a0a780', lx - 6, y + 26, 14, 3);
  }
  // Moss, little violet flowers, small leaf clumps at the perimeter.
  for (let i = 0; i < 34; i++) {
    const theta = (i / 34) * Math.PI * 2;
    const rx = 141 + (i % 5) * 3;
    const ry = 89 + (i % 4) * 3;
    const fx = x + Math.cos(theta) * rx;
    const fy = y + 39 + Math.sin(theta) * ry;
    px(c, i % 4 ? '#47734e' : '#779459', fx, fy, 11, 4);
    if (i % 6 === 0) {
      px(c, '#a2a5d7', fx + 5, fy - 4, 5, 5);
      px(c, '#ebdb92', fx + 6, fy - 3, 2, 2);
    }
  }
}

/** Quiet riverbank life placed deterministically on actual shared banks.
 * No art suggests stepping-stones that would be blocked by collision.
 */
export function paintRiverbankDetails(c: Canvas): void {
  const rng = random(72942);
  for (let y = 28; y < 1425; y += 30) {
    if (Math.abs(y - (BAMBOO_BRIDGE.y + BAMBOO_BRIDGE.h / 2)) < 95)
      continue;
    const span = bambooRiverSpan(y);
    for (const x of [span.left - 17, span.right + 9]) {
      const jitter = (rng() - 0.5) * 14;
      const stoneX = x + jitter;
      if (rng() > 0.58) {
        px(c, '#344f47', stoneX - 4, y + 3, 19, 8);
        px(c, '#83998a', stoneX - 2, y, 15, 6);
        px(c, '#b1b4a0', stoneX + 1, y - 1, 6, 3);
        px(c, '#496e51', stoneX + 10, y + 6, 6, 3);
      } else {
        for (let n = 0; n < 3; n++) {
          const xx = stoneX + n * 5;
          px(c, '#3b664c', xx, y - 7 - n * 2, 4, 13 + n * 2);
          px(c, '#a1b67a', xx + 1, y - 11 - n * 2, 2, 9);
        }
      }
    }
  }
  // Water plants are deliberately inside the authoritative wet span.
  for (const y of [105, 255, 635, 795, 1015, 1190, 1360]) {
    const span = bambooRiverSpan(y);
    const x = span.left + 29 + rng() * Math.max(15, span.right - span.left - 75);
    c.fillStyle = '#306c60';
    c.beginPath();
    c.ellipse(x + 3, y + 4, 17, 8, 0, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = '#719875';
    c.beginPath();
    c.ellipse(x, y + 2, 13, 6, -0.12, 0, Math.PI * 2);
    c.fill();
    px(c, '#a7bf82', x - 6, y, 9, 2);
    if (y % 3 === 0) {
      px(c, '#edbfd0', x + 3, y - 7, 9, 6);
      px(c, '#f6df9a', x + 6, y - 5, 3, 3);
    }
  }
}
