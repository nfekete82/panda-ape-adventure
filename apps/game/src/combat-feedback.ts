import type { Effect, World } from '@panda/shared';

/** Deduplicates authority events, including held snapshots and reconnect baselines. */
export class CombatFeedback {
  private instance = '';
  private tick = -1;
  private seen = new Set<string>();
  private frozenUntil = 0;
  private frozenAt = 0;
  private offset = 0;

  private settle(time: number): void {
    if (this.frozenUntil > 0 && time >= this.frozenUntil) {
      this.offset += this.frozenUntil - this.frozenAt;
      this.frozenUntil = 0;
    }
  }

  observe(world: World, time: number): Effect[] {
    const baseline =
      this.instance !== world.instanceId || world.tick < this.tick;
    const hits = baseline
      ? []
      : world.effects.filter(
          (effect) =>
            effect.kind === 'hit' && effect.text && !this.seen.has(effect.id),
        );
    this.settle(time);
    if (baseline) {
      this.frozenUntil = 0;
      this.offset = 0;
    }
    this.instance = world.instanceId;
    this.tick = world.tick;
    this.seen = new Set(world.effects.map((effect) => effect.id));
    if (hits.length && time >= this.frozenUntil) {
      this.frozenAt = time;
      this.frozenUntil = time + 45;
    }
    return hits;
  }

  /** Freeze the presentation clock only; simulation/network processing continue. */
  clock(time: number, reducedMotion: boolean): number {
    this.settle(time);
    if (reducedMotion) {
      this.offset = 0;
      this.frozenUntil = 0;
      return time;
    }
    return (time < this.frozenUntil ? this.frozenAt : time) - this.offset;
  }
}
