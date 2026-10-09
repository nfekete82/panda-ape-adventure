# The Mossbound Secret — shrine gameplay v0.6.2

Walk east from Emerald Forest, cross the Bamboo Crossing bridge and approach the emerald altar at the Mossbound Shrine.

## Playable quest

1. Press **E** at the shrine crystal (within 106 world pixels) to awaken the altar. The quest journal switches to **The mossbound secret** while you are in Bamboo Crossing.
2. Hunt the **Guardian Spirit**, a luminous teal wisp in the southern bamboo grove near x=2540, y=610. It uses the existing authoritative wisp combat and existing attack/damage logic, with a distinct teal halo. The fight is available to Panda and Ape.
3. Return to the shrine and press **E** again to receive **1 ancient relic, 6 crystals and 75 XP**. The ancient relic can be spent on a later weapon upgrade.
4. Revisiting the shrine never gives duplicate rewards. Both co-op heroes can complete and claim the quest once independently.

The emerald altar now emits restrained teal rings and orbiting particles while approached, respecting reduced-motion preferences. The guardian spirit also has gentle particles, with no new external sound files. Existing magical effects play on activating/restoring the shrine.

## Persistence, multiplayer and balance

The quest uses the existing player `receipts` strings (`shrine:awakened`, `shrine:sentinel`, `shrine:rewarded`) namespaced by `world.instanceId`. No new save fields, packets, or player action schema are required. Authoritative `step()` handles interaction and `damageEnemy()` tracks victory. The added sentinel uses the established wisp creature type, not a new enemy AI implementation. Wisp world maximum increases from 3 to 4 to accommodate the existing forest wisps plus the new spirit. Old forest quests, Guardian boss, combat rules, HUD, audio settings, pickups, and navigation remain unchanged.

**Current limitation:** The spirit is a distinct encounter with the existing wisp mechanics, not a new boss with bespoke AI, and the altar animation is drawn as restrained 2D effects rather than a fully custom sprite sheet.

## Run locally

```sh
cd ~/Projects/panda-ape-adventure
git fetch origin
git switch --track origin/feat/0.6.2-mossbound-shrine-quest
docker compose up -d --build --wait
```

Open http://localhost:8080. Try the quest with Panda and Ape, save/reload between stages, and claim it in co-op. The shrine should always show an **E** interaction hint within range.
