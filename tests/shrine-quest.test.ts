import { describe, expect, it } from 'vitest';
import {
  createWorld, createPlayer, neutralInput, step, damageEnemy, collides,
  SHRINE_WARDEN_ID, SHRINE_WARDEN_SPAWN, BAMBOO_SHRINE,
  interactShrine, prepareShrineQuest, quantity,
} from '@panda/shared';
import { WorldSoundTracker } from '../apps/game/src/sound-events';

const atShrine = () => {
  const world = createWorld();
  const panda = createPlayer('panda', 'panda');
  panda.x = BAMBOO_SHRINE.x;
  panda.y = BAMBOO_SHRINE.y;
  const ape = createPlayer('ape', 'ape');
  ape.x = BAMBOO_SHRINE.x + 28;
  ape.y = BAMBOO_SHRINE.y;
  world.players.push(panda, ape);
  return { world, panda, ape };
};

describe('Mossbound Shrine adventure', () => {
  it('starts dormant with a unique inactive non-respawning enemy', () => {
    const { world } = atShrine();
    const warden = world.enemies.find((e) => e.id === SHRINE_WARDEN_ID)!;
    expect(world.shrine).toBe('dormant');
    expect(warden.kind).toBe('wisp');
    expect(warden.hp).toBe(0);
    expect(warden.maxHp).toBe(210);
    expect(collides(SHRINE_WARDEN_SPAWN.x, SHRINE_WARDEN_SPAWN.y, 14)).toBe(false);
    step(world, new Map(), 1 / 60);
    expect(warden.hp).toBe(0);
  });

  it('requires proximity and spawns the Jade Warden only on altar interaction', () => {
    const { world, panda } = atShrine();
    panda.x = 500;
    expect(interactShrine(world, panda)).toBe(false);
    expect(world.shrine).toBe('dormant');
    panda.x = BAMBOO_SHRINE.x;
    expect(interactShrine(world, panda)).toBe(true);
    expect(world.shrine).toBe('hunting');
    expect(world.enemies.find((e) => e.id === SHRINE_WARDEN_ID)?.hp).toBe(210);
    const count = world.enemies.length;
    expect(interactShrine(world, panda)).toBe(true);
    expect(world.enemies).toHaveLength(count);
    expect(world.shrine).toBe('hunting');
    expect(world.effects.filter((e) => e.text === 'SHRINE AWAKENED')).toHaveLength(1);
  });

  it('grants a unique one-time blessing to both heroes only after returning', () => {
    const { world, panda, ape } = atShrine();
    expect(interactShrine(world, panda)).toBe(true);
    const warden = world.enemies.find((e) => e.id === SHRINE_WARDEN_ID)!;
    const originalKills = world.kills;
    const previousQuest = world.quest;
    damageEnemy(world, warden, 210, panda);
    expect(world.shrine).toBe('return');
    expect(world.kills).toBe(originalKills);
    expect(world.quest).toBe(previousQuest);
    expect(interactShrine(world, panda)).toBe(true);
    expect(world.shrine).toBe('blessed');
    for (const hero of [panda, ape]) {
      expect(hero.points).toBe(2);
      expect(quantity(hero, 'ancient')).toBe(2);
      expect(quantity(hero, 'crystal')).toBe(8);
      expect(hero.receipts.some((r) => r.endsWith(':shrine-blessing'))).toBe(true);
    }
    const lootCount = world.loot.length;
    expect(interactShrine(world, panda)).toBe(true);
    expect(interactShrine(world, ape)).toBe(true);
    for (const hero of [panda, ape]) {
      expect(hero.points).toBe(2);
      expect(quantity(hero, 'ancient')).toBe(2);
      expect(quantity(hero, 'crystal')).toBe(8);
    }
    expect(world.loot).toHaveLength(lootCount);
  });

  it('does not respawn the Jade Warden after the quest is completed', () => {
    const { world, panda } = atShrine();
    interactShrine(world, panda);
    const warden = world.enemies.find((e) => e.id === SHRINE_WARDEN_ID)!;
    damageEnemy(world, warden, 1000, panda);
    interactShrine(world, panda);
    for (let n = 0; n < 100; n++) step(world, new Map(), 0.05);
    expect(warden.hp).toBe(0);
    expect(world.shrine).toBe('blessed');
  });

  it('migrates legacy worlds without a shrine state or Warden safely', () => {
    const { world } = atShrine();
    delete world.shrine;
    world.enemies = world.enemies.filter((e) => e.id !== SHRINE_WARDEN_ID);
    const before = world.quest;
    const saved = JSON.parse(JSON.stringify(world));
    step(saved, new Map(), 1 / 60);
    expect(saved.shrine).toBe('dormant');
    expect(saved.enemies.filter((e: { id: string }) => e.id === SHRINE_WARDEN_ID)).toHaveLength(1);
    expect(saved.quest).toBe(before);
  });

  it('tracks shrine audio from authoritative events without repeat playback', () => {
    const { world, panda } = atShrine();
    const tracker = new WorldSoundTracker();
    expect(tracker.observe(world, panda.id)).toEqual([]);
    interactShrine(world, panda);
    expect(tracker.observe(world, panda.id).some((cue) => cue.name === 'shrine')).toBe(true);
    expect(tracker.observe(world, panda.id)).toEqual([]);
  });

  it('processes the quest through ordinary E input without changing the protocol', () => {
    const { world, panda } = atShrine();
    const interact = neutralInput();
    interact.interact = true;
    step(world, new Map([[panda.id, interact]]), 1 / 60);
    expect(world.shrine).toBe('hunting');
  });
});
