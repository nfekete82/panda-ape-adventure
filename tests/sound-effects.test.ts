import { describe, expect, it } from 'vitest';
import { createPlayer, createWorld } from '@panda/shared';
import { WorldSoundTracker } from '../apps/game/src/sound-events';

const initial = () => {
  const world = createWorld();
  const player = createPlayer('local', 'panda');
  world.players.push(player);
  const tracker = new WorldSoundTracker();
  expect(tracker.observe(world, 'local')).toEqual([]);
  return { world, player, tracker };
};

describe('one-shot game sound events', () => {
  it('plays a sword swoosh for a new slash effect, never for the same snapshot', () => {
    const { world, player, tracker } = initial();
    world.effects.push({
      id: 'swing-1',
      x: player.x + 35,
      y: player.y,
      life: 0.45,
      kind: 'slash',
      radius: 50,
    });
    expect(tracker.observe(world, player.id).map((c) => c.name)).toEqual([
      'sword',
    ]);
    expect(tracker.observe(world, player.id)).toEqual([]);
    world.effects = [];
    tracker.observe(world, player.id);
    world.effects.push({
      id: 'swing-2',
      x: player.x,
      y: player.y,
      life: 0.45,
      kind: 'slash',
      radius: 50,
    });
    expect(tracker.observe(world, player.id)[0]?.name).toBe('sword');
  });

  it('recognizes only real pickups, not healing or level-up notices', () => {
    const { world, player, tracker } = initial();
    for (const [id, text] of [
      ['loot', '+2 crystal'],
      ['heal', '+70'],
      ['level', 'LEVEL UP'],
    ] as const)
      world.effects.push({
        id,
        x: player.x,
        y: player.y,
        life: 0.45,
        kind: 'heal',
        radius: 12,
        text,
      });
    expect(tracker.observe(world, player.id).map((c) => c.name)).toEqual([
      'pickup',
    ]);
    expect(tracker.observe(world, player.id)).toEqual([]);
  });

  it('plays one magical cue for shrine awakening without replaying old snapshots', () => {
    const { world, player, tracker } = initial();
    world.effects.push({
      id: 'shrine-activation', x: player.x, y: player.y,
      life: 0.45, kind: 'magic', radius: 78, text: 'SHRINE AWAKENED',
    });
    expect(tracker.observe(world, player.id).map((cue) => cue.name)).toEqual(['arcane']);
    expect(tracker.observe(world, player.id)).toEqual([]);
  });

  it('plays a grunt only on a living-to-defeated transition', () => {
    const { world, player, tracker } = initial();
    const enemy = world.enemies[0]!;
    enemy.x = player.x + 24;
    enemy.y = player.y;
    enemy.hp = 0;
    expect(tracker.observe(world, player.id).map((c) => c.name)).toEqual([
      'defeat',
    ]);
    expect(tracker.observe(world, player.id)).toEqual([]);
    enemy.hp = enemy.maxHp;
    tracker.observe(world, player.id);
    enemy.hp = 0;
    expect(tracker.observe(world, player.id)[0]?.name).toBe('defeat');
  });

  it('recognizes a new Ape attack projectile but never hostile projectiles', () => {
    const { world, player, tracker } = initial();
    player.hero = 'ape';
    world.projectiles.push({
      id: 'arcane-1',
      owner: 'local',
      hostile: false,
      x: player.x,
      y: player.y,
      life: 1.5,
      velocity: { x: 440, y: 0 },
      damage: 15,
    });
    world.projectiles.push({
      id: 'hostile-1',
      owner: 'foe',
      hostile: true,
      x: player.x,
      y: player.y,
      life: 1.5,
      velocity: { x: 0, y: 0 },
      damage: 15,
    });
    expect(tracker.observe(world, player.id).map((c) => c.name)).toEqual([
      'arcane',
    ]);
    expect(tracker.observe(world, player.id)).toEqual([]);
  });

  it('attenuates nearby sounds and ignores events outside listening range', () => {
    const { world, player, tracker } = initial();
    world.effects.push(
      {
        id: 'near',
        x: player.x + 120,
        y: player.y,
        kind: 'slash',
        life: 0.45,
        radius: 50,
      },
      {
        id: 'far',
        x: player.x + 900,
        y: player.y,
        kind: 'slash',
        life: 0.45,
        radius: 50,
      },
    );
    const cues = tracker.observe(world, player.id);
    expect(cues).toHaveLength(1);
    expect(cues[0]!.strength).toBeGreaterThan(0);
    expect(cues[0]!.strength).toBeLessThan(1);
  });

  it('does not replay buffered sounds after reconnect or a new game', () => {
    const { world, player, tracker } = initial();
    world.effects.push({
      id: 'old',
      x: player.x,
      y: player.y,
      kind: 'slash',
      life: 0.45,
      radius: 50,
    });
    world.tick = 100;
    expect(tracker.observe(world, player.id)).toHaveLength(1);
    world.tick = 10;
    expect(tracker.observe(world, player.id)).toEqual([]);
    world.instanceId = 'another-game';
    world.effects.push({
      id: 'still-old',
      x: player.x,
      y: player.y,
      kind: 'slash',
      life: 0.45,
      radius: 50,
    });
    expect(tracker.observe(world, player.id)).toEqual([]);
    tracker.reset();
    expect(tracker.observe(world, player.id)).toEqual([]);
  });

  it('limits simultaneous area-effect voices and avoids sounds without a listener', () => {
    const { world, player, tracker } = initial();
    for (let i = 0; i < 20; i++) {
      world.effects.push({
        id: `slash-${i}`,
        x: player.x,
        y: player.y,
        kind: 'slash',
        life: 0.45,
        radius: 50,
      });
    }
    expect(tracker.observe(world, 'missing')).toEqual([]);
    world.effects.push({
      id: 'last',
      x: player.x,
      y: player.y,
      kind: 'slash',
      life: 0.45,
      radius: 50,
    });
    expect(tracker.observe(world, player.id).map((c) => c.name)).toEqual([
      'sword',
    ]);
    tracker.reset();
    tracker.observe(world, player.id);
    world.effects.push(
      ...Array.from({ length: 20 }, (_, i) => ({
        id: `new-${i}`,
        x: player.x,
        y: player.y,
        kind: 'slash' as const,
        life: 0.45,
        radius: 50,
      })),
    );
    expect(tracker.observe(world, player.id)).toHaveLength(6);
  });
});
