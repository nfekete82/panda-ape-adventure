/** Presentation state only. Numeric labels always show the authoritative values. */
export class StatusPresentation {
  private hero = '';
  private hp = 0;
  private mana = 0;
  private damagedUntil = 0;
  private spentUntil = 0;

  update(hero: string, hp: number, mana: number, time: number) {
    if (hero === this.hero) {
      if (hp < this.hp) this.damagedUntil = time + 360;
      if (mana < this.mana) this.spentUntil = time + 280;
    } else {
      this.damagedUntil = this.spentUntil = 0;
    }
    this.hero = hero;
    this.hp = hp;
    this.mana = mana;
    return { damaged: time < this.damagedUntil, spent: time < this.spentUntil };
  }
}
export function statusPercent(value: number, maximum: number): number {
  return maximum > 0 ? Math.max(0, Math.min(100, (value / maximum) * 100)) : 0;
}
