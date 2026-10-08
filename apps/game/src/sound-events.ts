import type { World } from '@panda/shared';

export type SoundCueName = 'sword' | 'arcane' | 'pickup' | 'defeat' | 'hit';
export interface SoundCue {
  name: SoundCueName;
  strength: number;
}
const LOOT = /^\+\d+ (?:coin|crystal|leather|potion|ancient)$/;
const distanceStrength = (
  listener: { x: number; y: number },
  point: { x: number; y: number },
): number => {
  const distance = Math.hypot(listener.x - point.x, listener.y - point.y);
  return Math.max(0, Math.min(1, (620 - distance) / 520));
};

/**
 * Translates *authoritative* changes to one-shot client sounds.
 * No sound IDs, counters or state are added to saves or network messages.
 * Previous IDs are replaced each frame, keeping memory bounded even in long runs.
 */
export class WorldSoundTracker {
  private instanceId: string | undefined;
  private tick = -1;
  private effects = new Set<string>();
  private projectiles = new Set<string>();
  private enemies = new Map<string, number>();

  reset(): void {
    this.instanceId = undefined;
    this.tick = -1;
    this.effects.clear();
    this.projectiles.clear();
    this.enemies.clear();
  }

  private snapshot(world: World): void {
    this.instanceId = world.instanceId;
    this.tick = world.tick;
    this.effects = new Set(world.effects.map((effect) => effect.id));
    this.projectiles = new Set(world.projectiles.map((bolt) => bolt.id));
    this.enemies = new Map(world.enemies.map((enemy) => [enemy.id, enemy.hp]));
  }

  observe(world: World, listenerId: string): SoundCue[] {
    // New game, first network state, rollback or reconnect: baseline without
    // replaying all the sounds of events that have already happened.
    if (this.instanceId !== world.instanceId || world.tick < this.tick) {
      this.snapshot(world);
      return [];
    }

    const listener = world.players.find((p) => p.id === listenerId);
    const cues: SoundCue[] = [];
    if (listener) {
      const add = (name: SoundCueName, point: { x: number; y: number }) => {
        const strength = distanceStrength(listener, point);
        if (strength > 0) cues.push({ name, strength });
      };

      for (const effect of world.effects) {
        if (this.effects.has(effect.id)) continue;
        if (effect.kind === 'slash') add('sword', effect);
        else if (effect.kind === 'hit' && effect.text) add('hit', effect);
        else if (effect.kind === 'heal' && LOOT.test(effect.text ?? ''))
          add('pickup', effect);
      }

      for (const bolt of world.projectiles) {
        if (this.projectiles.has(bolt.id) || bolt.hostile) continue;
        const owner = world.players.find((player) => player.id === bolt.owner);
        if (owner?.hero === 'ape') add('arcane', bolt);
      }

      for (const enemy of world.enemies) {
        const previousHp = this.enemies.get(enemy.id);
        if (previousHp !== undefined && previousHp > 0 && enemy.hp <= 0)
          add('defeat', enemy);
      }
    }
    this.snapshot(world);

    // A single area attack can defeat many enemies simultaneously.
    // Prioritize the distinct sounds over an overwhelming chorus.
    const rank: Record<SoundCueName, number> = {
      pickup: 0,
      defeat: 1,
      sword: 2,
      arcane: 3,
      hit: 4,
    };
    return cues.sort((a, b) => rank[a.name] - rank[b.name]).slice(0, 6);
  }
}
