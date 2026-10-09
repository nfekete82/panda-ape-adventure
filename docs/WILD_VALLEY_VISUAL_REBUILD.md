# Wild Valley focused visual rebuild

2026-10-09 · `feat/wild-valley-visual-overhaul`

The farmhouse, garden and companions now share warm timber, cream highlights,
muted workwear and crisp pixel clusters. This is a rendering change; shared
simulation, farm coordinates, collision, network protocol and save schema are
unchanged.

- **Cottage:** one 96×92 composite replaces the overlapping procedural smithy
  and tall source house. The existing Jofra timber facade sits beneath a lower
  terracotta gable, with shuttered windows, small planters, foundation shadow and
  porch steps. Integer 2× scaling retains crisp source pixels and the original
  `(323, 974)` anchor. Existing outdoor forge equipment and entry stones remain.
- **Garden:** four 4×2 raised beds replace the continuous dirt rectangle. The
  same 32 cell centres remain clickable. Transparent four-pixel soil margins
  leave an eight-pixel cross path visible even at full planting capacity.
  Untilled earth, hoed furrows and darker watered soil remain distinct. The
  retained three crop stages still show sprouts, growing plants and ripe crops.
  Open fencing, stepping stones, markers, a seed crate, sack and selected native
  Mini Farm accents stay outside interactive cells. Review moved the east-apron
  barrel and flowers clear of the fibre/ore resource artwork. Decorations add
  no collision.
- **Companions:** Panda and Ape use original 32-pixel drawings doubled into the
  existing 64×64 frames. Panda retains cream fur, dark ears and eye patches; Ape
  retains warm brown fur, large ears and a swept tuft. Sage and blue workwear,
  rolled cuffs, small neckerchiefs, readable pockets and grounded boots replace
  the dense adventurer equipment. Walking keeps four frames, eight directions,
  one-pixel bobbing and opposite arm swing. Detached gameplay weapons and all
  collision dimensions remain intact. Hoe actions now show a small hoe blade.
- **Integration:** textures are registered in `art.ts` using Phaser 4.2.1's
  CanvasTexture path. No dependencies, runtime downloads, generic human sprites
  or copied screenshots were added. Existing weather, HUD, crops and water stay
  active. Strict indexed-array diagnostics in the existing click-path helper
  were resolved with bounded fallback values; its routing algorithm is unchanged.
  Review confirmed that the former click probe stalled on a clamped camera
  threshold; persistent browser tests now use its actual midpoint.

[In-game composition](screenshots/wild-valley-overhaul/garden-and-companions.png)
shows untilled, dry, wet, seedling and ripe cells, both heroes and the cottage in
rain. [Native artwork review](screenshots/wild-valley-overhaul/art-sheet.png)
shows the cottage, both soil states and all eight facing rows for both heroes.
The artwork review draws the actual generators in Chromium; it is not a gameplay
screenshot. Licenses and source rectangles are recorded in `assets/LICENSE.md`.

The original uploaded archive is not in this repository; the rebuild uses its
already embedded source extracts. Rendering and art have been reviewed in desktop
Chromium. The eight-pixel seams are decorative paths, not additional gameplay
cells. Farming action effects retain the existing optimistic client-side flourish;
authoritative action acceptance is unchanged. Coverage now checks both heroes’ click-to-move, all 32 farm cells, solid furniture
routing, and legacy/version-3 save round trips. Exact HEAD comparisons and remaining
regression-suite limitations are recorded in `VALIDATION.md`.
