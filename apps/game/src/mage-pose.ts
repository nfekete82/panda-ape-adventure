import type { WeaponPose } from './weapons';
const smooth = (value: number): number => {
  const t = Math.max(0, Math.min(1, value));
  return t * t * t * (t * (t * 6 - 15) + 10);
};
const blend = (a: number, b: number, t: number): number => a + (b - a) * t;

/** Small ready/channel/aim/settle gestures; never a melee sweep. */
export function magePose(
  fx: number,
  fy: number,
  active: boolean,
  special: boolean,
  progress: number,
  time: number,
): WeaponPose {
  const idle = 0.06 + Math.sin(time * 0.002) * 0.018;
  const ready = special ? -0.16 : -0.1;
  const aimed = special ? 0.16 : 0.12;
  const channelEnd = special ? 0.52 : 0.44;
  const releaseEnd = special ? 0.66 : 0.58;
  const preparation = smooth(progress / 0.18);
  const channel = smooth((progress - 0.18) / (channelEnd - 0.18));
  const release = smooth((progress - channelEnd) / (releaseEnd - channelEnd));
  const recovery = smooth((progress - releaseEnd) / (1 - releaseEnd));
  const angle = !active
    ? idle
    : progress < 0.18
      ? blend(idle, ready, preparation)
      : progress < channelEnd
        ? blend(ready, ready * 0.7, channel)
        : progress < releaseEnd
          ? blend(ready * 0.7, aimed, release)
          : blend(aimed, idle, recovery);
  const focus = active ? preparation * (1 - recovery) : 0;
  const reach = 28 + (special ? 1.5 : 1) * release * (1 - recovery);
  const facingAngle = Math.atan2(fy, fx);
  return {
    dx: fx * reach - fy * 7,
    dy: fy * reach + Math.abs(fx) * 8 + 7,
    rotation: facingAngle + Math.PI / 2 + angle,
    facingAngle,
    progress,
    sweep: release,
    active,
    special,
    variation: 0,
    // Preserve the existing FX-window contract; this is channel light, not a blade trail.
    trail: active && progress > 0.18 && progress < releaseEnd,
    trailAlpha: focus * 0.3,
    behindHero: fy <= 0.15,
    bodyAngle:
      focus > 0 ? focus * (fx < -0.15 ? -1 : 1) * (special ? -0.9 : -0.5) : 0,
    bodyDx: -fx * focus * (special ? 0.8 : 0.5),
    bodyDy: -fy * focus * 0.4,
  };
}
