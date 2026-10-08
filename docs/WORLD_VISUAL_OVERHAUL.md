# World Visual Overhaul 1.0

Original Emerald Forest presentation on `feat/world-visual-overhaul-1`, based on
`feat/ape-mage-casting-polish`. The authored shared map, collider positions,
spawns, room protocol and simulation are unchanged.

## World treatment

- Six coherent meadow tones cross former tile boundaries, with sparse grass,
  leaf/pebble accents, and a small amount of existing imported moss.
- The footpath retains its original route. Its width varies along the curve;
  softer earth/moss banks, edge grass, grit, broken wheel tracks and a rounded
  western end connect it to the irregular camp clearing.
- The original lake polygons remain the authority for visible water and
  collision. Teal shallows, deeper blue water, broken sky reflections, clipped
  lily gardens, reeds and low-opacity moving highlights enrich the banks.
- Eight authored undergrowth beds frame the road, banks and open forest.
  Ferns, small shrubs and pale flowers stay outside the trail and protected
  landmarks. Three tree silhouettes combine the two licensed vendor trees
  with a new original broadleaf canopy; deterministic tint, mirror and size
  variation stay inside the previous conservative canopy envelope.
- Bramble's workshop gains ivy, brass trim, tools, barrels, a crate and broken
  flagstones. Rowan's side has an herb planter; a short boundary fence,
  direction sign, blanket, cup and warm hearth/lantern pools finish the hub.
  NPC silhouettes and interaction feet stay clear.
- Sixty-four tiny motes are spread over the whole map, with six chimney puffs
  and eighteen water highlights. Reduced-motion preference freezes ambience,
  plant frames and tree sway. No emitter accumulates objects over time.

## Engineering and art contract

`art.ts` still registers all generated raster assets. `environment-art.ts`
paints the static world once; `world-atmosphere.ts` owns scene effects and
precomputes reflection spans. Its draw loop reuses two Graphics objects and
fixed particle data, with no polygon scans or per-frame particle allocation.
The texture keys, hero frames, 128×160 fallback tree and world backdrop sizes
are stable. Phaser 4.2.1 installed `TextureManager.addCanvas` source and
CanvasTexture declarations were inspected before retaining this pipeline.

New original artwork is CC0-1.0 and source is MIT. Existing vendor licenses
remain separate; see [asset provenance](../assets/LICENSE.md).

## Review captures

These are gameplay captures, not golden image comparisons. The baseline was
captured during initial camera settling; final captures wait for the camera.

| Scene                | Capture                                                 |
| -------------------- | ------------------------------------------------------- |
| Earlier camp         | [Baseline](screenshots/world-overhaul/camp-before.png)  |
| Workshop and camp    | [Overhaul](screenshots/world-overhaul/camp-after.png)   |
| Main lake and lilies | [Lake](screenshots/world-overhaul/lake.png)             |
| Quiet southern pond  | [Pond](screenshots/world-overhaul/pond.png)             |
| Forest sightlines    | [Wide view](screenshots/world-overhaul/forest-wide.png) |
| Northern clearing    | [Gate](screenshots/world-overhaul/gate.png)             |

Validation results and platform limits are recorded in
[VALIDATION.md](VALIDATION.md). Gameplay captures include the existing HUD,
heroes and combat; environmental decoration adds no new authoritative blockers.
