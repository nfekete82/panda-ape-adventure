import { describe, expect, it } from 'vitest';
import { createWorld, createPlayer, neutralInput, step } from '@panda/shared';
import { weaponPose } from '../apps/game/src/weapons';
import { MageEffects } from '../apps/game/src/mage-effects';

describe('Ape mage presentation', () => {
  it('keeps casts compact and continuous in all eight directions, with readable faces', () => {
    for (let direction = 0; direction < 8; direction++) {
      const facing = {
        x: Math.cos((direction * Math.PI) / 4),
        y: Math.sin((direction * Math.PI) / 4),
      };
      for (const special of [false, true]) {
        const duration = special ? 1.1 : 0.5;
        const sample = (t: number) =>
          weaponPose(
            'ape',
            facing,
            special ? 'special' : 'attack',
            duration * (1 - t),
            0.5,
            0,
            special,
          );
        const angles: number[] = [];
        for (let i = 0; i <= 100; i++) {
          const pose = sample(i / 100);
          angles.push(pose.rotation);
          expect(Math.abs(pose.bodyAngle)).toBeLessThanOrEqual(0.90001);
          expect(Math.hypot(pose.bodyDx, pose.bodyDy)).toBeLessThan(1);
          expect(
            Math.abs(pose.rotation - pose.facingAngle - Math.PI / 2),
          ).toBeLessThanOrEqual(0.161);
          if (facing.y <= 0.15) expect(pose.behindHero).toBe(true);
          else {
            // Every point along the front-layered staff stays outside the face rectangle.
            for (let distance = 0; distance <= 60; distance += 4) {
              const x =
                pose.dx + Math.cos(pose.rotation - Math.PI / 2) * distance;
              const y =
                pose.dy + Math.sin(pose.rotation - Math.PI / 2) * distance;
              expect(Math.abs(x) < 15 && y > -32 && y < -4).toBe(false);
            }
          }
          const next = sample(Math.min(1, i / 100 + 0.0001));
          expect(Math.abs(next.rotation - pose.rotation)).toBeLessThan(0.001);
          expect(Math.hypot(next.dx - pose.dx, next.dy - pose.dy)).toBeLessThan(
            0.005,
          );
        }
        const amplitude = Math.max(...angles) - Math.min(...angles);
        expect(amplitude).toBeLessThan(special ? 0.33 : 0.23);
        const pandaWindup = weaponPose(
          'panda',
          facing,
          'attack',
          0.5 * 0.78,
          0.5,
          0,
        );
        const pandaFollow = weaponPose(
          'panda',
          facing,
          'attack',
          0.5 * 0.44,
          0.5,
          0,
        );
        expect(amplitude).toBeLessThan(
          Math.abs(pandaFollow.rotation - pandaWindup.rotation) * 0.15,
        );
        expect(sample(1).bodyAngle).toBe(0);
      }
    }
  });

  it('gives special channeling more time without increasing melee-like motion', () => {
    const normal = weaponPose(
      'ape',
      { x: 1, y: 0 },
      'attack',
      0.5 * 0.39,
      0.5,
      0,
    );
    const special = weaponPose(
      'ape',
      { x: 1, y: 0 },
      'special',
      1.1 * 0.39,
      0.5,
      0,
    );
    expect(normal.trail).toBe(false);
    expect(special.trail).toBe(true);
    expect(special.bodyAngle).toBeLessThan(0);
    expect(Math.abs(special.bodyAngle)).toBeLessThan(1);
  });

  it('pulses only on actual releases and never replays held snapshots or reconnect baselines', () => {
    const world = createWorld();
    const player = createPlayer('mage', 'ape');
    world.players.push(createPlayer('listener', 'panda'), player);
    const effects = new MageEffects();
    effects.observe(world, 0);
    step(
      world,
      new Map([[player.id, { ...neutralInput(), attack: true }]]),
      1 / 60,
    );
    effects.observe(world, 10);
    expect(effects.pulse(player.id, 10)).toEqual({
      strength: 1,
      special: false,
    });
    effects.observe(world, 100);
    expect(effects.pulse(player.id, 100).strength).toBeCloseTo(0.5);
    effects.observe(world, 200);
    expect(effects.pulse(player.id, 200).strength).toBe(0);
    player.cooldown = 0;
    step(
      world,
      new Map([[player.id, { ...neutralInput(), special: true }]]),
      1 / 60,
    );
    effects.observe(world, 210);
    expect(effects.pulse(player.id, 210)).toEqual({
      strength: 1,
      special: true,
    });
    world.instanceId = 'reconnect';
    effects.observe(world, 220);
    expect(effects.pulse(player.id, 220).strength).toBe(0);
    // Rollback also establishes a baseline rather than replaying effects.
    world.tick = 0;
    effects.observe(world, 230);
    expect(effects.pulse(player.id, 230).strength).toBe(0);
  });

  it('does not invent release feedback for an empty-mana attack or hostile magic', () => {
    const world = createWorld();
    const player = createPlayer('mage', 'ape');
    player.mana = 0;
    world.players.push(player);
    const effects = new MageEffects();
    effects.observe(world, 0);
    step(
      world,
      new Map([[player.id, { ...neutralInput(), attack: true }]]),
      1 / 60,
    );
    effects.observe(world, 10);
    expect(effects.pulse(player.id, 10).strength).toBe(0);
    world.projectiles.push({
      id: 'hostile',
      owner: player.id,
      hostile: true,
      x: player.x,
      y: player.y,
      velocity: { x: 100, y: 0 },
      life: 1,
      damage: 5,
    });
    effects.observe(world, 20);
    expect(effects.pulse(player.id, 20).strength).toBe(0);
    player.action = 'special';
    world.effects.push({
      id: 'hostile-magic',
      kind: 'magic',
      x: player.x,
      y: player.y,
      radius: 145,
      life: 0.45,
    });
    effects.observe(world, 30);
    expect(effects.pulse(player.id, 30).strength).toBe(0);
  });
});
