import { type Crop, type Recipe, type ValleyItem } from '@panda/shared';
import { pixel as px, pixelOval as oval, WOODLAND as P } from './world-style';
type Canvas = CanvasRenderingContext2D;
export const CROP_COLORS: Record<Crop, string> = {
  carrot: '#e8a45b',
  potato: '#c6a476',
  tomato: '#d77a65',
  strawberry: '#dc8a9c',
};
export function paintPlot(c: Canvas, wet: boolean) {
  // Raised earth bed with chunky pixel shading; transparent corners soften the grid.
  px(c, '#503e30', 1, 6, 30, 24);
  px(c, wet ? '#463a32' : '#8e613e', 2, 4, 28, 24);
  px(c, wet ? '#534436' : '#a9784b', 4, 3, 24, 22);
  px(c, wet ? '#5c4939' : '#b48857', 5, 4, 22, 2);
  px(c, wet ? '#352f2b' : '#6e4b36', 3, 27, 26, 2);
  for (let row = 0; row < 3; row++) {
    const y = 8 + row * 6;
    px(c, wet ? '#3d3932' : '#855938', 5, y, 22, 2);
    px(c, wet ? '#6d6050' : '#c09664', 7, y - 2, 17, 1);
  }
  for (const [x, y] of [[8, 12], [24, 19], [13, 25]] as const)
    px(c, wet ? '#807564' : '#d1a16c', x, y, 2, 1);
  if (wet) {
    px(c, '#89a5a0', 19, 13, 5, 2);
    px(c, '#a5bdb3', 20, 13, 2, 1);
  }
}
export function paintCrop(c: Canvas, crop: Crop, stage: number) {
  const height = stage === 0 ? 7 : stage === 1 ? 14 : 21;
  px(c, P.leafDark, 15, 29 - height, 3, height);
  oval(c, P.leaf, 10, 29 - height + 4, 7, 4);
  oval(c, P.leafLight, 20, 29 - height + 1, 7, 4);
  px(c, P.leafSun, 17, 27 - height, 5, 2);
  if (stage > 0) {
    oval(c, P.leafDark, 10, 22, 7, 4);
    oval(c, P.leaf, 22, 20, 7, 4);
  }
  // Grounded plant cluster and little leaves help seedlings read as garden crops.
  if (stage === 0) {
    px(c, '#8a633e', 10, 28, 13, 2);
    px(c, P.leafSun, 14, 21, 3, 3);
  }
  if (stage === 1) {
    oval(c, P.leafDark, 13, 18, 8, 4);
    oval(c, P.leafLight, 21, 16, 7, 4);
  }
  if (stage === 2) {
    if (crop === 'carrot') {
      px(c, P.ink, 10, 21, 12, 9);
      px(c, CROP_COLORS[crop], 12, 21, 8, 8);
      px(c, '#f1c17e', 12, 22, 3, 3);
      px(c, '#f6d198', 16, 24, 2, 3);
      px(c, '#578447', 9, 19, 5, 2);
    } else if (crop === 'potato') {
      oval(c, P.ink, 12, 26, 8, 5);
      oval(c, CROP_COLORS[crop], 12, 25, 7, 4);
      px(c, '#e0c693', 9, 23, 4, 2);
      oval(c, CROP_COLORS[crop], 23, 28, 5, 3);
      px(c, '#e5c49d', 21, 25, 2, 1);
    } else {
      for (const [x, y] of [
        [10, 18],
        [22, 15],
        [17, 26],
      ]) {
        oval(c, P.ink, x!, y!, 5, 5);
        oval(c, CROP_COLORS[crop], x!, y! - 1, 4, 4);
        px(c, P.cream, x! - 1, y! - 3, 2, 2);
      }
    }
  }
}
export function paintBuilding(c: Canvas, recipe: Recipe) {
  const wood = P.bark,
    edge = P.barkDark,
    light = P.barkLight;
  if (recipe === 'gardenBed') {
    px(c, edge, 0, 22, 32, 24);
    px(c, wood, 1, 23, 30, 3);
    px(c, light, 1, 23, 28, 1);
    px(c, wood, 1, 40, 30, 4);
    px(c, '#dbb981', 3, 24, 26, 2);
    for (const x of [5, 25]) {
      px(c, '#5b402d', x, 20, 3, 25);
      px(c, '#cba371', x, 21, 1, 22);
    }
    return;
  }
  px(c, P.shadow, 1, 42, 30, 5);
  if (recipe === 'workbench') {
    px(c, edge, 2, 22, 28, 8);
    px(c, wood, 3, 22, 26, 5);
    px(c, light, 3, 22, 24, 2);
    px(c, edge, 5, 29, 4, 15);
    px(c, edge, 24, 29, 4, 15);
    px(c, P.stone, 17, 16, 10, 5);
    px(c, P.stoneLight, 16, 15, 13, 3);
    px(c, wood, 8, 13, 3, 10);
    px(c, P.stoneLight, 5, 12, 9, 4);
    // Tools and pegs above the planked top.
    px(c, '#435957', 9, 8, 3, 12);
    px(c, '#bfd0bb', 6, 7, 10, 3);
    px(c, '#e7c58d', 19, 21, 5, 2);
    px(c, '#59422f', 13, 25, 2, 16);
    px(c, '#b78956', 5, 33, 23, 2);
  } else if (recipe === 'chest') {
    px(c, edge, 3, 22, 26, 21);
    px(c, wood, 5, 24, 22, 16);
    px(c, light, 5, 24, 22, 3);
    px(c, P.ink, 3, 31, 26, 3);
    px(c, P.cream, 14, 29, 5, 7);
    // Rounded lid highlights, metal corners and keyhole.
    px(c, '#d0a268', 6, 22, 20, 2);
    for (const x of [5, 24]) {
      px(c, '#9a9b83', x, 24, 3, 6);
      px(c, '#9a9b83', x, 37, 3, 4);
      px(c, '#d9caa1', x, 25, 2, 1);
    }
    px(c, '#67503a', 16, 32, 2, 3);
    px(c, '#d4b27a', 7, 39, 18, 2);
  } else if (recipe === 'fence') {
    for (const x of [2, 25]) {
      px(c, edge, x, 21, 5, 23);
      px(c, light, x, 21, 2, 21);
    }
    px(c, wood, 4, 26, 24, 4);
    px(c, wood, 4, 35, 24, 4);
    px(c, light, 5, 26, 22, 1);
    px(c, light, 5, 35, 22, 1);
    px(c, '#58432f', 7, 29, 2, 3);
    px(c, '#58432f', 24, 36, 2, 3);
    px(c, '#d7bb85', 2, 20, 5, 3);
    px(c, '#d7bb85', 25, 20, 5, 3);
  } else if (recipe === 'lantern') {
    px(c, edge, 14, 16, 4, 28);
    px(c, wood, 15, 15, 14, 3);
    px(c, P.ink, 21, 17, 10, 15);
    px(c, P.cream, 23, 20, 5, 8);
    px(c, '#dba867', 24, 21, 2, 5);
    px(c, '#f4d69b', 22, 18, 8, 2);
    px(c, '#ffeba9', 24, 23, 3, 4);
    px(c, '#d6ac69', 22, 31, 8, 2);
    px(c, '#c99d65', 13, 38, 7, 2);
    px(c, '#8b6b48', 12, 42, 9, 3);
  } else {
    px(c, edge, 3, 12, 4, 32);
    px(c, edge, 25, 12, 4, 32);
    for (let row = 0; row < 9; row++)
      px(
        c,
        row % 2 ? '#967449' : '#b08c56',
        1 + row,
        4 + row * 2,
        30 - row * 2,
        3,
      );
    px(c, light, 3, 24, 26, 2);
    px(c, wood, 5, 37, 22, 6);
    // A welcoming little timber shelter, with warm window and roof trim.
    px(c, '#efd39c', 7, 25, 17, 2);
    px(c, '#644a31', 9, 29, 14, 13);
    px(c, '#d5ad70', 11, 31, 10, 9);
    px(c, '#735132', 15, 31, 2, 9);
    px(c, '#e9c789', 7, 10, 16, 2);
    px(c, '#b58d5d', 6, 34, 20, 2);
  }
}
export function paintCache(c: Canvas, item: ValleyItem) {
  oval(c, P.shadow, 16, 25, 15, 5);
  if (item === 'wood') {
    for (let n = 0; n < 3; n++) {
      px(c, P.barkDark, 3 + n * 3, 13 + n * 4, 23, 5);
      px(c, P.barkLight, 3 + n * 3, 13 + n * 4, 6, 3);
    }
  } else if (item === 'fiber') {
    for (let n = 0; n < 5; n++) {
      px(c, P.leafDark, 3 + n * 5, 10 + (n % 2) * 4, 4, 17);
      px(c, P.leafLight, 3 + n * 5, 9 + (n % 2) * 4, 2, 12);
    }
  } else {
    oval(c, P.ink, 16, 20, 13, 8);
    oval(c, item === 'ore' ? '#967b68' : P.stone, 15, 18, 12, 7);
    px(c, item === 'ore' ? '#d6b27f' : P.stoneLight, 8, 14, 9, 3);
  }
}
