# Art and audio provenance

## Original Panda & Ape artwork

The project's original procedural character, terrain, enemy, effect and synthesized-audio artwork (including sources in `apps/game/src/art.ts`, `apps/game/src/weapons.ts` and `apps/game/src/main.ts`) is dedicated to the public domain under CC0 1.0: https://creativecommons.org/publicdomain/zero/1.0/ . Source code remains licensed under the repository's MIT license.

The Emerald Forest cleanup's Panda facial redraw, authored lake outlines/banks,
and camp hearth/prop arrangement are original procedural artwork created directly
in `apps/game/src/hero-design.ts`, `apps/game/src/environment-art.ts` and
`packages/shared/src/forest-layout.ts`, rendered through `art.ts`. These additions
also use CC0-1.0; no new external images or reference assets were used. Sunnyside
tree images remain under their separate license below; the cleanup uses their
existing first frame with a subtle rotation rather than the canopy frame loop.

## Ninja Adventure - Asset Pack

Source: https://pixel-boy.itch.io/ninja-adventure-asset-pack
Creators: Pixel-Boy and AAA.
License: CC0 1.0 as stated on the pack's official itch.io page. Attribution is not required but appreciated.
Selected files are imported verbatim from `Ninja Adventure - Asset Pack.zip` into `apps/game/public/assets/vendor/ninja/` via `scripts/import-art-packs.sh`. They are third-party art, not original Panda & Ape artwork.

## Sunnyside World Asset Pack V2.1

Source: https://danieldiggle.itch.io/sunnyside
Creator: Daniel Diggle.
License: the official itch.io page's **NEW LICENCE: V1**. Free and commercial game use and modification are allowed; creator credit is appreciated, not mandatory. Repackaging and selling the pack is forbidden, and the assets must not be used for AI training. The tutorial/educational redistribution permission requires a link to the itch.io page.
Selected PNGs from `Sunnyside_World_ASSET_PACK_V2.1.zip` are imported into `apps/game/public/assets/vendor/sunnyside/` by the same script.

**Sunnyside is not CC0.** Do not rededicate it as CC0 or relicense its standalone files. Keep vendor images separate from the project's original CC0 graphics, and do not publish standalone asset bundles. The game should only include the selected assets required by its playable scenes.

## Import rules

- Keep only specifically selected vendor art in the repository, never entire downloaded ZIPs, Godot/GameMaker projects, PSDs, Aseprite originals or metadata cruft.
- Asset selection is a staging step: exact texture framing, animation rows, autotile indices, collision alignment and aesthetics need inspection before the graphics are used at runtime.
- The third-party assets are not to be used for generative-AI training. Do not infer permission for other third-party reference art.
- Retain a working procedural fallback while converting existing world scenes and enemies; avoid altering server-authoritative collision and RPG logic.
- System fonts and dependencies keep their respective licenses.
- No Secret of Mana artwork, characters, maps, music or assets are reproduced.

## Original character and combat polish

The Rowan guide and Bramble smith designs, hero facial refinements and rendering
of attack crescents/impact sparks are original procedural artwork created in
`apps/game/src/hero-design.ts`, `apps/game/src/weapons.ts` and
`apps/game/src/main.ts`, with textures generated through `art.ts`. They use
CC0-1.0, as above. No external images, new reference assets or generated bitmap
assets were introduced. Source code remains under the repository MIT license.

## Premium combat and HUD

The woodland HUD framing, portrait crops from the existing hero generator,
blade-tip trails and staff particles are original code-generated presentation
in `apps/game/src/style.css`, `main.ts`, `weapons.ts` and `weapon-trails.ts`.
Artwork uses CC0-1.0 and code uses MIT. No external reference artwork, textures,
sounds or runtime downloads were added. Existing vendor licenses are unchanged.

## Ape mage casting polish

The restrained staff poses, mint/teal/blue tip glow, drifting motes, release rings
and bolt wakes in `apps/game/src/mage-pose.ts` and `mage-effects.ts` are original
procedural presentation. Artwork uses CC0-1.0; source code uses MIT. Existing
staff/character textures and their provenance are retained. No external artwork,
generated bitmap assets, sounds or textures were added.

## World Visual Overhaul 1.0

The meadow colour fields, worn trail edges, broadleaf fallback canopy, fern and
shrub beds, flowers, lilies, reflected sky, smithy ivy, tools, barrels, crates,
herb planter, fence, sign, blanket and ambient pollen/smoke are original
code-generated artwork in `apps/game/src/art.ts`, `environment-art.ts` and
`world-atmosphere.ts`. Artwork uses CC0-1.0; source code uses MIT. Texture
registration remains in `art.ts`, including the existing `forest` and 128×160
`tree` contracts. No new external art, bitmap generation, reference images or
runtime downloads were used. The existing Sunnyside trees and moss samples
retain their separate license above; tinting, mirroring and scale variation do
not change their provenance.

## Art Direction & World Cohesion Pass

The related broadleaf/fir trees, teal slime, russet woodland wolf, violet wisp,
bark-and-stone guardian, shared woodland palette, revised ferns/shrubs, regional
terrain colour fields, narrowed organic banks and copper-roofed smithy are
original code-generated artwork in `apps/game/src/world-style.ts`,
`world-composition.ts` and `environment-art.ts`, registered through `art.ts`.
Artwork uses CC0-1.0 and code uses MIT. No external reference images or bitmap
assets were introduced. These active trees/enemies are original artwork and are
not edits or traced versions of vendor sprites. Retained vendor files and their
registry keep their separate licenses; removing their use from active scenery
and enemies does not relicense them. The former imported ground samples and
animated mushroom scatter are no longer used by the active world renderer.
