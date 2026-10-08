import type Phaser from 'phaser';
import type { WeaponPose } from './weapons';
interface TrailPoint {
  x: number;
  y: number;
  time: number;
  alpha: number;
}
/** Short-lived blade-tip history, bounded to twelve samples per rendered hero. */
export class WeaponTrails {
  private points = new Map<string, TrailPoint[]>();
  remove(id: string): void {
    this.points.delete(id);
  }
  draw(
    id: string,
    graphics: Phaser.GameObjects.Graphics,
    x: number,
    y: number,
    pose: WeaponPose,
    time: number,
    reduced: boolean,
  ): void {
    let points = this.points.get(id);
    if (!points) {
      points = [];
      this.points.set(id, points);
    }
    while (points[0] && time - points[0].time > 150) points.shift();
    const angle = pose.rotation - Math.PI / 2;
    if (pose.trail) {
      const direction = pose.variation === 1 ? -1 : 1;
      const alpha = pose.trailAlpha * (reduced ? 0.5 : 1);
      for (let i = 0; i < 8; i++) {
        const a = angle - direction * i * 0.075;
        const b = a - direction * 0.075;
        graphics.lineStyle(8 - i * 0.7, 0xe8c983, alpha * (1 - i / 8) * 0.18);
        graphics.lineBetween(
          x + Math.cos(a) * 53,
          y + Math.sin(a) * 53,
          x + Math.cos(b) * 53,
          y + Math.sin(b) * 53,
        );
        graphics.lineStyle(3 - i * 0.25, 0xfff3d5, alpha * (1 - i / 8));
        graphics.lineBetween(
          x + Math.cos(a) * 53,
          y + Math.sin(a) * 53,
          x + Math.cos(b) * 53,
          y + Math.sin(b) * 53,
        );
      }
    }
    if (
      pose.trail &&
      (!points.length || time - (points.at(-1)?.time ?? 0) >= 12)
    ) {
      points.push({
        x: x + Math.cos(angle) * 53,
        y: y + Math.sin(angle) * 53,
        time,
        alpha: pose.trailAlpha,
      });
      if (points.length > 12) points.shift();
    }
    for (let i = 1; i < points.length; i++) {
      const a = points[i - 1],
        b = points[i];
      if (!a || !b) continue;
      const alpha =
        b.alpha * Math.max(0, 1 - (time - a.time) / 150) * (reduced ? 0.5 : 1);
      graphics.lineStyle(7, 0xe8c983, alpha * 0.22);
      graphics.lineBetween(a.x, a.y, b.x, b.y);
      graphics.lineStyle(2, 0xfff3d5, alpha);
      graphics.lineBetween(a.x, a.y, b.x, b.y);
    }
  }
}
