import { WOODLAND, pixel } from './world-style';

type C = Pick<CanvasRenderingContext2D, 'fillStyle' | 'fillRect'>;
/** Original three-stem bamboo silhouette. Exact 128×160 frame and grounded root
 * match existing woodland trees, with conservative collision at its feet.
 */
export function paintBambooStand(c: C): void {
  const stalks = [
    { x: 44, tip: 20, base: 142, weight: 10 },
    { x: 67, tip: 9, base: 145, weight: 11 },
    { x: 89, tip: 34, base: 143, weight: 9 },
  ];
  for (const s of stalks) {
    pixel(c, WOODLAND.ink, s.x - 2, s.tip, s.weight + 4, s.base - s.tip);
    pixel(c, '#467953', s.x, s.tip + 1, s.weight, s.base - s.tip - 2);
    pixel(c, '#a0b77a', s.x + 2, s.tip + 2, 3, s.base - s.tip - 3);
    for (let y = s.tip + 20; y < s.base; y += 22) {
      pixel(c, '#294f3c', s.x, y, s.weight, 4);
      pixel(c, '#b4c288', s.x + 1, y + 1, s.weight - 3, 2);
    }
    // Long leaves overlap naturally and share the woodland's olive lighting.
    for (let n = 0; n < 6; n++) {
      const cy = s.tip + 5 + n * 20;
      const left = n % 2 === 0;
      const dx = left ? -30 : 9;
      const shade = n % 3 ? WOODLAND.leafLight : WOODLAND.leafSun;
      pixel(c, WOODLAND.ink, s.x + dx - 2, cy + 5, 33, 4);
      pixel(c, WOODLAND.leafDark, s.x + dx, cy + 1, 30, 8);
      pixel(c, shade, s.x + dx + 3, cy, 24, 3);
      pixel(c, '#769965', s.x + dx + 8, cy - 2, 14, 3);
    }
  }
  pixel(c, WOODLAND.barkDark, 37, 142, 70, 6);
  pixel(c, WOODLAND.bark, 47, 140, 51, 4);
  pixel(c, '#627c4b', 31, 144, 77, 3);
  pixel(c, '#9dad6e', 36, 142, 20, 2);
}
