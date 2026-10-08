import type Phaser from 'phaser';
import type { World, Projectile, Effect } from '@panda/shared';
import type { WeaponPose } from './weapons';

// Existing shared effect contract identifies Bloom without changing the protocol.
export function isMageBloom(effect: Effect): boolean {
  return effect.kind === 'magic' && effect.radius === 180;
}

/** Authority-only release envelopes, independent of staff animation progress. */
export class MageEffects {
  private instance = '';
  private tick = -1;
  private seen = new Set<string>();
  private releases = new Map<
    string,
    { started: number; duration: number; special: boolean }
  >();

  observe(world: World, time: number): void {
    const baseline =
      this.instance !== world.instanceId || world.tick < this.tick;
    if (baseline) this.releases.clear();
    for (const [id, pulse] of this.releases)
      if (
        time - pulse.started >= pulse.duration ||
        !world.players.some((p) => p.id === id && p.hp > 0)
      )
        this.releases.delete(id);
    if (!baseline) {
      for (const bolt of world.projectiles) {
        if (bolt.hostile || this.seen.has(bolt.id)) continue;
        const owner = world.players.find((p) => p.id === bolt.owner);
        if (owner?.hero === 'ape' && owner.hp > 0)
          this.releases.set(owner.id, {
            started: time,
            duration: 180,
            special: false,
          });
      }
      for (const effect of world.effects) {
        // Shared authority emits Bloom with radius 180; hostile magic is 145.
        if (!isMageBloom(effect) || this.seen.has(effect.id)) continue;
        const owner = world.players.find(
          (p) =>
            p.hero === 'ape' &&
            p.hp > 0 &&
            (p.action === 'special' || p.cooldown > 0.6) &&
            Math.hypot(p.x - effect.x, p.y - effect.y) < 32,
        );
        if (owner)
          this.releases.set(owner.id, {
            started: time,
            duration: 260,
            special: true,
          });
      }
    }
    this.instance = world.instanceId;
    this.tick = world.tick;
    this.seen = new Set([
      ...world.projectiles.map((p) => p.id),
      ...world.effects.map((e) => e.id),
    ]);
  }

  pulse(id: string, time: number): { strength: number; special: boolean } {
    const release = this.releases.get(id);
    return {
      strength: release
        ? Math.max(0, 1 - (time - release.started) / release.duration)
        : 0,
      special: release?.special ?? false,
    };
  }

  draw(
    id: string,
    graphics: Phaser.GameObjects.Graphics,
    x: number,
    y: number,
    pose: WeaponPose,
    time: number,
    reduced: boolean,
    opacity: number,
  ): void {
    const pulse = this.pulse(id, time);
    if (!pose.active && pulse.strength <= 0) return;
    const angle = pose.rotation - Math.PI / 2;
    const tipX = x + Math.cos(angle) * 55,
      tipY = y + Math.sin(angle) * 55;
    const focus = pose.active ? Math.sin(Math.PI * pose.progress) : 0;
    const special = pose.special || pulse.special;
    const motion = reduced ? 0.45 : 1;
    const glow =
      (0.08 + focus * (special ? 0.16 : 0.1) + pulse.strength * 0.18) * opacity;
    graphics.fillStyle(0x8bded3, glow * motion);
    graphics.fillCircle(tipX, tipY, special ? 13 : 9);
    graphics.fillStyle(
      0xe2fff0,
      (0.3 * focus + pulse.strength * 0.65) * opacity,
    );
    graphics.fillCircle(tipX, tipY, special ? 3 : 2);
    // Four fixed motes converge gently; no emitter or per-frame object pool.
    for (let i = 0; i < (special ? 4 : 3); i++) {
      const orbit = (reduced ? 0 : time * 0.0015) + i * 2.1;
      const radius = 10 - focus * 4;
      graphics.fillStyle(
        i % 2 ? 0x94cfe8 : 0xbbf4d6,
        focus * 0.55 * motion * opacity,
      );
      graphics.fillRect(
        tipX + Math.cos(orbit) * radius,
        tipY + Math.sin(orbit) * radius * 0.65,
        2,
        2,
      );
    }
    if (pulse.strength > 0) {
      const radius =
        (special ? 7 : 4) + (1 - pulse.strength) * (special ? 10 : 7);
      graphics.lineStyle(1, 0xc3f9e8, pulse.strength * 0.7 * motion * opacity);
      graphics.strokeCircle(tipX, tipY, radius);
      graphics.lineStyle(2, 0xabdfef, pulse.strength * 0.65 * motion * opacity);
      graphics.lineBetween(
        tipX,
        tipY,
        tipX + Math.cos(pose.facingAngle) * 13,
        tipY + Math.sin(pose.facingAngle) * 13,
      );
    }
  }
}

/** A short tapered wake follows the actual authoritative bolt velocity. */
export function drawMageProjectile(
  graphics: Phaser.GameObjects.Graphics,
  bolt: Projectile,
  reduced: boolean,
): void {
  const speed = Math.hypot(bolt.velocity.x, bolt.velocity.y);
  if (speed === 0 || bolt.hostile) return;
  const fade = Math.min(1, bolt.life / 0.15) * (reduced ? 0.45 : 1);
  for (let i = 0; i < 3; i++) {
    const length = 6 + i * 6;
    graphics.fillStyle(i === 0 ? 0xd4fff0 : 0x8fcddd, fade * (0.35 - i * 0.1));
    graphics.fillCircle(
      bolt.x - (bolt.velocity.x / speed) * length,
      bolt.y - (bolt.velocity.y / speed) * length,
      3 - i * 0.65,
    );
  }
}
