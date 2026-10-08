# Bamboo Crossing — Art Direction Polish (v0.6.1)

The second area has been refined specifically against the in-game wide screenshot. The previous design read like repeated poles, a straight canal, a wooden crate and a plain circular shrine, with a visible hard line between biomes.

## Revised visual language

- **Gate and forest seam:** a wide, dithered eastward grass-color blend makes both biomes share one surface. The old trail is continued through the Ancient Gate. The stone gate is painted over the road so the path visibly travels beneath it.
- **Bamboo:** three original 128×160 sprite variants (young, tall and leafy) with stepped diagonal leaves, shaded green stems and low, weighted silhouettes. Deterministic selection reuses the same pre-existing obstacle footprints and Y-sort.
- **River:** broad meanders and gently varying width rather than repeated small side-to-side oscillation. River polygons and server-authoritative collider bands sample the _same_ `bambooRiverSpan()`. The original safe, dry bridge band at y418–508 remains.
- **Bridge:** lighter wood, visible gaps between individual planks, slim rails, shorter posts and a clear entry from both banks, in place of a flat solid chest-like silhouette.
- **Mossbound Shrine:** more distinctive stone court, weathered flagstones, uneven old masonry, overgrown capitals, teal crystal, herb/flower accents and two small approach lanterns. No new physical blockers.
- **Riverbanks:** carefully limited stone clusters, small reeds, and lily pads positioned with the actual shared bank positions. The river remains the sole navigational obstruction around the bridge.

## Gameplay and performance

All changes other than the river bank coordinates are _purely visual_. No attacks, quests, game progression, save formats, multiplayer messages, water hitboxes away from the river, or creature AI are altered. The new river collider bands are still based on deterministic 8px vertical strips. Graphics are drawn to static backing textures once on scene creation; no per-frame dense re-rendering or new downloads.

Tests assert the visually meaningful width variation, bridge access, an unchanged shrine reward, the monotone palette transition and all three grove textures, in addition to original crossing/obstacle smoke tests.

## Try locally

```bash
cd ~/Projects/panda-ape-adventure
git fetch origin
git switch --track origin/feat/0.6.1-bamboo-crossing-polish
docker compose up -d --build --wait
```

Open http://localhost:8080, walk east through the gate, follow the approach and cross the bridge. Compare a wide view across the seam and a tighter bridge/shrine view with the previous screenshot.

## Remaining limits

The shrine remains a non-interactive scenic landmark with a crystal pickup; a narrative shrine quest is separate work. The 2D art is procedural pixel art, not the 3D rendering used in modern remakes. Browser screenshot CI exercises Chromium; mobile touch controls remain a separate feature.
