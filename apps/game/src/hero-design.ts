import type { Hero } from '@panda/shared';

type Canvas = CanvasRenderingContext2D;
const px = (
  c: Canvas,
  color: string,
  x: number,
  y: number,
  w: number,
  h: number,
) => {
  c.fillStyle = color;
  c.fillRect(Math.round(x), Math.round(y), w, h);
};
const oval = (
  c: Canvas,
  color: string,
  x: number,
  y: number,
  rx: number,
  ry: number,
) => {
  c.fillStyle = color;
  c.beginPath();
  c.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  c.fill();
};
const rim = '#1d292c';
/** Original 64-pixel characters based on the supplied Panda and Ape concepts,
 * with distinct silhouettes, scarlet scarves, belts, equipment and head shapes.
 * Detached weapons are rendered by the weapon animation system in gameplay. */
export function conceptHero(
  c: Canvas,
  hero: Hero,
  frame: number,
  dir: number,
  includeWeapon = true,
): void {
  const panda = hero === 'panda';
  const back = dir >= 5;
  const side = dir === 0 || dir === 4;
  const stride = [0, 3, 0, -3][frame % 4]!;
  const bounce = frame === 1 || frame === 3 ? 2 : 0;
  const flip = dir === 4 || dir === 3 || dir === 5;
  const fur = panda ? '#253038' : '#985e3a';
  const bright = panda ? '#f4ecd7' : '#e3ad76';
  const lit = panda ? '#fff7e5' : '#f7c98b';
  const pants = panda ? '#465043' : '#52603c';
  c.save();
  if (flip) {
    c.translate(64, 0);
    c.scale(-1, 1);
  }
  c.translate(0, -bounce);
  // Soft foxed shadow, contrasting staggered boots and leather travelling trousers.
  oval(c, '#1c382f', 32, 60, 21, 5);
  px(c, rim, 18 + stride, 48, 12, 12);
  px(c, rim, 34 - stride, 48, 12, 12);
  px(c, pants, 19 + stride, 44, 12, 10);
  px(c, pants, 34 - stride, 44, 11, 10);
  px(c, '#a68a63', 20 + stride, 55, 10, 3);
  px(c, '#a68a63', 34 - stride, 55, 10, 3);
  px(c, '#302d2a', 18 + stride, 58, 12, 3);
  px(c, '#302d2a', 34 - stride, 58, 12, 3);
  // The ape's curled tail is crucial for recognising it at gameplay scale.
  if (!panda) {
    px(c, '#603e2d', 13, 43, 7, 5);
    px(c, '#754b32', 8, 38, 8, 9);
    px(c, '#985f3c', 7, 33, 7, 8);
    px(c, '#b2744b', 11, 30, 8, 6);
    px(c, '#a16b47', 13, 32, 3, 4);
  }
  // Satchel and torso outline.
  px(c, rim, 14, 29, 36, 21);
  px(c, fur, 16, 30, 32, 19);
  px(c, panda ? '#f0e5c9' : '#dbad79', 23, 33, 18, 17);
  px(c, '#9a6a40', 21, 29, 6, 21);
  px(c, '#e5b16c', 23, 35, 3, 8);
  px(c, '#70472e', 13, 41, 37, 5);
  px(c, '#c79551', 13, 43, 36, 3);
  px(c, '#efd28b', 27, 40, 10, 9);
  px(c, '#6c6035', 29, 42, 6, 5);
  px(c, '#7c5435', 40, 44, 13, 12);
  px(c, '#c99653', 42, 46, 9, 5);
  px(c, '#e4c582', 44, 47, 5, 2);
  // Adventurer gauntlets, moving opposite to their boots.
  px(c, rim, 10, 31 - stride / 3, 12, 20);
  px(c, fur, 12, 33 - stride / 3, 10, 15);
  px(c, '#b27c4a', 11, 42 - stride / 3, 12, 5);
  px(c, '#e1c095', 13, 45 - stride / 3, 7, 3);
  px(c, rim, 44, 31 + stride / 3, 12, 18);
  px(c, fur, 45, 32 + stride / 3, 10, 15);
  px(c, '#b27c4a', 44, 40 + stride / 3, 12, 5);
  px(c, '#e1c095', 47, 43 + stride / 3, 7, 3);
  // Scarf tails (animated) and oversize crimson collar.
  px(c, '#722a26', panda ? 13 : 7, 30, 15, 6);
  px(c, '#bd3d31', panda ? 7 : 5, 33 + stride / 3, 16, 7);
  px(c, '#e2573d', panda ? 7 : 5, 33 + stride / 3, 13, 3);
  px(c, '#7e2a27', 18, 26, 33, 11);
  px(c, '#c33d31', 15, 26, 35, 8);
  px(c, '#ed6342', 18, 27, 30, 3);
  // Ear/head silhouette. Panda is broad and round; Ape gets a swept hair tuft.
  if (panda) {
    oval(c, rim, 15, 14, 10, 11);
    oval(c, rim, 48, 14, 10, 11);
    oval(c, '#463d3c', 15, 13, 5, 5);
    oval(c, '#463d3c', 48, 13, 5, 5);
    oval(c, rim, 32, 21, 23, 18);
    oval(c, bright, 32, 20, 21, 17);
    oval(c, lit, 29, 16, 16, 11);
    if (back) {
      px(c, '#d6d3c3', 19, 18, 26, 13);
      px(c, '#f5edde', 23, 14, 17, 9);
      px(c, '#a9794f', 35, 27, 6, 12);
    } else {
      oval(c, '#2b3337', 23, 23, 7, 10);
      if (!side) oval(c, '#2b3337', 41, 23, 7, 10);
      oval(c, '#fff6e5', 24, 21, 4, 4);
      if (!side) oval(c, '#fff6e5', 41, 21, 4, 4);
      px(c, '#4c3026', 25, 19, 3, 4);
      if (!side) px(c, '#4c3026', 42, 19, 3, 4);
      px(c, '#fcffff', 26, 19, 2, 2);
      if (!side) px(c, '#fcffff', 43, 19, 2, 2);
      oval(c, '#f5ecd8', 33, 30, 10, 7);
      px(c, '#313438', 31, 26, 6, 4);
      px(c, '#a77b66', 31, 34, 6, 2);
      px(c, '#e9a9a0', 20, 31, 4, 2);
      if (!side) px(c, '#e9a9a0', 43, 31, 4, 2);
    }
  } else {
    oval(c, rim, 12, 19, 10, 13);
    oval(c, rim, 51, 19, 10, 13);
    oval(c, '#b78259', 12, 19, 7, 9);
    oval(c, '#dfaa76', 12, 19, 4, 6);
    oval(c, '#b78259', 51, 19, 7, 9);
    oval(c, '#dfaa76', 51, 19, 4, 6);
    oval(c, rim, 32, 22, 22, 18);
    oval(c, '#90552f', 32, 23, 20, 16);
    // Distinct windswept hair locks, golden muzzle and oversized bright eyes.
    px(c, '#573e2f', 16, 11, 27, 7);
    px(c, '#815035', 19, 7, 26, 9);
    px(c, '#ad7044', 29, 5, 13, 9);
    px(c, '#875334', 40, 9, 8, 8);
    px(c, '#b97a4a', 20, 13, 24, 8);
    if (back) {
      px(c, '#7b5036', 19, 21, 28, 11);
      px(c, '#a16d49', 20, 13, 24, 7);
    } else {
      oval(c, bright, 32, 28, 16, 10);
      oval(c, lit, 32, 32, 9, 5);
      px(c, '#2c2c29', 23, 21, 5, 6);
      if (!side) px(c, '#2c2c29', 39, 21, 5, 6);
      px(c, '#fff9df', 24, 20, 4, 4);
      if (!side) px(c, '#fff9df', 40, 20, 4, 4);
      px(c, '#251f20', 26, 21, 3, 3);
      if (!side) px(c, '#251f20', 41, 21, 3, 3);
      px(c, '#ffffff', 27, 20, 1, 2);
      if (!side) px(c, '#ffffff', 42, 20, 1, 2);
      px(c, '#ad714e', 30, 28, 6, 4);
      px(c, '#553c30', 32, 32, 5, 2);
      px(c, '#f3c18b', 23, 33, 5, 3);
    }
  }
  // Portraits show a held prop. Gameplay uses separate animated weapons.
  if (includeWeapon) {
    if (panda) {
      px(c, '#3a5539', 54, 8, 6, 47);
      px(c, '#8ab36c', 55, 8, 3, 43);
      px(c, '#e6d7ab', 53, 22, 8, 3);
      px(c, '#f7e4c2', 53, 37, 8, 3);
      px(c, '#83ad57', 50, 11, 12, 4);
    } else {
      px(c, '#6d472e', 53, 7, 6, 47);
      px(c, '#b88d51', 55, 7, 2, 46);
      px(c, '#c69250', 52, 5, 8, 5);
      px(c, '#7da654', 51, 10, 11, 4);
    }
  }
  c.restore();
}
