#!/usr/bin/env bash
# Curated art importer for Panda & Ape: The Adventure.
# The original archives remain unchanged in ~/Downloads.
set -euo pipefail

project_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ninja="$HOME/Downloads/panda-ape-assets/ninja-adventure/Ninja Adventure - Asset Pack"
sunny="$HOME/Downloads/panda-ape-assets/sunnyside/Sunnyside_World_ASSET_PACK_V2.1/Sunnyside_World_Assets"
destination="$project_root/apps/game/public/assets/vendor"

if [[ ! -d "$ninja" ]]; then
  printf 'Missing Ninja Adventure pack: %s\n' "$ninja" >&2
  exit 1
fi
if [[ ! -d "$sunny" ]]; then
  printf 'Missing Sunnyside World pack: %s\n' "$sunny" >&2
  exit 1
fi

# Verify every original exists before copying anything.
entries=(
  "ninja|Actor/Monster/Slime/Slime.png|slime.png"
  "ninja|Actor/Monster/Spirit/SpriteSheet.png|spirit.png"
  "ninja|Actor/Monster/Beast/Beast.png|beast.png"
  "ninja|Actor/Monster/Bear/SpriteSheet.png|bear.png"
  "ninja|Actor/Monster/Panda/SpriteSheet.png|panda-reference.png"
  "sunnyside|Tileset/spr_tileset_sunnysideworld_16px.png|world-16.png"
  "sunnyside|Tileset/spr_tileset_sunnysideworld_forest_32px.png|forest-32.png"
  "sunnyside|Elements/Plants/spr_deco_tree_01_strip4.png|tree-01-strip4.png"
  "sunnyside|Elements/Plants/spr_deco_tree_02_strip4.png|tree-02-strip4.png"
  "sunnyside|Elements/Plants/spr_deco_mushroom_red_01_strip4.png|mushroom-red-strip4.png"
  "sunnyside|Elements/Plants/spr_deco_mushroom_blue_01_strip4.png|mushroom-blue-strip4.png"
)
for entry in "${entries[@]}"; do
  IFS='|' read -r vendor path filename <<< "$entry"
  if [[ "$vendor" == "ninja" ]]; then
    source="$ninja/$path"
  else
    source="$sunny/$path"
  fi
  if [[ ! -f "$source" ]]; then
    printf 'Missing image: %s\n' "$source" >&2
    exit 1
  fi
done

for entry in "${entries[@]}"; do
  IFS='|' read -r vendor path filename <<< "$entry"
  if [[ "$vendor" == "ninja" ]]; then
    source="$ninja/$path"
  else
    source="$sunny/$path"
  fi
  mkdir -p "$destination/$vendor"
  cp "$source" "$destination/$vendor/$filename"
  printf 'Imported: %s/%s\n' "$vendor" "$filename"
done

printf '\nImport complete: %s curated PNG files.\n' "${#entries[@]}"
printf 'Review PNG dimensions and selected art before Phaser atlas/frame integration.\n'
printf 'Use git status --short, then commit and push the vendor PNG files.\n'
