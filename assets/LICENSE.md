# Art and audio provenance

## Original Panda & Ape artwork

The project's original procedural character, terrain, enemy, effect and synthesized-audio artwork (including sources in `apps/game/src/art.ts`, `apps/game/src/weapons.ts` and `apps/game/src/main.ts`) is dedicated to the public domain under CC0 1.0: https://creativecommons.org/publicdomain/zero/1.0/ . Source code remains licensed under the repository's MIT license.

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
