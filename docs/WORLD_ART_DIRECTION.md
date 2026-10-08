# Art Direction & World Cohesion Pass

Branch `feat/world-art-direction-pass`, based on the latest
`feat/world-visual-overhaul-1`. The visual direction is warm woodland adventure:
cool green ink, muted moss shadows, honey light, oak/copper accents and calm teal
water. Heroes and the bottom HUD retain their established designs.

## What changed

Trees now use two related original silhouettes, broadleaf and fir, with the same
trunk/root weight, stepped outer rim, leaf planes and upper-left lighting. Fir
selection follows the northern ridge and small groves rather than unrelated
per-tree species rolls. Size variation is restrained to 91–100% of the existing
canopy envelope. Internal circular seams and the previous mixture of three
canopy treatments were removed.

All four enemy roles use original 64×64 artwork: teal rounded slimes with readable
faces, russet wolves with cream muzzles and dark paws, softly shaded violet wisps,
and bark/stone guardians with the same moss as the forest. Enemy behaviour,
collision, spawn positions, damage and hurt feedback remain unchanged. Slime
compression and wisp movement are retained. Enemies use their existing single
frame texture contracts instead of the imported four-frame vendor loops.

The smithy has a taller copper roof, gable window, chimney masonry and stone
foundation. A quieter workshop apron connects existing clutter into a usable
work area. The forge silhouette grows upward within the reserved hub; NPC feet,
faces and labels stay clear. The chimney smoke source follows its new cap.

Five broad colour regions frame calm meadow openings and cooler outer groves.
Four additional small authored plant beds give the upper/eastern forest a rhythm
without adding solid obstacles. Existing undergrowth beds are less dense. Small
shrubs and asymmetrical ferns share the tree palette. The imported moss squares,
animated mushroom scatter, large repeated ground patches and most scattered
floor marks were removed; road grit and edge tufts were also reduced.

Shore banks have variable width, a narrower soil edge, darker moss transitions
and restrained vegetation. The authored water polygons and colliders are
unchanged. Shallows/deep water/reflections now have closer values and a shared
teal palette. Fewer reflection strokes leave the surface calm.

## Implementation and contracts

`world-style.ts` owns the original raster painters and shared palette;
`world-composition.ts` defines colour regions and hub clearance geometry.
`art.ts` still registers textures. Existing `forest`, `tree` (128×160) and all
four enemy keys (64×64, frame 0) remain stable; `tree-conifer` adds a second related
silhouette with the same frame size. The vendor registry and assets remain
available with their original contracts/licensing, but active trees/enemies use
the original painters. Browser observability counts actual world trees/enemies
rather than requiring active vendor sprites.

All new painting/composition work runs during asset creation. Existing bounded
ambience and its reduced-motion support are retained. `main.ts` gets smaller;
no new per-frame particle arrays, effects or layout calculations were added.
Phaser 4.2.1 installed CanvasTexture registration source was inspected.

Shared/server code, saves, networking, progression, combat, input, sounds, HUD
markup/CSS and authoritative layout are unchanged. New art provenance is in
[assets/LICENSE.md](../assets/LICENSE.md).

## Reviewed captures

Gameplay captures use Chromium against production nginx and wait for camera
settling. Sprite board uses the actual original painters through Vite. These
are review evidence rather than golden-image regression tests.

| View                               | Capture                                                        |
| ---------------------------------- | -------------------------------------------------------------- |
| Earlier camp                       | [Baseline](screenshots/art-direction/camp-before.png)          |
| Panda and smithy                   | [Camp](screenshots/art-direction/camp.png)                     |
| Ape visibility at camp             | [Ape](screenshots/art-direction/ape-camp.png)                  |
| Traversal and creatures            | [Forest](screenshots/art-direction/forest.png)                 |
| Integrated banks                   | [Lake](screenshots/art-direction/lake.png)                     |
| Cooler fir ridge and guardian      | [Ridge](screenshots/art-direction/ridge.png)                   |
| Related trees and four enemy roles | [Original sprite board](screenshots/art-direction/sprites.png) |

Executed checks and platform limits are recorded in
[VALIDATION.md](VALIDATION.md).
