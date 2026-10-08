# Replaceable Panda and Ape sprite sheets

Rendering assets remain owned by `apps/game/src/art.ts`. `assets/hero-sheets.json` registers finished local PNG sheets and their provenance/license; null sources use the existing procedural generator. Texture keys `panda` and `ape` and their original first 32 frames remain stable.

| Contract        | Value                                                                |
| --------------- | -------------------------------------------------------------------- |
| Frame           | 64 × 64 pixels, transparent background                               |
| Columns         | 4 animation frames per direction                                     |
| Direction rows  | east, southeast, south, southwest, west, northwest, north, northeast |
| One state block | 256 × 512 pixels (32 frames)                                         |
| Origin          | frame center, feet near y=56; keep common alignment                  |
| States          | walk first; optional idle, attack, special, guard, hit, downed       |
| State frame     | `stateBlock × 32 + direction × 4 + animationFrame`                   |

State blocks are stacked vertically in the order registered. The first block **must be walk** so frames 0–31 retain their original meaning. Idle and downed use the first frame; other states cycle four frames every 130 ms. Unprovided states fall back to walk; idle/downed then use its first frame. Existing attack effects, tint and shield remain compatible. A failed external load also retains the procedural fallback. Directions follow the renderer's atan2 mapping, clockwise from east. Dedicated poses improve appearance without changing collision radius or authoritative combat timings.

Import a completed sheet from within this repository:

```sh
npm run sprites:import -- panda assets/references/panda-sheet.png walk,idle,attack,special,guard,hit,downed CC0-1.0 "Artist and original reference details"
```

The command validates the PNG signature, 256-pixel width, height `512 × stateCount`, unique supported states and required provenance/license arguments. It copies the sheet to `apps/game/public/sprites/panda.png` and updates the registry. Use `ape` for the second hero. A walk-only 256×512 sheet also works. Vite and nginx serve these local files; no runtime CDN or network provider is used. Phaser 4.2.1 registers the drawn canvas through `addCanvas` / CanvasTexture and `addSpriteSheet`, as confirmed against the installed sources and declarations.

After import, run typecheck, lint, format check, build and browser tests. Inspect walk direction, origin/feet, attack/cast/guard/hit/downed states and transparency at runtime. Commit the PNG and registry together; add any attribution obligations to `assets/LICENSE.md`. Procedural and externally supplied licenses must remain distinct: the importer never assumes that user references or resulting art are CC0.

The owner's Panda and Ape reference images may arrive later. Keep references under `assets/references/` when supplied, document authorship and permitted use, then derive sprite sheets matching this contract. A reference portrait is a source for creating sprites, not an animation sheet that can be imported directly. No absent reference images or art-generation claims are part of this release.
