import { expect, it } from 'vitest';
import {
  applyValleyAction,
  cellPoint,
  collides,
  createPlayer,
  createWorld,
  FARM,
  migrateWorld,
  placementError,
} from '@panda/shared';
import { findClickPath } from '../apps/game/src/click-path';

it('keeps all 32 fixed cells usable and preserves their planted/watered state through save migration', () => {
  const world = createWorld(),
    player = createPlayer('local', 'ape');
  world.players = [player];
  world.valley.bag.carrotSeed = 32;
  world.valley.bag.wateringCan = 1;
  let seq = 0;
  expect(FARM).toEqual({ x: 400, y: 1220, columns: 8, rows: 4, tile: 32 });
  for (let cell = 0; cell < 32; cell++) {
    const at = cellPoint(cell);
    expect(at).toEqual({
      x: 416 + (cell % 8) * 32,
      y: 1236 + Math.floor(cell / 8) * 32,
    });
    expect(collides(at.x, at.y, 14, world)).toBe(false);
    expect(placementError(world, cell)).toBeNull();
    Object.assign(player, at);
    expect(
      applyValleyAction(world, player, { kind: 'hoe', cell }, ++seq),
    ).toBeNull();
    expect(
      applyValleyAction(
        world,
        player,
        { kind: 'plant', cell, crop: 'carrot' },
        ++seq,
      ),
    ).toBeNull();
    expect(
      applyValleyAction(world, player, { kind: 'water', cell }, ++seq),
    ).toBeNull();
  }
  expect(world.valley.plots).toHaveLength(32);
  expect(world.valley.bag.carrotSeed).toBe(0);
  const legacy: unknown = JSON.parse(JSON.stringify(world));
  const envelope: unknown = JSON.parse(JSON.stringify({ version: 3, world }));
  expect(migrateWorld(legacy)?.valley.plots).toEqual(world.valley.plots);
  expect(migrateWorld(envelope)?.valley.plots).toEqual(world.valley.plots);
});

it('click routes honor solid farm furniture and reopen when that furniture is removed', () => {
  const world = createWorld();
  const target = cellPoint(4),
    start = { x: target.x, y: target.y - 60 };
  const openPath = findClickPath(start, target, world);
  const last = openPath.at(-1);
  if (!last) throw Error('Expected an open route');
  // The bounded router finishes at the containing 32-pixel navigation cell.
  expect(Math.hypot(last.x - target.x, last.y - target.y)).toBeLessThan(24);
  world.valley.buildings.push({ cell: 4, recipe: 'workbench' });
  expect(collides(target.x, target.y, 14, world)).toBe(true);
  expect(findClickPath(start, target, world)).toEqual([]);
  world.valley.buildings = [];
  expect(findClickPath(start, target, world)).toEqual(openPath);
});
