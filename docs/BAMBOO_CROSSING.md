# Bamboo Crossing — First playable eastern region

**Branch:** `feat/0.6.0-bamboo-crossing`, based on `feat/world-art-direction-pass`.

The original Emerald Forest remains intact from x=0 through its ancient northeastern gate. The **same authoritative world** now extends east, from width 1920 to 2848. There is no teleportation, scene restart, map switch, added save field, network change, or new dependency.

## Where to find it

Walk northeast from Rowan and Bramble, follow the woodland trail past the Thorn Guardian and through the ancient gate. The trail becomes a golden bamboo path and leads to a winding north-south river. Cross the timber bridge (near x 2280, y 460) and continue to the **Mossbound Shrine** (near x 2640, y 432).

Panda and Ape discover a new region title in the top header and lower-left area label, with a one-time entry announcement. The shrine contains a **two-crystal pickup** on newly created adventures. Existing saves remain readable and all original forest quest logic is unchanged. The new region is deliberately an exploration area, **not yet a second questline or boss arena**.

## Content

- A hand-authored eastern trail that visibly connects through the ancient forest gate, across a genuine timber bridge and into a stone sanctuary.
- A continuous winding teal river with recessed moss banks, moving-looking water details, reeds and flowers. Exact authoritative water bands follow the rendered river. River collision deliberately leaves a bridge-width dry passage.
- New shaded bamboo clusters using original pixel art at the established 128×160 tree frame and Y depth sorting. Their physical footprints remain 34×34.
- A moss-covered shrine court, broken stone pillars, carved lintel and a luminous emerald altar, plus small stone and garden details.
- Subtly warmer green terrain, bamboo leaf litter, and a compact two-crystal exploration reward.
- The updated world map is shared by solo, companion and WebSocket co-op; enemy AI/damage/loot/save structures have not been changed.

## Safety

- The old forest, camp, NPCs, existing obstacle prefix, both original lakes, original quests, enemy positions and save schema stay unchanged.
- Shared authoritative `collides()` rejects crossing the river outside the bridge. No decorative-only invisible walls.
- The generated river collider collection is deterministic and reuses the existing obstacle representation.
- New display strings are client-only. Loading a saved character in the new region updates area labels correctly.
- The bridge deck has no new collider; the water bands resume immediately beyond it.
- All art is original procedural pixel art consistent with `world-style.ts`.

## Local testing

```sh
cd ~/Projects/panda-ape-adventure
git fetch origin
git switch --track origin/feat/0.6.0-bamboo-crossing
docker compose up -d --build --wait
```

Visit http://localhost:8080. On both Panda and Ape, cross the bridge, test its ends and the water banks, collect the shrine crystals, save, resume, then try a co-op room.

## Next level ideas (not part of this PR)

- A proper shrine interaction and a new quest giver.
- Unique eastern creatures and encounter mechanics.
- Ambient river sounds and a bridge waterfall.
- Navigation sign from the old forest gate.
