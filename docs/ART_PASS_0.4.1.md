# Environment and hero art pass

Version 0.4.1 is a visual upgrade to the existing Emerald Forest rather than a world/simulation rewrite.

## What changed

- A deterministic, higher-contrast 32-pixel terrain grid with much less randomly scattered checkerboarding.
- The established camp-to-guardian trail now has soft grass banks, dirt shoulders, worn tracks and pebbles instead of a wide flat beige stroke.
- The two lakes have layered jagged banks, shoreline vegetation, reflective ripples and flowers. They **still contain** the authoritative rectangular collision areas.
- The camp now includes a timber-and-tile smithy, visible forge embers, an anvil, wood piles, a warm lantern and a furnished camp.
- Panda and Ape are now drawn at 64×64 native pixel-art resolution: Panda has round black ears, dark eye patches, cream fur and leather gear; Ape has chestnut fur, a large muzzle, expressive eyes, swept hair and a curled tail. Both have red adventurer scarves, boots, pouches and contrasting clothing.
- Existing 8-way facings, four-frame walks and separate animated weapons are preserved, with the procedural hero atlas still supporting external sprite-sheet overrides.
- The original Ninja Adventure enemy sprites and Sunnyside World tree and flower sprite loops remain enabled. A tiny amount of Sunnyside atlas moss texture is blended into the terrain when the art pack is available.

## Constraints

The two user-supplied full-size images are **concept illustrations**, not ready-made game animation sheets; these are handmade pixel-art reinterpretations, not automatic 1:1 reproductions. The external character sprite import pipeline remains for future authored frame sheets.

All changes are cosmetic. No authoritative obstacle bounds, networking messages, combat rules, save schemas or AI behaviors are modified. The forge and camp building are scenic props (not new collision objects), consistent with the prior camp.

The new background is fully local/offline and deterministic given the checked-in assets. The 16×16 Sunnyside atlas remains separate under its own license; the procedural character art is original.

## Local verification

```sh
git switch feat/0.4.1-environment-heroes
git pull --ff-only
docker compose up -d --build
```

Compare the new forest with the prior screenshot at http://localhost:8080; play Panda and Ape, move in all directions, attack, walk around the lake edges and visit the forge.
