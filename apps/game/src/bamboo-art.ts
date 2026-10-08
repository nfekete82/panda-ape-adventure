import {
  BAMBOO_BRIDGE,
  BAMBOO_GATE_X,
  BAMBOO_SHRINE,
  BAMBOO_WORLD_WIDTH,
  bambooRiverSpan,
  random,
} from '@panda/shared';

type P = { x: number; y: number };
const block = (c: CanvasRenderingContext2D, color: string, x: number, y: number, w: number, h: number) => {
  c.fillStyle = color;
  c.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
};
function fillPolygon(c: CanvasRenderingContext2D, vertices: readonly P[], color: string) {
  c.fillStyle = color;
  c.beginPath();
  vertices.forEach((p, i) => i ? c.lineTo(p.x, p.y) : c.moveTo(p.x, p.y));
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
    [110, '#2b513b'], [94, '#547047'], [80, '#887f56'],
    [70, '#aa9764'], [60, '#c8af77'],
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
  const left: P[] = [], right: P[] = [];
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
    [36, '#214c3b'], [28, '#6f865a'], [20, '#b4a171'],
    [12, '#5b9c93'], [4, '#448c90'], [-10, '#2c687a'],
  ] as const) fillPolygon(c, streamPolygon(pad), color);
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
function drawBridge(c: CanvasRenderingContext2D) {
  const { x, y, w, h } = BAMBOO_BRIDGE;
  // The walkway is full-width and lies precisely over the authoritative dry gap.
  block(c, '#17372f', x - 9, y - 10, w + 18, h + 20);
  block(c, '#574431', x - 6, y - 6, w + 12, h + 12);
  block(c, '#97764f', x - 2, y + 3, w + 4, h - 6);
  block(c, '#c4a16d', x + 2, y + 7, w - 4, h - 16);
  for (let i = 0; i < w / 11; i++) {
    const px = x + i * 11;
    block(c, i % 3 === 0 ? '#d3b583' : '#af8c5d', px, y + 7, 8, h - 15);
    block(c, '#71583b', px + 8, y + 7, 2, h - 15);
    block(c, '#d9c092', px + 2, y + 12, 3, 2);
    block(c, '#574631', px + 5, y + h - 20, 2, 2);
  }
  for (const edge of [y - 15, y + h + 5]) {
    block(c, '#3d4434', x - 12, edge + 4, w + 24, 8);
    block(c, '#a77e52', x - 10, edge, w + 20, 7);
    block(c, '#d4af77', x - 10, edge, w + 20, 3);
    for (const dx of [8, 74, 140, 202]) {
      block(c, '#4d4834', x + dx - 3, edge - 20, 13, 28);
      block(c, '#aa8355', x + dx, edge - 22, 7, 27);
      block(c, '#e5bd85', x + dx, edge - 22, 7, 3);
    }
  }
}
function drawRuin(c: CanvasRenderingContext2D) {
  const { x, y } = BAMBOO_SHRINE;
  // Semi-circular stone court beneath broken pillars: mysterious, non-blocking.
  c.fillStyle = '#536a53';
  c.beginPath();
  c.ellipse(x, y + 37, 134, 87, -0.05, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = '#849077';
  c.beginPath();
  c.ellipse(x, y + 39, 117, 69, -0.05, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = '#a6aa89';
  c.beginPath();
  c.ellipse(x, y + 42, 101, 52, -0.05, 0, Math.PI * 2);
  c.fill();
  const rng = random(379);
  for (let i = 0; i < 62; i++) {
    const dx = (rng() - 0.5) * 185, dy = (rng() - 0.5) * 82;
    block(c, i % 2 ? '#939f86' : '#7a8878', x + dx, y + 20 + dy, 9 + rng() * 18, 3);
  }
  // Two ancient columns and a fractured lintel make a shrine, not a city gate.
  for (const px of [x - 104, x + 82]) {
    block(c, '#29483f', px + 6, y - 106, 34, 123);
    block(c, '#637e70', px, y - 109, 32, 109);
    block(c, '#a7ad93', px + 3, y - 109, 11, 102);
    block(c, '#425e54', px + 22, y - 99, 8, 85);
    block(c, '#b4af88', px - 5, y - 110, 43, 11);
    block(c, '#5f7c5a', px + 5, y - 123, 25, 6);
    block(c, '#a9a68a', px - 9, y, 50, 14);
  }
  block(c, '#41594f', x - 81, y - 128, 152, 16);
  block(c, '#849981', x - 74, y - 133, 145, 10);
  block(c, '#b5b397', x - 62, y - 132, 127, 3);
  for (let i = 0; i < 9; i++) {
    const px = x - 67 + i * 16;
    block(c, '#577a5b', px, y - 134, 6, 7);
  }
  // Quiet emerald altar. A discovery landmark, not an invented quest giver.
  block(c, '#29483e', x - 30, y + 9, 63, 39);
  block(c, '#6e826e', x - 27, y + 6, 57, 31);
  block(c, '#98a48c', x - 22, y + 4, 48, 8);
  fillPolygon(c, [
    { x, y: y - 39 }, { x: x + 16, y: y - 17 },
    { x, y: y + 4 }, { x: x - 16, y: y - 17 },
  ], '#336e69');
  fillPolygon(c, [
    { x, y: y - 32 }, { x: x + 10, y: y - 16 },
    { x, y: y - 3 }, { x: x - 10, y: y - 16 },
  ], '#81c3a0');
  block(c, '#d1dfb0', x - 4, y - 26, 5, 13);
}
function crossingGround(c: CanvasRenderingContext2D) {
  const rng = random(88661);
  for (let y = 0; y < 1440; y += 8)
    for (let x = BAMBOO_GATE_X; x < BAMBOO_WORLD_WIDTH; x += 8) {
      const field = Math.sin(x * 0.012 + y * 0.005) + Math.cos(y * 0.015 - x * 0.003);
      block(c,
        field > 0.5 ? '#40694b' : field < -0.6 ? '#315943' : '#3a6247',
        x, y, 8, 8,
      );
      if (rng() > 0.95) block(c, '#537950', x + 2, y + 3, 3, 2);
    }
  // Intentional bamboo leaf litter in groves. Avoid the travel corridor.
  for (let i = 0; i < 870; i++) {
    const x = BAMBOO_GATE_X + rng() * (BAMBOO_WORLD_WIDTH - BAMBOO_GATE_X);
    const y = rng() * 1440;
    if (Math.abs(y - bambooTrailY(x)) < 85 || Math.abs(x - 2285) < 68) continue;
    block(c, rng() > 0.65 ? '#a1a26b' : '#537a50', x, y, 5 + rng() * 7, 2);
  }
}
export function paintBambooCrossing(c: CanvasRenderingContext2D) {
  crossingGround(c);
  // The forest trail reaches the ancient gate; the new path continues east.
  paintTrail(c, 1820, BAMBOO_BRIDGE.x + 12);
  paintTrail(c, BAMBOO_BRIDGE.x + BAMBOO_BRIDGE.w - 9, 2718);
  drawRiver(c);
  drawBridge(c);
  drawRuin(c);
  // Tiny west-bank stepping stones and southeast quiet bamboo garden.
  for (let i = 0; i < 7; i++) {
    const x = 2020 + i * 21, y = 549 + Math.sin(i * 0.9) * 12;
    block(c, '#536a5b', x - 2, y + 3, 17, 7);
    block(c, '#98a38c', x, y, 13, 5);
  }
  for (const [x, y] of [[2510, 600], [2715, 615], [2550, 855], [2710, 1010]] as const) {
    for (let i = 0; i < 7; i++) {
      const px = x + (i % 4) * 10, py = y + Math.floor(i / 4) * 13;
      block(c, '#31593e', px, py + 4, 5, 10);
      block(c, '#a2b47a', px + 2, py, 4, 8);
    }
  }
}
