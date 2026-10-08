# v0.7.0 — Echoes of the Mossbound Shrine

This update turns the peaceful bamboo shrine into a short, complete, **server-authoritative** adventure. The old Rowan/Thorn Guardian quest remains unchanged.

## How to play

Follow the path through the Ancient Gate, cross the timber bridge, and reach the Mossbound Shrine on the eastern bank.

1. **The sleeping emerald** — Walk close to the altar (x2640, y432) and press **E**. A soft chime and emerald rune-ring show the shrine awakening.
2. **Echoes in the bamboo** — A distinctive, jade-antlered ranged spirit called the **Jade Warden** appears southeast of the shrine (x2590, y646). Defeat it as Panda or Ape. Its glowing green sprite uses the existing wisp combat archetype, with a stronger 210 HP; the original forest enemies and respawn rates are not changed.
3. **The grove remembers** — Return to the altar and press **E** to claim the **Grove Blessing**.
4. **Blessing of the grove** — The shrine settles into a gentle emerald glow. Every hero already in the room receives **2 permanent spendable attribute points, 2 ancient materials, 8 crystals, and 100 XP**. You can distribute the points via the current character/progression UI. The world stage is saved and prevents repeated rewards.

The quest display switches to the shrine steps **only while in the bamboo region**; returning to Emerald Forest reveals the unchanged Rowan quest. The interaction hint shows E at the altar.

## Technical notes

- New optional world field `shrine` (`dormant | hunting | return | blessed`), preserved in saves and propagated through ordinary co-op world snapshots. Existing saves without this field automatically upgrade to `dormant` during migration; old worlds also gain the dormant Warden as needed.
- Stable ID `shrine-warden`, using the existing wisp ranged combat class, with a **unique original pixel-art sprite**. It does not respawn and has no random drops or phantom boss-reset interactions.
- Unique quest reward has a persistent world state and a **permanent per-character receipt** (`milestone:grove-blessing:v1`), so holding E, reconnecting, revisiting the altar or starting another adventure cannot repeatedly grant points.
- Players already in a shared room receive the reward when it is claimed. Later joiners do not retroactively receive a prior world quest reward.
- All interactions, health, damage, reward allocation and status changes run in the authoritative `step()`; the client draws only informational UI, glow, runes, particles and an event-derived short 3-tone magic chime.
- Reduced-motion support freezes rune orbit/particles. No external audio files or assets, additional deps, network packet types or new controls required.
- The original two-crystal shrine pickup remains for exploration.

## Test instructions

```sh
cd ~/Projects/panda-ape-adventure
git fetch origin
git switch --track origin/feat/0.7.0-mossbound-shrine-quest
docker compose up -d --build --wait
```

Open http://localhost:8080, visit the shrine, press **E**, fight the Jade Warden, and return for the blessing. Test a reloaded saved game and a room with two players; the bonus should never duplicate. You can also inspect the new browser screenshots at `test-results/shrine-warden-awakens.png` and `test-results/shrine-grove-blessing.png` after the browser suite.

## Known limits

- The Jade Warden uses a visually unique wisp-derived projectile AI rather than an entirely new boss mechanics system. Introducing multi-phase encounters can be a subsequent milestone.
- Shrine quest progress is shared by the room. It is not a separate individual questline for each party member.
