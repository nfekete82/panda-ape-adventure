import { describe, expect, it } from 'vitest';
import {
  BAMBOO_SHRINE,
  createPlayer,
  createWorld,
  damageEnemy,
  neutralInput,
  migrateWorld,
  quantity,
  step,
} from '@panda/shared';

const interact = (world: ReturnType<typeof createWorld>, player: ReturnType<typeof createPlayer>) => {
  const input = neutralInput();
  input.interact = true;
  step(world, new Map([[player.id, input]]), 0.016);
};

describe('Mossbound Shrine adventure', () => {
  it('starts at the altar, requires its eastern sentinel and grants a one-time relic', () => {
    const world = createWorld();
    const player = createPlayer('solo', 'panda');
    world.players.push(player);
    player.x = BAMBOO_SHRINE.x;
    player.y = BAMBOO_SHRINE.y;
    const sentinel = world.enemies.find((enemy) => enemy.id === 'enemy11');
    expect(sentinel?.kind).toBe('wisp');
    expect(sentinel?.hp).toBeGreaterThan(0);

    interact(world, player);
    expect(world.message).toContain('defeat the guardian spirit');
    expect(player.receipts.some((receipt) => receipt.endsWith('shrine:awakened'))).toBe(true);
    interact(world, player);
    expect(quantity(player, 'ancient')).toBe(0);

    damageEnemy(world, sentinel!, 1000, player);
    expect(player.receipts.some((receipt) => receipt.endsWith('shrine:sentinel'))).toBe(true);
    const oldXp = player.xp;
    interact(world, player);
    expect(quantity(player, 'ancient')).toBe(1);
    expect(quantity(player, 'crystal')).toBe(6);
    expect(player.xp).toBeGreaterThanOrEqual(oldXp);
    expect(player.receipts.some((receipt) => receipt.endsWith('shrine:rewarded'))).toBe(true);
    const count = player.receipts.length;
    interact(world, player);
    expect(quantity(player, 'ancient')).toBe(1);
    expect(player.receipts).toHaveLength(count);
  });

  it('is inaccessible from far away and each co-op hero claims once', () => {
    const world = createWorld();
    const panda = createPlayer('panda', 'panda');
    const ape = createPlayer('ape', 'ape');
    world.players.push(panda, ape);
    interact(world, panda);
    expect(panda.receipts).toHaveLength(0);
    panda.x = ape.x = BAMBOO_SHRINE.x;
    panda.y = ape.y = BAMBOO_SHRINE.y;
    interact(world, panda);
    interact(world, ape);
    expect(panda.receipts).toHaveLength(1);
    expect(ape.receipts).toHaveLength(1);
    damageEnemy(world, world.enemies.find((enemy) => enemy.id === 'enemy11')!, 1000, panda);
    interact(world, panda);
    interact(world, ape);
    expect(quantity(panda, 'ancient')).toBe(1);
    expect(quantity(ape, 'ancient')).toBe(1);
  });

  it('migrates a saved world created before the shrine guardian was introduced', () => {
    const previous = createWorld();
    previous.enemies = previous.enemies.filter((enemy) => enemy.id !== 'enemy11');
    previous.respawn.wisp.maximum = 3;
    const saved = structuredClone(previous);
    const loaded = migrateWorld(saved);
    expect(loaded).not.toBeNull();
    expect(loaded?.enemies.filter((enemy) => enemy.id === 'enemy11')).toHaveLength(1);
    expect(loaded?.respawn.wisp.maximum).toBe(4);
    expect(migrateWorld(loaded)?.enemies.filter((enemy) => enemy.id === 'enemy11')).toHaveLength(1);
  });

  it('retains quest progress in existing player receipts without introducing save fields', () => {
    const world = createWorld();
    const player = createPlayer('local', 'ape');
    world.players.push(player);
    player.x = BAMBOO_SHRINE.x;
    player.y = BAMBOO_SHRINE.y;
    interact(world, player);
    const restored = structuredClone(world);
    expect(restored.players[0]?.receipts).toEqual(player.receipts);
    interact(restored, restored.players[0]!);
    expect(restored.message).toContain('seek the guardian spirit');
  });
});
