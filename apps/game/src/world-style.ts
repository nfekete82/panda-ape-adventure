/** Original woodland colour script: cool ink, moss midtones, honey highlights. */
export const WOODLAND = {
  ink: '#20352f',
  shadow: '#2c5140',
  leafDark: '#365e43',
  leaf: '#527c4b',
  leafLight: '#759553',
  leafSun: '#a3af6a',
  barkDark: '#533d2f',
  bark: '#8b6340',
  barkLight: '#bd965d',
  stone: '#768574',
  stoneLight: '#b4b69a',
  cream: '#f2dfac',
  water: '#447f86',
} as const;
export type TreeKind = 'broadleaf' | 'conifer';
export type WoodlandEnemy = 'slime' | 'wolf' | 'wisp' | 'guardian';
export const TREE_FRAME = { width: 128, height: 160, originY: 0.94 };
export const ENEMY_FRAME = { width: 64, height: 64 };

type Canvas = Pick<CanvasRenderingContext2D, 'fillStyle' | 'fillRect'>;
export function pixel(
  c: Canvas,
  color: string,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  c.fillStyle = color;
  c.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}
/** Stepped silhouettes use the same two-pixel edge language on every species. */
export function pixelOval(
  c: Canvas,
  color: string,
  x: number,
  y: number,
  rx: number,
  ry: number,
) {
  for (let row = -ry; row <= ry; row += 2) {
    const half =
      Math.floor(
        (rx * Math.sqrt(Math.max(0, 1 - (row * row) / (ry * ry)))) / 2,
      ) * 2;
    pixel(c, color, x - half, y + row, half * 2, 2);
  }
}
function leafCrown(c: Canvas, x: number, y: number, rx: number, ry: number) {
  pixelOval(c, WOODLAND.ink, x, y + 2, rx + 2, ry + 2);
  pixelOval(c, WOODLAND.leafDark, x, y, rx, ry);
  pixelOval(c, WOODLAND.leaf, x - 2, y - 4, rx - 2, ry - 3);
  pixelOval(
    c,
    WOODLAND.leafLight,
    x - rx * 0.22,
    y - ry * 0.38,
    rx * 0.64,
    ry * 0.46,
  );
  // Few chunky leaf planes, rather than hundreds of disconnected speckles.
  for (let n = 0; n < 7; n++) {
    const px = x - rx * 0.6 + n * rx * 0.18;
    const py = y - ry * 0.3 + Math.sin(n * 2.3) * ry * 0.23;
    pixel(c, n % 3 ? WOODLAND.leafLight : WOODLAND.leafSun, px, py, 6, 2);
    pixel(c, WOODLAND.leafDark, px + 3, py + 5, 5, 2);
  }
}
export function paintWoodlandTree(c: Canvas, kind: TreeKind) {
  pixel(c, WOODLAND.ink, 54, 89, 23, 56);
  pixel(c, WOODLAND.barkDark, 57, 91, 17, 53);
  pixel(c, WOODLAND.bark, 59, 92, 11, 49);
  pixel(c, WOODLAND.barkLight, 59, 98, 3, 35);
  pixel(c, WOODLAND.barkDark, 47, 139, 38, 8);
  pixel(c, WOODLAND.bark, 49, 137, 12, 7);
  pixel(c, WOODLAND.bark, 69, 137, 13, 7);
  pixel(c, WOODLAND.barkLight, 49, 137, 8, 2);
  pixel(c, WOODLAND.ink, 72, 116, 2, 12);
  // One continuous crown silhouette. Internal leaf masses share lighting;
  // dark outlines belong only to the outside, avoiding stacked disc seams.
  const lobes = [
    [38, 66, 27, 25],
    [88, 66, 28, 28],
    [62, 43, 35, 30],
    [63, 87, 37, 23],
  ] as const;
  const firTiers = [
    [8, 40, 22],
    [28, 64, 32],
    [50, 88, 40],
    [74, 112, 46],
  ] as const;
  const halfWidth = (y: number) => {
    let left = 64,
      right = 64;
    if (kind === 'broadleaf') {
      for (const [cx, cy, rx, ry] of lobes) {
        const dy = (y - cy) / ry;
        if (Math.abs(dy) > 1) continue;
        const half = rx * Math.sqrt(1 - dy * dy);
        left = Math.min(left, cx - half);
        right = Math.max(right, cx + half);
      }
    } else {
      let width = 0;
      for (const [top, bottom, maximum] of firTiers)
        if (y >= top && y <= bottom)
          width = Math.max(width, ((y - top) / (bottom - top)) * maximum);
      left = 64 - width;
      right = 64 + width;
    }
    return { left: Math.floor(left / 2) * 2, right: Math.ceil(right / 2) * 2 };
  };
  for (let y = 8; y <= 112; y += 2) {
    const span = halfWidth(y);
    if (span.right - span.left < 4) continue;
    pixel(c, WOODLAND.ink, span.left, y + 2, span.right - span.left, 2);
    const shade =
      y > 94 ? WOODLAND.leafDark : y > 70 ? WOODLAND.leaf : WOODLAND.leafLight;
    pixel(c, shade, span.left + 2, y, span.right - span.left - 4, 2);
    pixel(c, WOODLAND.shadow, span.right - 4, y, 2, 2);
  }
  // Large quiet leaf planes, concentrated towards the upper-left sunlight.
  for (let n = 0; n < 50; n++) {
    const y = 20 + ((n * 37) % 82);
    const span = halfWidth(y);
    const available = span.right - span.left - 14;
    if (available < 8) continue;
    const x = span.left + 4 + ((n * 19) % available);
    const light = y < 75 && x < 72;
    pixel(
      c,
      light ? WOODLAND.leafSun : WOODLAND.leafLight,
      x,
      y,
      6 + (n % 3) * 2,
      2,
    );
    pixel(
      c,
      light ? WOODLAND.leafLight : WOODLAND.leafDark,
      x + 2,
      y + 2,
      6,
      2,
    );
  }
}
function eyes(c: Canvas, x: number, y: number, gap: number) {
  for (const dx of [0, gap]) {
    pixel(c, WOODLAND.ink, x + dx, y, 4, 6);
    pixel(c, WOODLAND.cream, x + dx, y, 2, 2);
  }
}
export function paintWoodlandEnemy(c: Canvas, kind: WoodlandEnemy) {
  if (kind === 'slime') {
    pixelOval(c, WOODLAND.ink, 32, 42, 27, 17);
    pixelOval(c, '#426f69', 32, 40, 25, 16);
    pixelOval(c, '#69a6a0', 30, 35, 22, 13);
    pixelOval(c, '#a2cdc0', 24, 30, 12, 6);
    pixel(c, '#d3e2c3', 18, 28, 8, 2);
    pixel(c, '#355c58', 12, 50, 11, 3);
    pixel(c, '#355c58', 42, 48, 11, 3);
    eyes(c, 23, 39, 15);
    pixel(c, '#365f59', 29, 47, 7, 2);
    pixel(c, '#d5bd90', 15, 44, 4, 2);
    pixel(c, '#d5bd90', 45, 44, 4, 2);
  } else if (kind === 'wolf') {
    // Russet woodland wolf, cream muzzle, dark paws and generous readable ears.
    pixelOval(c, WOODLAND.ink, 26, 39, 20, 13);
    pixelOval(c, '#8e4e37', 26, 37, 18, 11);
    pixelOval(c, '#b76d43', 24, 34, 16, 8);
    pixel(c, WOODLAND.ink, 8, 45, 9, 12);
    pixel(c, WOODLAND.ink, 34, 44, 9, 13);
    pixel(c, '#a77951', 9, 46, 5, 8);
    pixel(c, '#a77951', 35, 45, 5, 9);
    pixelOval(c, WOODLAND.ink, 43, 28, 15, 17);
    pixel(c, WOODLAND.ink, 31, 10, 8, 17);
    pixel(c, WOODLAND.ink, 47, 8, 8, 17);
    pixel(c, '#b9764b', 33, 12, 4, 12);
    pixel(c, '#b9764b', 49, 10, 4, 12);
    pixelOval(c, '#ba774e', 42, 27, 12, 14);
    pixelOval(c, '#d7a475', 38, 23, 8, 8);
    pixelOval(c, WOODLAND.cream, 48, 35, 11, 6);
    pixel(c, WOODLAND.ink, 53, 30, 6, 4);
    eyes(c, 36, 26, 11);
    pixel(c, '#754731', 15, 29, 12, 3);
    pixelOval(c, WOODLAND.ink, 7, 32, 6, 11);
    pixelOval(c, '#b3764c', 6, 29, 4, 8);
    pixel(c, WOODLAND.cream, 4, 22, 4, 5);
  } else if (kind === 'wisp') {
    pixelOval(c, WOODLAND.ink, 32, 32, 17, 22);
    pixelOval(c, '#655d87', 32, 29, 15, 19);
    pixelOval(c, '#9b93b4', 30, 26, 11, 14);
    pixelOval(c, '#dad1d4', 28, 22, 7, 9);
    pixel(c, '#f5e5c6', 26, 16, 5, 7);
    eyes(c, 25, 29, 10);
    pixel(c, '#716b8e', 19, 48, 7, 7);
    pixel(c, '#aba3bb', 35, 48, 6, 5);
    pixel(c, '#cdc3ce', 20, 11, 4, 3);
  } else {
    pixelOval(c, WOODLAND.ink, 32, 35, 22, 25);
    pixelOval(c, WOODLAND.barkDark, 32, 35, 20, 23);
    pixel(c, WOODLAND.bark, 18, 20, 28, 33);
    pixel(c, WOODLAND.barkLight, 20, 23, 4, 24);
    pixel(c, WOODLAND.ink, 14, 50, 13, 12);
    pixel(c, WOODLAND.ink, 37, 50, 13, 12);
    pixel(c, WOODLAND.stone, 15, 52, 10, 7);
    pixel(c, WOODLAND.stone, 39, 52, 9, 7);
    pixelOval(c, WOODLAND.ink, 32, 23, 16, 17);
    pixelOval(c, WOODLAND.stone, 32, 23, 14, 15);
    pixel(c, WOODLAND.stoneLight, 22, 13, 19, 4);
    pixel(c, WOODLAND.ink, 23, 24, 7, 5);
    pixel(c, WOODLAND.ink, 35, 24, 7, 5);
    pixel(c, '#e0d998', 24, 25, 4, 2);
    pixel(c, '#e0d998', 36, 25, 4, 2);
    pixel(c, '#4b5c4b', 28, 34, 10, 3);
    leafCrown(c, 12, 33, 9, 9);
    leafCrown(c, 52, 33, 9, 9);
    pixel(c, WOODLAND.barkDark, 18, 2, 5, 13);
    pixel(c, WOODLAND.barkDark, 43, 1, 5, 13);
    pixel(c, WOODLAND.leafLight, 12, 3, 10, 4);
    pixel(c, WOODLAND.leafLight, 44, 2, 11, 4);
  }
}
