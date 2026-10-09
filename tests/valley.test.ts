import { expect, it } from 'vitest';
import {
  createWorld,
  createPlayer,
  applyValleyAction,
  advanceValley,
  cellPoint,
  DAY_SECONDS,
  CROP_IDS,
  CROPS,
  ITEMS,
  FARM,
  WORLD,
  RESOURCE_NODES,
  placementError,
  collides,
  move,
  isValley,
  migrateWorld,
  parseMessage,
  type ValleyAction,
} from '@panda/shared';

const parseClientMessage = (value: unknown) =>
  parseMessage(JSON.stringify(value));

function setup(hero: 'panda' | 'ape' = 'panda') {
  const w = createWorld(),
    p = createPlayer('gardener', hero);
  w.players = [p];
  let seq = 0;
  return { w, p, act: (a: ValleyAction) => applyValleyAction(w, p, a, ++seq) };
}

it('completes all four deterministic crop cycles, trades profit and builds a colliding workbench', () => {
  const { w, p, act } = setup();
  Object.assign(p, WORLD.npc);
  expect(act({ kind: 'buy', item: 'wateringCan', count: 1 })).toBeNull();
  for (const [cell, crop] of CROP_IDS.entries()) {
    Object.assign(p, cellPoint(cell));
    expect(act({ kind: 'hoe', cell })).toBeNull();
    expect(act({ kind: 'plant', cell, crop })).toBeNull();
    expect(act({ kind: 'harvest', cell })).toContain('not ripe');
    advanceValley(w.valley, DAY_SECONDS);
    expect(w.valley.plots[cell]).toMatchObject({ growth: 0 });
    for (let day = 0; day < CROPS[crop].days; day++) {
      expect(act({ kind: 'water', cell })).toBeNull();
      advanceValley(w.valley, DAY_SECONDS);
    }
    expect(act({ kind: 'harvest', cell })).toBeNull();
    expect(w.valley.bag[crop]).toBe(1);
    expect(act({ kind: 'harvest', cell })).toContain('not ripe');
    Object.assign(p, WORLD.npc);
    expect(act({ kind: 'sell', item: crop, count: 1 })).toBeNull();
  }
  expect(w.valley.gold).toBe(
    18 - 6 + CROP_IDS.reduce((s, c) => s + ITEMS[c].sell, 0),
  );
  for (let n = 0; n < 2; n++) {
    Object.assign(p, RESOURCE_NODES[0]);
    expect(act({ kind: 'gather', node: 0 })).toBeNull();
    advanceValley(w.valley, DAY_SECONDS);
  }
  Object.assign(p, RESOURCE_NODES[1]);
  expect(act({ kind: 'gather', node: 1 })).toBeNull();
  Object.assign(p, cellPoint(7));
  p.y -= 60;
  expect(act({ kind: 'build', cell: 7, recipe: 'workbench' })).toBeNull();
  expect(w.valley.bag.wood).toBe(2);
  expect(w.valley.bag.stone).toBe(2);
  expect(w.valley.buildings).toEqual([{ cell: 7, recipe: 'workbench' }]);
  const point = cellPoint(7);
  expect(collides(point.x, point.y, 14, w)).toBe(true);
  const body = { x: point.x, y: point.y - 40 };
  move(body, 0, 24, 14, w);
  expect(body.y).toBeLessThan(point.y - 20);
  expect(isValley(w.valley)).toBe(true);
});

it('Panda waters one neighbour without wrapping rows; Ape consumes the advertised discount', () => {
  const { w, p, act } = setup();
  w.valley.bag.wateringCan = 1;
  for (const cell of [6, 7, 8])
    w.valley.plots.push({
      cell,
      state: 'planted',
      crop: 'tomato',
      growth: 0,
      watered: false,
    });
  Object.assign(p, cellPoint(6));
  expect(act({ kind: 'water', cell: 6 })).toBeNull();
  expect(w.valley.plots[1]).toMatchObject({ watered: true });
  expect(w.valley.plots[2]).toMatchObject({ watered: false });
  p.hero = 'ape';
  w.valley.bag.wood = 5;
  w.valley.bag.stone = 2;
  Object.assign(p, cellPoint(0));
  p.y -= 60;
  expect(act({ kind: 'build', cell: 0, recipe: 'workbench' })).toBeNull();
  expect(w.valley.bag.wood).toBe(0);
});

it('transactions reject stale, distant, occupied, unaffordable and repeated requests without duplication', () => {
  const { w, p, act } = setup();
  const initial = structuredClone(w.valley);
  expect(act({ kind: 'buy', item: 'carrotSeed', count: 1 })).toContain('Rowan');
  expect(w.valley).toEqual(initial);
  Object.assign(p, WORLD.npc);
  expect(act({ kind: 'sell', item: 'carrot', count: 1 })).toContain(
    'Not enough',
  );
  expect(act({ kind: 'buy', item: 'strawberrySeed', count: 99 })).toContain(
    'Not enough',
  );
  expect(w.valley).toEqual(initial);
  Object.assign(p, RESOURCE_NODES[0]);
  expect(act({ kind: 'gather', node: 0 })).toBeNull();
  const gathered = structuredClone(w.valley);
  expect(act({ kind: 'gather', node: 0 })).toContain('tomorrow');
  expect(applyValleyAction(w, p, { kind: 'gather', node: 0 }, 1)).toContain(
    'already',
  );
  expect(w.valley).toEqual(gathered);
  Object.assign(p, cellPoint(0));
  expect(act({ kind: 'build', cell: 0, recipe: 'fence' })).toContain('heroes');
  p.y -= 60;
  expect(act({ kind: 'build', cell: 0, recipe: 'workbench' })).toContain(
    'materials',
  );
  expect(w.valley).toEqual(gathered);
  expect(act({ kind: 'build', cell: 0, recipe: 'fence' })).toBeNull();
  expect(act({ kind: 'hoe', cell: 0 })).toContain('occupied');
  expect(act({ kind: 'build', cell: 0, recipe: 'fence' })).toContain(
    'occupied',
  );
  expect(act({ kind: 'remove', cell: 0 })).toBeNull();
  expect(w.valley.bag.wood).toBe(2);
  expect(act({ kind: 'remove', cell: 0 })).toContain('no furniture');
});

it('validates bounded intent, strict fields, saves and legacy migrations', () => {
  for (const action of [
    { kind: 'hoe', cell: -1 },
    { kind: 'hoe', cell: 32 },
    { kind: 'plant', cell: 0, crop: 'money' },
    { kind: 'buy', item: 'carrotSeed', count: 0 },
    { kind: 'sell', item: 'wood', count: 100 },
    { kind: 'build', cell: 0, recipe: 'workbench', gold: 0 },
    { kind: 'gather', node: 4 },
    { kind: 'hoe', cell: 0, x: 100 },
  ])
    expect(parseClientMessage({ type: 'valley', seq: 1, action })).toBeNull();
  expect(
    parseClientMessage({
      type: 'valley',
      seq: 1,
      action: { kind: 'hoe', cell: 0 },
    }),
  ).not.toBeNull();
  const w = createWorld();
  const legacy: Record<string, unknown> = { ...w };
  delete legacy.valley;
  expect(migrateWorld({ version: 2, world: legacy })?.valley).toEqual(w.valley);
  expect(migrateWorld({ version: 3, world: w })?.valley).toEqual(w.valley);
  w.valley.bag.wood = -1;
  expect(migrateWorld(w)).toBeNull();
  w.valley.bag.wood = 0;
  w.valley.plots = [
    { cell: 0, state: 'tilled' },
    { cell: 0, state: 'tilled' },
  ];
  expect(isValley(w.valley)).toBe(false);
});

it('all 32 farm tiles are clear and bounded growth remains deterministic at capacity', () => {
  const a = createWorld(),
    b = createWorld();
  for (let cell = 0; cell < FARM.columns * FARM.rows; cell++) {
    expect(placementError(a, cell)).toBeNull();
    a.valley.plots.push({
      cell,
      state: 'planted',
      crop: 'strawberry',
      growth: 0,
      watered: true,
    });
  }
  b.valley = structuredClone(a.valley);
  for (let n = 0; n < 4500; n++) advanceValley(a.valley, 0.01);
  advanceValley(b.valley, DAY_SECONDS);
  // Floating-point boundary: complete any tiny remainder explicitly.
  advanceValley(a.valley, 1e-8);
  expect(a.valley.day).toBe(b.valley.day);
  expect(a.valley.plots).toEqual(b.valley.plots);
  for (let n = 0; n < 10000; n++) advanceValley(a.valley, DAY_SECONDS);
  expect(a.valley.plots).toHaveLength(32);
  expect(
    a.valley.plots.every(
      (plot) => plot.state === 'planted' && plot.growth === 1,
    ),
  ).toBe(true);
});

it('shared purchases cannot overspend and inventory/gold capacity cannot overflow', () => {
  const { w, p, act } = setup();
  Object.assign(p, WORLD.npc);
  const partner = createPlayer('partner', 'ape');
  Object.assign(partner, WORLD.npc);
  w.players.push(partner);
  expect(act({ kind: 'buy', item: 'strawberrySeed', count: 1 })).toBeNull();
  expect(
    applyValleyAction(
      w,
      partner,
      { kind: 'buy', item: 'strawberrySeed', count: 1 },
      1,
    ),
  ).toContain('Not enough');
  expect(w.valley.gold).toBe(8);
  expect(w.valley.bag.strawberrySeed).toBe(3);
  w.valley.bag.carrotSeed = 9999;
  expect(act({ kind: 'buy', item: 'carrotSeed', count: 1 })).toContain(
    'storage',
  );
  expect(w.valley.gold).toBe(8);
  w.valley.gold = 999999;
  w.valley.bag.carrot = 1;
  expect(act({ kind: 'sell', item: 'carrot', count: 1 })).toContain('capacity');
  expect(w.valley.bag.carrot).toBe(1);
  expect(w.valley.gold).toBe(999999);
});
