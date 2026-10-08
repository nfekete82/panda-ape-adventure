import { WOODLAND, pixel } from './world-style';

type Canvas = Pick<CanvasRenderingContext2D, 'fillStyle' | 'fillRect'>;
export type BambooVariant = 'leafy' | 'tall' | 'young';

const shades = {
  ink: WOODLAND.ink,
  shadow: '#2c513b',
  stem: '#6d9653',
  highlight: '#bfd28a',
  leaf: '#628b4d',
  sun: '#aec479',
} as const;

/** A small canopy of layered, diagonal leaf blades rather than repeated
 * horizontal bars. The cluster stays within the authored 128×160 tree frame. */
function foliage(
  c: Canvas,
  x: number,
  y: number,
  direction: -1 | 1,
  length: number,
): void {
  const start = direction < 0 ? x - length : x;
  pixel(c, shades.ink, start - 2, y + 5, length + 5, 7);
  pixel(c, shades.shadow, start, y + 4, length, 7);
  pixel(c, shades.leaf, start + 3, y + 1, length - 5, 5);
  pixel(c, shades.sun, start + 7, y, length - 13, 3);
  // Stepped foliage droops naturally at the tip.
  const end = direction < 0 ? start - 3 : start + length - 6;
  pixel(c, shades.leaf, end, y + 9, 12, 5);
  pixel(c, shades.shadow, end + 3, y + 13, 7, 5);
  pixel(c, shades.highlight, start + 10, y + 2, 5, 2);
}

function cane(
  c: Canvas,
  x: number,
  top: number,
  base: number,
  width: number,
  seed: number,
): void {
  pixel(c, shades.ink, x - 3, top, width + 6, base - top + 2);
  pixel(c, shades.shadow, x - 1, top + 2, width + 2, base - top - 3);
  pixel(c, shades.stem, x + 1, top + 2, width - 2, base - top - 3);
  pixel(c, shades.highlight, x + 2, top + 2, 2, base - top - 8);
  for (let y = top + 16; y < base - 9; y += 24) {
    pixel(c, shades.ink, x - 1, y, width + 2, 4);
    pixel(c, shades.sun, x + 1, y, width - 2, 2);
    const side: -1 | 1 = (Math.floor(y / 24) + seed) % 2 ? 1 : -1;
    foliage(c, x + width / 2, y - 8, side, 23 + ((seed + y) % 11));
  }
  foliage(c, x + width / 2, top + 5, -1, 24);
  foliage(c, x + width / 2, top + 10, 1, 28);
}

/** Three tree-family members share the same lighting and grounded root.
 * Palette, overall silhouette and feet placement are stable for multiplayer.
 */
export function paintBambooStand(c: Canvas, variant: BambooVariant = 'leafy'): void {
  const stalks =
    variant === 'tall'
      ? [
          [36, 33, 144, 8],
          [54, 8, 147, 9],
          [75, 21, 147, 9],
          [94, 43, 143, 7],
        ]
      : variant === 'young'
        ? [
            [44, 57, 145, 8],
            [62, 39, 145, 8],
            [82, 53, 145, 7],
          ]
        : [
            [28, 42, 144, 7],
            [46, 18, 145, 9],
            [67, 24, 147, 10],
            [90, 36, 144, 8],
            [103, 55, 142, 6],
          ];
  stalks.forEach(([x, top, base, width], n) =>
    cane(c, x!, top!, base!, width!, n + (variant === 'tall' ? 3 : 0)),
  );
  // Shared ground shadow anchors the whole grove in the terrain.
  pixel(c, WOODLAND.ink, 23, 145, 86, 4);
  pixel(c, WOODLAND.barkDark, 32, 145, 67, 2);
  pixel(c, shades.sun, 39, 144, 24, 2);
}
