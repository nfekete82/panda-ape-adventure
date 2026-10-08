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
      // A three-quarter profile keeps both eyes readable; the near eye faces
      // the travel direction. Mirroring preserves the same face facing west.
      oval(c, '#2b3337', side ? 25 : 23, 23, side ? 5 : 7, 8);
      oval(c, '#2b3337', 41, 23, 7, 8);
      oval(c, '#fff6e5', side ? 26 : 24, 21, side ? 3 : 4, 4);
      oval(c, '#fff6e5', 41, 21, 4, 4);
      px(c, '#4c3026', 25, 19, 3, 4);
      px(c, '#4c3026', 42, 19, 3, 4);
      px(c, '#fcffff', 26, 19, 2, 2);
      px(c, '#fcffff', 43, 19, 2, 2);
      // Small rounded cheeks, a soft nose and a short upturned smile keep
      // the snout separate from the eyes and crimson scarf.
      if (side) {
        oval(c, '#dfd4bd', 42, 30, 9, 5);
        oval(c, '#fff3da', 43, 29, 8, 4);
        oval(c, '#30383a', 49, 27, 3, 2);
        px(c, '#617070', 48, 26, 2, 1);
        px(c, '#77594c', 45, 32, 4, 1);
        px(c, '#77594c', 44, 31, 1, 1);
      } else {
        oval(c, '#dfd4bd', 33, 31, 10, 5);
        oval(c, '#fff3da', 29, 29, 6, 4);
        oval(c, '#fff3da', 37, 29, 6, 4);
        oval(c, '#30383a', 33, 27, 3.5, 2);
        px(c, '#617070', 32, 26, 2, 1);
        px(c, '#77594c', 33, 29, 1, 3);
        px(c, '#77594c', 30, 32, 6, 1);
        px(c, '#77594c', 29, 31, 1, 1);
        px(c, '#77594c', 36, 31, 1, 1);
      }
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
      oval(c, bright, side ? 38 : 32, 28, side ? 14 : 16, 10);
      oval(c, lit, side ? 40 : 32, 31, 9, 5);
      // Matching three-quarter eyes keep Ape's side face as readable as Panda.
      px(c, '#2c2c29', 23, 21, side ? 4 : 5, 6);
      px(c, '#2c2c29', 39, 21, 5, 6);
      px(c, '#fff9df', 24, 20, side ? 3 : 4, 4);
      px(c, '#fff9df', 40, 20, 4, 4);
      px(c, '#251f20', 26, 21, 2, 3);
      px(c, '#251f20', 41, 21, 3, 3);
      px(c, '#ffffff', 26, 20, 1, 2);
      px(c, '#ffffff', 42, 20, 1, 2);
      oval(c, '#a66c48', side ? 46 : 33, 28, 3, 2);
      px(c, '#684431', side ? 42 : 30, 33, 6, 1);
      px(c, '#684431', side ? 41 : 29, 32, 1, 1);
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

/** Original camp residents, drawn at the same native resolution as the heroes.
 * Rowan is a silver-haired woodland guide; Bramble is a broad, bearded smith. */
export function conceptNpc(c: Canvas, kind: 'rowan' | 'bramble'): void {
  const smith = kind === 'bramble';
  c.save();
  oval(c, '#1c382f', 32, 60, smith ? 22 : 19, 4);
  // Boots, trousers and a distinct cloak/apron silhouette.
  px(c, rim, 19, 47, 12, 14);
  px(c, rim, 35, 47, 12, 14);
  px(c, '#51483b', 21, 47, 9, 10);
  px(c, '#51483b', 36, 47, 9, 10);
  px(c, '#b18a59', 21, 56, 9, 2);
  px(c, '#b18a59', 36, 56, 9, 2);
  oval(c, rim, 32, 39, smith ? 22 : 19, 17);
  oval(c, smith ? '#6b5340' : '#3c6550', 32, 39, smith ? 20 : 17, 15);
  px(c, smith ? '#9b7452' : '#73946a', 16, 30, 8, 20);
  px(c, smith ? '#78543c' : '#537e5a', 40, 30, 8, 20);
  px(c, rim, 10, 31, 9, 19);
  px(c, rim, 46, 31, 9, 19);
  px(c, smith ? '#c19369' : '#648661', 11, 32, 8, 13);
  px(c, smith ? '#c19369' : '#648661', 46, 32, 8, 13);
  oval(c, '#ebbd87', 15, 46, 4, 4);
  oval(c, '#ebbd87', 50, 46, 4, 4);
  if (smith) {
    // Apron straps, brass rivets and a useful pocket full of tools.
    px(c, '#c48c50', 23, 28, 4, 12);
    px(c, '#c48c50', 38, 28, 4, 12);
    px(c, '#443830', 22, 35, 22, 20);
    px(c, '#a16c41', 24, 35, 18, 18);
    px(c, '#d39b58', 24, 36, 2, 15);
    px(c, '#e7c88b', 25, 36, 2, 2);
    px(c, '#e7c88b', 39, 36, 2, 2);
    px(c, '#67452f', 28, 44, 11, 7);
    px(c, '#b7834f', 29, 45, 9, 2);
    px(c, '#aeb8ac', 32, 40, 2, 6);
    px(c, '#e4c384', 36, 41, 2, 6);
    // Small hammer held low, leaving the face unobstructed.
    px(c, '#704c32', 50, 45, 3, 13);
    px(c, rim, 45, 51, 14, 7);
    px(c, '#9ca99c', 46, 52, 12, 4);
    px(c, '#d5d8bd', 47, 52, 6, 1);
  } else {
    // Folded cloak, leaf clasp and a traveller's satchel with a rolled map.
    px(c, '#b4b278', 24, 28, 17, 4);
    px(c, '#aeca91', 30, 31, 5, 5);
    px(c, '#354f40', 28, 39, 3, 15);
    px(c, '#87a474', 32, 39, 2, 12);
    px(c, '#6f4d34', 39, 31, 4, 20);
    px(c, '#513e2f', 38, 45, 14, 11);
    px(c, '#a27645', 40, 46, 10, 7);
    px(c, '#dfc58b', 43, 48, 4, 2);
    px(c, '#dfd0a0', 9, 42, 5, 12);
    px(c, '#9c8b61', 9, 44, 5, 2);
  }
  // Human faces retain the heroes' warm highlights and dark, rounded outline.
  oval(c, rim, 32, 20, smith ? 18 : 16, 17);
  oval(c, '#b78259', 17, 22, 4, 5);
  oval(c, '#b78259', 47, 22, 4, 5);
  oval(c, '#e4ae77', 32, 21, smith ? 16 : 14, 14);
  oval(c, '#f3c991', 30, 19, 12, 10);
  if (smith) {
    oval(c, '#684638', 32, 29, 14, 10);
    oval(c, '#95634a', 32, 29, 12, 8);
    px(c, '#bd8962', 23, 30, 3, 5);
    px(c, '#bd8962', 29, 34, 6, 2);
    oval(c, '#e5ad77', 32, 25, 5, 4);
    px(c, '#9d6245', 30, 27, 5, 1);
    px(c, '#dfae81', 28, 30, 8, 2);
    // Rolled leather cap and a copper buckle, rather than another guide hood.
    oval(c, rim, 32, 10, 17, 7);
    oval(c, '#855536', 32, 10, 15, 5);
    px(c, '#bb8350', 19, 12, 27, 4);
    px(c, '#ebbe73', 37, 12, 5, 3);
  } else {
    oval(c, '#c4c6ae', 20, 16, 5, 9);
    oval(c, '#c4c6ae', 44, 16, 5, 9);
    oval(c, '#f3c991', 32, 21, 11, 12);
    px(c, '#d9dbc1', 22, 10, 7, 4);
    px(c, '#a1aa91', 36, 10, 9, 5);
    // Soft sage hood frames the silver fringe without hiding the eyebrows.
    oval(c, rim, 32, 8, 17, 6);
    oval(c, '#54775a', 32, 7, 15, 5);
    px(c, '#90a879', 22, 7, 13, 2);
    px(c, '#657954', 17, 11, 5, 8);
    px(c, '#657954', 43, 11, 5, 8);
    px(c, '#a57352', 30, 27, 5, 1);
    px(c, '#986748', 28, 31, 7, 1);
    px(c, '#986748', 35, 30, 1, 1);
  }
  px(c, smith ? '#543b31' : '#737d65', 23, 17, 6, 2);
  px(c, smith ? '#543b31' : '#737d65', 36, 17, 6, 2);
  oval(c, '#fff3d7', 26, 21, 3, 3);
  oval(c, '#fff3d7', 39, 21, 3, 3);
  px(c, '#35433b', 26, 20, 2, 4);
  px(c, '#35433b', 38, 20, 2, 4);
  px(c, '#ffffff', 26, 20, 1, 1);
  px(c, '#ffffff', 38, 20, 1, 1);
  oval(c, '#d39464', 33, 25, 3, 2);
  px(c, '#e7b986', 32, 24, 2, 1);
  c.restore();
}
