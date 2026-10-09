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
/** Original CC0 farm companions on a 32-pixel drawing grid, doubled into the
 * stable 64×64 frame. Four walk frames and eight direction rows stay unchanged. */
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
  const step = [0, 1, 0, -1][frame % 4] ?? 0;
  const bob = frame % 2 === 1 ? -1 : 0;
  const edge = '#493f35';
  const fur = panda ? '#444742' : '#946647';
  const furLight = panda ? '#646459' : '#b17c50';
  const cream = panda ? '#eee5c9' : '#e1b57f';
  const cloth = panda ? '#77865a' : '#728c87';
  const clothDark = panda ? '#546647' : '#536e6a';
  // Scanline silhouettes create crisp pixel clusters, without antialiased ovals.
  const round = (
    color: string,
    x: number,
    y: number,
    rx: number,
    ry: number,
  ) => {
    for (let row = -ry; row <= ry; row++) {
      const half = Math.floor(
        rx * Math.sqrt(Math.max(0, 1 - (row * row) / (ry * ry))),
      );
      px(c, color, x - half, y + row, half * 2 + 1, 1);
    }
  };
  c.save();
  c.scale(2, 2);
  if (dir === 4 || dir === 3 || dir === 5) {
    c.translate(32, 0);
    c.scale(-1, 1);
  }
  round('#4e6042', 16, 30, 10, 1);
  // Boots remain grounded while the body shifts subtly with each step.
  for (const [x, offset] of [
    [10, step],
    [18, -step],
  ] as const) {
    px(c, edge, x + offset, 25, 5, 5);
    px(c, '#8c704b', x + offset, 27, 5, 2);
    px(c, '#c7aa77', x + offset, 27, 4, 1);
  }
  c.translate(0, bob);
  px(c, edge, 8, 16, 17, 11);
  px(c, fur, 9, 17, 15, 9);
  // A single high-contrast silhouette gives Panda and Ape believable
  // farming proportions. Canvas scale is still 2x, animation atlas unchanged.
  px(c, clothDark, 10, 17, 13, 12);
  px(c, cream, 11, 17, 11, 7);
  px(c, cloth, 12, 21, 9, 7);
  px(c, '#d8b886', 12, 20, 9, 2);
  px(c, '#725638', 11, 26, 12, 2);
  // Two apron straps, leaf stitching, and a side tool pouch.
  px(c, cloth, 12, 17, 2, 7);
  px(c, cloth, 19, 17, 2, 7);
  px(c, '#b9c98c', 15, 23, 3, 3);
  px(c, '#dce6a5', 16, 23, 1, 2);
  px(c, '#684c36', 22, 21, 5, 8);
  px(c, '#b48a5b', 23, 22, 3, 5);
  px(c, '#d7b27c', 23, 22, 3, 1);
  // Bare furry hands, small rolled cuffs and opposite arm swing.
  for (const [x, swing] of [
    [6, -step],
    [24, step],
  ] as const) {
    px(c, edge, x, 18 + swing, 4, 8);
    px(c, fur, x + 1, 19 + swing, 3, 6);
    px(c, furLight, x + 1, 23 + swing, 2, 2);
    px(c, cream, x, 21 + swing, 4, 1);
  }
  // A small ochre neckerchief replaces the oversized adventurer collar.
  px(c, '#a96d49', 11, 16, 11, 3);
  px(c, '#d8a067', 12, 16, 9, 1);
  if (!back) px(c, '#bf8353', 18, 18, 3, 3);
  if (panda) {
    round(edge, 8, 5, 4, 4);
    round(edge, 24, 5, 4, 4);
    round('#716557', 8, 5, 2, 2);
    round('#716557', 24, 5, 2, 2);
    round(edge, 16, 10, 11, 9);
    round(cream, 16, 10, 10, 8);
    px(c, '#faf0d6', 10, 4, 10, 3);
    if (back) {
      px(c, '#d3ceb5', 9, 13, 15, 3);
    } else {
      round(fur, side ? 13 : 11, 10, side ? 2 : 3, 4);
      round(fur, 21, 10, 3, 4);
      px(c, '#fff5d9', side ? 13 : 11, 9, 2, 2);
      px(c, '#fff5d9', 21, 9, 2, 2);
      px(c, edge, side ? 14 : 12, 10, 1, 2);
      px(c, edge, 22, 10, 1, 2);
      round('#faf0d6', side ? 20 : 16, 15, 5, 2);
      px(c, fur, side ? 24 : 15, 13, 3, 2);
      px(c, '#9a7c62', side ? 21 : 15, 16, 3, 1);
      px(c, '#d6a28b', 9, 14, 2, 1);
    }
  } else {
    round(edge, 5, 10, 3, 4);
    round(edge, 27, 10, 3, 4);
    round('#d3a272', 5, 10, 2, 3);
    round('#d3a272', 27, 10, 2, 3);
    round(edge, 16, 10, 10, 9);
    round(fur, 16, 10, 9, 8);
    px(c, edge, 12, 1, 9, 3);
    px(c, furLight, 15, 1, 5, 4);
    if (back) {
      px(c, furLight, 11, 5, 10, 3);
    } else {
      round(cream, side ? 18 : 16, 12, 8, 6);
      px(c, '#f0c994', side ? 17 : 11, 14, 9, 2);
      px(c, edge, side ? 14 : 11, 9, 2, 3);
      px(c, edge, 21, 9, 2, 3);
      px(c, '#fff0d0', side ? 14 : 11, 9, 1, 1);
      px(c, '#fff0d0', 21, 9, 1, 1);
      px(c, '#9c6d4b', side ? 23 : 16, 13, 2, 1);
      px(c, '#80543d', side ? 20 : 14, 16, 4, 1);
    }
  }
  // Portrait prop only; gameplay weapons retain their detached animation system.
  if (includeWeapon) {
    px(c, edge, 28, 7, 2, 22);
    px(c, '#ba9661', 28, 8, 1, 20);
    px(c, '#859881', 26, 7, 5, 3);
    px(c, '#d4d4ae', 26, 7, 5, 1);
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
