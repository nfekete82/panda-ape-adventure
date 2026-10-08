# Combat, loot and enemy defeat sound pass (0.4.4)

Panda & Ape now has five short Web Audio sound effects, synthesized locally
without new binary assets or internet requests:

| Event | Sound |
| --- | --- |
| Panda's confirmed sword attack | Sweeping airy whoosh and short low blade accent |
| Ape's actual spell projectile | Rising magical tones and shimmer |
| Item actually collected | Two bright pickup chimes |
| Enemy HP changes from positive to zero | Breath-like low-pitched “uff” / synthetic grunt |
| Confirmed damage | Very short soft impact click |

Sounds are slightly pitch varied and attenuated with distance from the local
player; simultaneous area attacks are voice-limited to avoid clipping and clutter.
There is no promise of realistic recorded voice acting: the “uff” is synthesized.
An optional future update can replace the synthetic grunt with a CC0 sound sample.

## Event ownership and multiplayer safety

`WorldSoundTracker` observes authoritative simulation effects, projectiles and
enemy HP transitions. It remembers the IDs on the immediately preceding rendered
frame. Repeated network snapshots never trigger repeated sounds; beginning a
different world instance, rollback or room reconnect seeds the tracker quietly.
No new server packets, persistent save fields, game rules, attack cooldowns,
damage or colliders have been introduced. Players hear nearby co-op events at a
lower gain, not a separate echo on every packet.

## Settings

Music remains **off** by default; **Combat & item sounds** are **on** by default,
with an independent checkbox and a shared **Master volume** slider.
Settings are stored under the existing `panda-settings` key. Older saved
settings that lack `soundEffects` default to true; disabling effects does not
disable music or vice versa. Web Audio is unlocked during an actual user action
(entering game or using settings), subject to browser audio policy.

## Test instructions

```sh
cd ~/Projects/panda-ape-adventure
git fetch origin
git switch --track origin/feat/0.4.4-combat-loot-audio
docker compose up -d --build
```

Open http://localhost:8080. Choose Panda, swing with Space, defeat a slime
for a grunt, then walk over the dropped crystals/coins for the chime.
Switch to Ape for the magical attack cue. Open Settings to adjust or disable
SFX without changing music. Test two browser windows in the same co-op room.

**No third-party sound recordings are bundled.** Ninja Adventure's separately
downloaded CC0 sound files could be imported later as an optional art pass.
