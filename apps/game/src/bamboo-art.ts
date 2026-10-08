import { BAMBOO_BRIDGE, BAMBOO_GATE_X, BAMBOO_WORLD_WIDTH, bambooRiverSpan, random } from '@panda/shared';
import { paintBambooFootbridge, paintEasternGate, paintMossboundShrine } from './bamboo-landmarks';

type P = { x: number; y: number };
const block = (
  c: CanvasRenderingContext2D,
  color: string,
  x: number,
  y: number,
  w: number,
  h: number,
) => {
  c.fillStyle = color;
  c.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
};
function fillPolygon(
  c: CanvasRenderingContext2D,
  vertices: readonly P[],
  color: string,
) {
  c.fillStyle = color;
  c.beginPath();
  vertices.forEach((p, i) => (i ? c.lineTo(p.x, p.y) : c.moveTo(p.x, p.y)));
  c.closePath();
  c.fill();
}

/** One east-west trail that continues from the forest's ancient gate. */
export function bambooTrailY(x: number): number {
  const first = Math.max(0, Math.min(1, (x - 1845) / 425));
  const second = Math.max(0, Math.min(1, (x - 2270) / 370));
  const smooth = (t: number) => t * t * (3 - 2 * t);
  return x <= 2270 ? 347 + 113 * smooth(first) : 460 - 28 * smooth(second);
}
function paintTrail(c: CanvasRenderingContext2D, start: number, end: number) {
  for (const [width, color] of [
    [110, '#2b513b'],
    [94, '#547047'],
    [80, '#887f56'],
    [70, '#aa9764'],
    [60, '#c8af77'],
  ] as const) {
    c.strokeStyle = color;
    c.lineWidth = width;
    c.lineCap = 'round';
    c.lineJoin = 'round';
    c.beginPath();
    for (let x = start; x <= end; x += 10) {
      const y = bambooTrailY(x);
      if (x === start) c.moveTo(x, y);
      else c.lineTo(x, y);
    }
    c.stroke();
  }
  const rng = random(64494 + start);
  for (let i = 0; i < 390; i++) {
    const x = start + rng() * (end - start);
    const y = bambooTrailY(x) + (rng() - 0.5) * 57;
    block(c, rng() > 0.6 ? '#e1cb90' : '#9c9267', x, y, 2 + rng() * 5, 2);
  }
}
function streamPolygon(pad: number): P[] {
  const left: P[] = [],
    right: P[] = [];
  for (let y = -16; y <= 1456; y += 8) {
    const span = bambooRiverSpan(y);
    left.push({ x: span.left - pad, y });
    right.push({ x: span.right + pad, y });
  }
  return left.concat(right.reverse());
}
function drawRiver(c: CanvasRenderingContext2D) {
  // Dark marsh edge, bank, shallows, moving-looking water stripes and deep middle.
  for (const [pad, color] of [
    [36, '#214c3b'],
    [28, '#6f865a'],
    [20, '#b4a171'],
    [12, '#5b9c93'],
    [4, '#448c90'],
    [-10, '#2c687a'],
  ] as const)
    fillPolygon(c, streamPolygon(pad), color);
  const rng = random(29184);
  for (let y = 17; y < 1430; y += 17) {
    const span = bambooRiverSpan(y);
    const x = span.left + 14 + rng() * 85;
    block(c, y % 4 ? '#5d9ba0' : '#9db9ad', x, y, 16 + rng() * 24, 2);
    if (rng() > 0.75) block(c, '#adc5ab', span.right - 20, y + 5, 8, 2);
  }
  for (let i = 0; i < 84; i++) {
    const y = rng() * 1420;
    const span = bambooRiverSpan(y);
    const side = i % 2 === 0 ? span.left - 29 : span.right + 21;
    block(c, '#57774e', side, y - 9, 3, 15);
    block(c, '#98ad68', side + 4, y - 12, 3, 13);
    if (i % 10 === 0) {
      block(c, '#e5cf9d', side - 4, y - 10, 10, 4);
      block(c, '#f9df98', side, y - 11, 3, 3);
    }
  }
}
/** Original woodland floor underneath remains visible; a broad dithered
 * palette transition prevents the artificial vertical line at the gate.
 */
export function bambooGroundBlend(x: number): number {
  const t = Math.max(0, Math.min(1, (x - (BAMBOO_GATE_X - 185)) / 385));
  return t * t * (3 - 2 * t);
}
function crossingGround(c: CanvasRenderingContext2D) {
  const rng = random(88661);
  for (let y = 0; y < 1440; y += 8) {
    for (let x = BAMBOO_GATE_X - 185; x < BAMBOO_WORLD_WIDTH; x += 8) {
      const blend = bambooGroundBlend(x);
      if (blend <= 0) continue;
      const field =
        Math.sin(x * 0.009 + Math.sin(y * 0.008) * 1.5) +
        Math.cos(y * 0.012 - x * 0.004);
      c.globalAlpha = blend;
      block(c, field > 0.65 ? '#54774b' : field < -0.6 ? '#385b42' : '#416749', x, y, 8, 8);
      if (rng() > 0.96) block(c, '#73915a', x + 2, y + 3, 4, 2);
    }
  }
  c.globalAlpha = 1;
  // Fewer, larger foliage islands rather than homogeneous leaf speckle.
  for (let i = 0; i < 380; i++) {
    const x = 1930 + rng() * (BAMBOO_WORLD_WIDTH - 1930);
    const y = rng() * 1440;
    const span = bambooRiverSpan(y);
    if (Math.abs(y - bambooTrailY(x)) < 108 || x > span.left - 55 && x < span.right + 55)
      continue;
    const palette = rng() > 0.4 ? '#819967' : '#456b48';
    block(c, palette, x, y, 8 + rng() * 11, 3);
    if (i % 8 === 0) {
      block(c, '#e0d29a', x + 3, y - 3, 4, 3);
      block(c, '#a2ad7b', x + 9, y - 7, 3, 5);
    }
  }
}
export function paintBambooCrossing(c: CanvasRenderingContext2D) {
  crossingGround(c);
  // The forest trail reaches the ancient gate; the new path continues east.
  paintTrail(c, 1580, BAMBOO_BRIDGE.x + 12);
  paintTrail(c, BAMBOO_BRIDGE.x + BAMBOO_BRIDGE.w - 9, 2718);
  drawRiver(c);
  paintBambooFootbridge(c);
  paintMossboundShrine(c);
  paintEasternGate(c);
  // Tiny west-bank stepping stones and southeast quiet bamboo garden.
  for (let i = 0; i < 7; i++) {
    const x = 2020 + i * 21,
      y = 549 + Math.sin(i * 0.9) * 12;
    block(c, '#536a5b', x - 2, y + 3, 17, 7);
    block(c, '#98a38c', x, y, 13, 5);
  }
  for (const [x, y] of [
    [2510, 600],
    [2715, 615],
    [2550, 855],
    [2710, 1010],
  ] as const) {
    for (let i = 0; i < 7; i++) {
      const px = x + (i % 4) * 10,
        py = y + Math.floor(i / 4) * 13;
      block(c, '#31593e', px, py + 4, 5, 10);
      block(c, '#a2b47a', px + 2, py, 4, 8);
    }
  }
}
