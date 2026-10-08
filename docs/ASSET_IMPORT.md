# Ninja Adventure + Sunnyside asset integration

This branch stages a **curated eleven-PNG import**, not the full downloadable packs. The importer runs on the owner's Mac and is intentionally separate from the Phaser runtime until the actual image layouts have been inspected.

## On the Mac

```sh
cd ~/Projects/panda-ape-adventure
git fetch origin
git switch --track origin/feat/0.4.0-asset-integration
bash scripts/import-art-packs.sh
git status --short
git add apps/game/public/assets/vendor
git commit -m "Import selected Ninja Adventure and Sunnyside PNG assets"
git push -u origin feat/0.4.0-asset-integration
```

If the local branch already exists, use `git switch feat/0.4.0-asset-integration` and `git pull --ff-only` instead.

## Included PNGs

| File in the playable public asset directory | Source | Candidate purpose |
| --- | --- | --- |
| `ninja/slime.png` | Ninja `Actor/Monster/Slime/Slime.png` | Forest slime animation |
| `ninja/spirit.png` | Ninja `Actor/Monster/Spirit/SpriteSheet.png` | Wisp / spirit animation |
| `ninja/beast.png` | Ninja `Actor/Monster/Beast/Beast.png` | Forest beast candidate |
| `ninja/bear.png` | Ninja `Actor/Monster/Bear/SpriteSheet.png` | Additional forest monster candidate |
| `ninja/panda-reference.png` | Ninja `Actor/Monster/Panda/SpriteSheet.png` | Preview/reference only; *not* automatically the main Panda hero |
| `sunnyside/world-16.png` | Sunnyside `Tileset/spr_tileset_sunnysideworld_16px.png` | Terrain and trails |
| `sunnyside/forest-32.png` | Sunnyside `Tileset/spr_tileset_sunnysideworld_forest_32px.png` | Forest environment |
| `sunnyside/tree-01-strip4.png` | Sunnyside `Elements/Plants/spr_deco_tree_01_strip4.png` | Swaying tree |
| `sunnyside/tree-02-strip4.png` | Sunnyside `Elements/Plants/spr_deco_tree_02_strip4.png` | Alternative tree |
| `sunnyside/mushroom-red-strip4.png` | Sunnyside `Elements/Plants/spr_deco_mushroom_red_01_strip4.png` | Ambient decoration |
| `sunnyside/mushroom-blue-strip4.png` | Sunnyside `Elements/Plants/spr_deco_mushroom_blue_01_strip4.png` | Ambient decoration |

## After the user pushes images

1. Inspect actual PNG pixel dimensions and frames; validate sprite sheet direction/layout. Don't guess the layout or hardcode indices before checking.
2. Implement safe Phaser asset preloads with fallback art, pixel-perfect nearest-neighbor sampling and appropriate screen-scale sizes.
3. Replace basic enemy/forest art incrementally while maintaining depth sorting, paths, collision geometry, hero/facing/weapon animations and multiplayer determinism.
4. Verify licensing and attribution against `assets/LICENSE.md`. Sunnyside is proprietary with specific allowed uses, **not** CC0.
5. Run format, lint, typecheck, unit, browser, production Docker smoke tests and GitHub CI.
6. Keep this PR stacked on the visible-weapons PR. Do not merge earlier PRs automatically.

The source ZIPs and third-party sample engine projects should never be copied wholesale into the repository.
