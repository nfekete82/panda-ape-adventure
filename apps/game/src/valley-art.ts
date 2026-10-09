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
  // Four-pixel transparent margins keep the grouped-bed paths visible even
  // when all 32 cells are hoed, watered or planted.
  px(c, '#5b4432', 4, 5, 24, 23);
  px(c, wet ? '#514638' : '#aa7c4f', 4, 4, 24, 22);
  px(c, wet ? '#786951' : '#c69b63', 5, 4, 22, 2);
  for (const y of [9, 15, 21]) {
    px(c, wet ? '#3f3c33' : '#865e3d', 6, y, 20, 2);
    px(c, wet ? '#655c49' : '#b88d58', 7, y - 1, 18, 1);
  }
  if (wet) {
    px(c, '#88a5a0', 20, 12, 5, 2);
    px(c, '#b0c5b4', 21, 12, 2, 1);
    px(c, '#88a5a0', 8, 23, 3, 1);
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

/** Original CC0 garden apron. Four 4×2 beds share the fixed 8×4 gameplay grid.
 * Eight-pixel seams suggest paths without moving or hiding any cell centre. */
export function paintGarden(c: Canvas) {
  const ox = 48,
    oy = 40;
  // Soft grass islands, rather than a rectangular brown foundation.
  for (const [x, y, w, h] of [
    [20, 21, 308, 158],
    [6, 52, 33, 69],
    [316, 91, 30, 74],
  ] as const) {
    oval(c, '#607b48', x + w / 2, y + h / 2, w / 2, h / 2);
    oval(c, '#829257', x + w / 2, y + h / 2 - 2, w / 2 - 3, h / 2 - 4);
  }
  // Central cross paths occupy only the seams between interaction cells.
  px(c, '#c5ad79', ox + 124, oy - 8, 8, 144);
  px(c, '#c5ad79', ox - 8, oy + 60, 272, 8);
  for (const gy of [0, 2])
    for (const gx of [0, 4]) {
      const x = ox + gx * 32 + 4,
        y = oy + gy * 32 + 4;
      px(c, '#51452f', x, y + 2, 120, 56);
      px(c, '#b29463', x, y, 120, 54);
      px(c, '#d6ba82', x + 2, y, 116, 2);
      px(c, '#8d6845', x + 2, y + 3, 116, 48);
      // Each untilled cell has a quiet centre, distinct from hoed furrows.
      for (let row = 0; row < 2; row++)
        for (let col = 0; col < 4; col++) {
          const cx = ox + (gx + col) * 32,
            cy = oy + (gy + row) * 32;
          px(c, '#a27e52', cx + 6, cy + 6, 20, 20);
          px(c, '#bd9863', cx + 9, cy + 10, 4, 2);
          px(c, '#796442', cx + 21, cy + 22, 3, 2);
        }
      for (const dx of [1, 116]) {
        px(c, '#6a5137', x + dx, y + 1, 3, 52);
        px(c, '#e1c48a', x + dx, y + 1, 2, 3);
      }
    }
  // Soft soil ridges and tiny seed traces provide depth without changing plot hitboxes.
  for (const gy of [0, 2])
    for (const gx of [0, 4])
      for (let row = 0; row < 2; row++)
        for (let col = 0; col < 4; col++) {
          const x = ox + (gx + col) * 32 + 5;
          const y = oy + (gy + row) * 32 + 5;
          for (const dy of [5, 12, 19]) {
            px(c, '#76573c', x + 2, y + dy + 2, 23, 2);
            px(c, '#d3a976', x + 3, y + dy, 21, 2);
          }
          px(c, '#e6be86', x + 11, y + 11, 2, 2);
          px(c, '#83623e', x + 20, y + 18, 2, 2);
        }
  // Flower-border clusters emphasize the entrance and reduce the spreadsheet feel.
  for (const [x, y, flower] of [
    [31, 37, '#e4a1a4'], [321, 42, '#e3c27c'],
    [26, 151, '#f0c589'], [323, 150, '#d6a5cb'],
    [158, 25, '#e6a3a8'], [193, 178, '#e8ca87'],
  ] as const) {
    px(c, '#466b3f', x - 4, y + 3, 9, 4);
    px(c, '#739653', x, y - 4, 2, 9);
    px(c, flower, x - 3, y - 6, 8, 5);
    px(c, '#f6e6bb', x, y - 4, 2, 2);
  }
  // Open south entrance: stepping stones and two short sections of picket fence.
  for (const x of [ox + 113, ox + 124, ox + 115]) {
    const y = oy + 140 + (x === ox + 124 ? 13 : x === ox + 115 ? 26 : 0);
    px(c, '#877e5a', x, y, 19, 8);
    px(c, '#d1c39b', x + 1, y, 16, 5);
  }
  for (const y of [oy - 17, oy + 148])
    for (const [x, w] of [
      [ox - 8, 104],
      [ox + 160, 104],
    ] as const) {
      px(c, '#715437', x, y + 5, w, 3);
      px(c, '#bc9965', x, y + 4, w, 2);
      for (let dx = 0; dx <= w; dx += 26) {
        px(c, '#715437', x + dx, y, 4, 15);
        px(c, '#e0c58c', x + dx, y, 3, 3);
      }
    }
  // Low wooden crop markers on the outer apron; never over a plot.
  for (const x of [ox + 22, ox + 218]) {
    px(c, '#715437', x + 5, oy + 133, 3, 12);
    px(c, '#715437', x, oy + 130, 15, 8);
    px(c, '#d9b77b', x + 1, oy + 130, 13, 6);
    px(c, '#63814a', x + 5, oy + 131, 4, 4);
  }
  // A seed crate and folded sack, confined to the west apron.
  px(c, '#674b35', 11, 46, 20, 20);
  px(c, '#b18a59', 13, 47, 16, 16);
  for (const y of [49, 56, 62]) px(c, '#d4b27b', 13, y, 16, 2);
  px(c, '#674b35', 21, 48, 2, 16);
  oval(c, '#a4895d', 23, 91, 9, 11);
  oval(c, '#d4bd8a', 21, 88, 8, 10);
  px(c, '#80613e', 16, 82, 11, 2);
}

/** Rebuilt low-gabled cottage. The facade uses the supplied Jofra house crop;
 * roof, porch, windows, planters and foundation are original CC0 pixel work. */
export function paintCottage(c: Canvas, source: CanvasImageSource) {
  oval(c, '#40543b', 48, 85, 44, 6);
  px(c, '#756e51', 13, 78, 71, 6);
  px(c, '#baa67a', 15, 78, 67, 3);
  // Reuse the native timber facade, without its tall box-shaped upper roof.
  c.drawImage(source, 0, 47, 72, 35, 12, 43, 72, 35);
  px(c, '#cfad76', 17, 44, 62, 5);
  px(c, '#e6c88e', 17, 44, 60, 2);
  // Warm terracotta stepped gable and clean eaves at native pixel resolution.
  px(c, '#594534', 66, 9, 9, 24);
  px(c, '#baa47b', 68, 10, 5, 19);
  px(c, '#6e523b', 65, 8, 11, 3);
  for (let row = 0; row < 15; row++) {
    const x = 45 - row * 3,
      y = 15 + row * 2;
    px(c, '#644735', x - 2, y, 8 + row * 6, 3);
    px(c, row % 3 === 0 ? '#cb965f' : '#b47b4e', x, y, 4 + row * 6, 2);
    if (row % 3 === 0)
      for (let tile = x + 5; tile < 49 + row * 3; tile += 12)
        px(c, '#915d3e', tile, y, 1, 2);
  }
  px(c, '#664a33', 1, 45, 94, 4);
  px(c, '#e1ba7b', 3, 45, 90, 2);
  // Tiny sunlit attic window and two shuttered front windows.
  px(c, '#614b35', 43, 31, 10, 10);
  px(c, '#f1d493', 45, 33, 6, 6);
  px(c, '#b78b53', 47, 33, 1, 6);
  for (const x of [19, 63]) {
    px(c, '#73543b', x - 3, 53, 20, 15);
    px(c, '#718453', x - 2, 54, 4, 12);
    px(c, '#718453', x + 12, 54, 4, 12);
    px(c, '#f3d89a', x + 3, 54, 8, 11);
    px(c, '#a07a4b', x + 6, 54, 2, 11);
    px(c, '#a07a4b', x + 3, 59, 8, 2);
    px(c, '#d7b783', x, 68, 14, 2);
  }
  px(c, '#624832', 39, 55, 18, 24);
  px(c, '#a17b4b', 41, 57, 14, 21);
  px(c, '#c39a60', 42, 58, 3, 19);
  px(c, '#f1d493', 51, 67, 2, 2);
  // Porch steps align with the retained door / smith interaction lane.
  px(c, '#72563b', 35, 78, 26, 5);
  px(c, '#d8ba81', 35, 78, 26, 2);
  px(c, '#8d7956', 31, 83, 34, 4);
  px(c, '#cbb68b', 31, 83, 34, 2);
  for (const x of [20, 68]) {
    px(c, '#77543a', x, 72, 11, 7);
    px(c, '#c08b5b', x, 72, 11, 2);
    oval(c, '#587448', x + 5, 70, 8, 4);
    px(c, '#efd09b', x + 1, 67, 3, 3);
    px(c, '#d99788', x + 7, 69, 3, 2);
  }
}
