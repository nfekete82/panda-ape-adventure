import type { SoundCue, SoundCueName } from './sound-events';

/** Small offline-friendly procedural SFX bank. No new binaries or fetches. */
const noiseCache = new WeakMap<AudioContext, AudioBuffer>();

function noiseBuffer(ctx: AudioContext): AudioBuffer {
  const cached = noiseCache.get(ctx);
  if (cached) return cached;
  const buffer = ctx.createBuffer(
    1,
    Math.ceil(ctx.sampleRate * 0.52),
    ctx.sampleRate,
  );
  const data = buffer.getChannelData(0);
  let seed = 0x12fa31c;
  for (let i = 0; i < data.length; i++) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    data[i] = (seed / 2147483648 - 1) * 0.85;
  }
  noiseCache.set(ctx, buffer);
  return buffer;
}

function envelope(
  ctx: AudioContext,
  start: number,
  duration: number,
  loudness: number,
): GainNode {
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.linearRampToValueAtTime(
    Math.max(0.0002, loudness),
    start + Math.min(0.016, duration * 0.13),
  );
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  gain.connect(ctx.destination);
  return gain;
}

function note(
  ctx: AudioContext,
  start: number,
  from: number,
  to: number,
  duration: number,
  type: OscillatorType,
  loudness: number,
): void {
  const oscillator = ctx.createOscillator();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(from, start);
  oscillator.frequency.exponentialRampToValueAtTime(
    Math.max(30, to),
    start + duration,
  );
  oscillator.connect(envelope(ctx, start, duration, loudness));
  oscillator.start(start);
  oscillator.stop(start + duration + 0.002);
}

function breath(
  ctx: AudioContext,
  start: number,
  duration: number,
  from: number,
  to: number,
  loudness: number,
  type: BiquadFilterType = 'bandpass',
): void {
  const source = ctx.createBufferSource();
  source.buffer = noiseBuffer(ctx);
  const filter = ctx.createBiquadFilter();
  filter.type = type;
  filter.Q.value = type === 'bandpass' ? 0.65 : 0.72;
  filter.frequency.setValueAtTime(from, start);
  filter.frequency.exponentialRampToValueAtTime(to, start + duration);
  source.connect(filter);
  filter.connect(envelope(ctx, start, duration, loudness));
  source.start(start);
  source.stop(start + duration + 0.002);
}

/**
 * Sword: airy swoosh; loot: a pair of bright chimes; defeat: low-pitched
 * breathy 'uff' / grunt. Subtle sounds deliberately sit under game music.
 */
export function playSoundCue(
  ctx: AudioContext,
  cue: SoundCue,
  masterVolume: number,
): void {
  if (ctx.state !== 'running') return;
  const level = Math.max(0, Math.min(1, masterVolume)) * cue.strength;
  if (level <= 0) return;
  const now = ctx.currentTime + 0.006;
  // A small pitch change avoids the exact same 'sample' on repeated swings.
  // This randomness is audio-only, never part of the authoritative simulation.
  const pitch = 0.95 + Math.random() * 0.1;
  const presets: Record<SoundCueName, () => void> = {
    shrine: () => {
      note(ctx, now, 420 * pitch, 560 * pitch, 0.42, 'sine', level * 0.3);
      note(
        ctx,
        now + 0.14,
        630 * pitch,
        840 * pitch,
        0.53,
        'sine',
        level * 0.29,
      );
      note(
        ctx,
        now + 0.32,
        840 * pitch,
        1260 * pitch,
        0.48,
        'triangle',
        level * 0.19,
      );
    },
    sword: () => {
      breath(ctx, now, 0.19, 730 * pitch, 2400 * pitch, level * 0.68);
      note(
        ctx,
        now + 0.018,
        210 * pitch,
        90 * pitch,
        0.16,
        'triangle',
        level * 0.22,
      );
    },
    arcane: () => {
      note(ctx, now, 360 * pitch, 880 * pitch, 0.2, 'sine', level * 0.36);
      note(ctx, now + 0.052, 590, 1220, 0.2, 'triangle', level * 0.19);
      breath(ctx, now, 0.16, 1800, 900, level * 0.14);
    },
    pickup: () => {
      note(ctx, now, 650 * pitch, 850 * pitch, 0.11, 'sine', level * 0.48);
      note(
        ctx,
        now + 0.088,
        980 * pitch,
        1380 * pitch,
        0.17,
        'sine',
        level * 0.44,
      );
    },
    defeat: () => {
      note(ctx, now, 165 * pitch, 73 * pitch, 0.28, 'sawtooth', level * 0.21);
      breath(ctx, now + 0.015, 0.24, 650, 230, level * 0.46, 'lowpass');
      note(
        ctx,
        now + 0.028,
        113 * pitch,
        62 * pitch,
        0.22,
        'triangle',
        level * 0.33,
      );
    },
    hit: () => {
      breath(ctx, now, 0.09, 1550, 400, level * 0.28);
      note(ctx, now, 140, 75, 0.1, 'triangle', level * 0.18);
    },
  };
  presets[cue.name]();
}
