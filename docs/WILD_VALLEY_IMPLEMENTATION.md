# Wild Valley — first playable slice

## Repository assessment

The existing npm workspaces contain a Phaser 4.2.1/Vite client, a Node/ws server
and a pure TypeScript shared simulation. Static collision/forest footprints,
authoritative two-hero rooms, character progression, SQLite snapshots, reconnect
credentials, a JSON compatibility store, browser saves, procedural art, HUD,
audio and Playwright/Vitest coverage are reused. The expanded Bamboo Crossing
and mossbound shrine remain in the same world. No dependency or lockfile change.

The largest extension risks were the shared entrypoint and client scene's size,
shape-based legacy save validation, short-lived combat rooms, and client movement
prediction. New rules and presentation live in dedicated valley modules. Both
prediction paths now use the same placed-building collision as the server.

## Playing

Start solo or create/join the existing online room. Rowan is the trader at camp.
Press **T** nearby and buy the shared watering can for 6 gold. Press **F** for
Wild Valley tools, supplies and the market. The farm is directly south of camp:
32 tiles at world (400, 1220), in an 8 × 4 grid.

Walk near a tile, select **hoe**, click soil, select **plant** and a seed, then
**water**. A game day lasts 45 simulation seconds. Only watered crops advance;
each growth day consumes their water. Carrots need 1 day, potatoes 2, tomatoes 3,
strawberries 4. Re-water on subsequent days. Mature crops remain safe until
harvest. Dry crops never die. Harvest adds a stack to shared supplies and leaves
prepared soil. Return to Rowan to sell one item per click or purchase seeds.

Each room starts with 18 gold and two seeds of each crop. Buy/sell prices are
in the shared product definitions. Local caches provide four wood, stone, fibre
or ore once per game day. Gather through the proximity-enabled buttons, or click
a cache with a farming tool active. A workbench costs 12 gold, 6 wood and 2 stone.
Two wood collections and one stone collection suffice. Panda waters the next
plot to the right in the same row; Ape saves one wood per building. Both heroes
can play the entire loop alone.

Select **build**, choose furniture and hover a tile. The transparent object and
green/red tile show reach, occupancy, static geometry, heroes and affordability.
Click to place. Remove furniture with **Remove furniture**; no material refund
prevents discounted rebuild exploits. Solid furniture blocks shared movement and
prediction. Workbench, chest, fence, border, shelter and lantern use data-driven
recipes. **Combat** or **Esc** returns left-click control to combat. WASD, attack,
special, inventory, NPC interaction, pause and audio settings keep their existing
roles. The existing combat inventory is independent of the shared farm supplies.

## Authority, persistence and assets

`packages/shared/src/valley.ts` owns data, bounds, intent parsing, explicit plot
states, growth, trade, gathering, recipes and placement. Every action is validated
and applied synchronously once before server persistence awaits. RPG and valley
actions share the player's monotonic command sequence. Clients cannot submit
positions, yields, money, crop age or raw item grants. Existing payload/rate/room
limits also cover the new messages.

The settlement has its own schema version 1 inside the world. Solo envelopes
advance to version 3; existing version 2 and versionless worlds migrate with a
fresh settlement only if that field is absent. Present malformed settlements
are rejected, including duplicate cells and invalid stacks. Full room snapshots
retain supplies, gold, water, growth, day, buildings and resource collection days.
SQLite still serializes writes and commits atomically. JSON still serializes
writes and replaces files atomically.

Established settlements persist after empty room and reconnect-seat expiry.
After the 60-second reservation ends, use the existing character credential to
create/reopen the home room. During the reservation use the normal reconnect.
A server restart restores recent sessions; older settlements retain their world
but release stale seats. Days pause when nobody is connected. No offline growth
or wall-clock penalties. Shared balances belong to the settlement, not to a
portable character; entering another room does not transfer farm supplies.

`apps/game/src/valley-view.ts` handles input and presentation. World sprites are
rebuilt only when plot/building state changes; the menu updates only when its
state/proximity changes. Growth scans the bounded 32-cell farm only at day
boundaries. No per-plant timers, frame polling, network messages or listeners.
Original crop/soil/furniture/cache/can painters use the existing palette, integer
pixel shapes and stable `valley-*` keys registered through `art.ts`. Crop sheets
have three 32 × 32 frames; furniture is 32 × 48. Installed Phaser 4 declarations
and TextureManager sources were inspected: canvas sheets register CanvasTexture
first, then `addSpriteSheet`. Art provenance is in `assets/LICENSE.md`.

## Deliberate limits and next steps

This slice has a bounded farm, shared stacks with icons and tool buttons, and
fixed recipes. Chest and workbench are placed furniture; dedicated chest storage,
workbench processing, tool crafting, rotation, drag-and-drop, watering animation,
seasons, automation, rain and expansion unlocks are future work. The watering
can is bought rather than crafted. The initial three crop sprite frames are
stage changes rather than animated growth transitions. Prices and the short day
length are prototype balance requiring longer playtests.

Persistent settlements count toward the existing 100-room server capacity;
there is no archival/deletion UI yet. A character can visit multiple farms, but
home lookup chooses the first owned loaded room. Production-scale archival and
explicit home selection should precede public multi-settlement hosting. Empty
settlements keep memory but do not advance simulation. The mobile menu scrolls;
touch farming/gamepad tool selection and cross-browser testing remain follow-up.

Next: functional workbench processing and tool upgrades; explicit settlement
selection/archival; rain and irrigation with new exploration rewards. Validation
commands, screenshots and actual environmental limits are recorded in
[VALIDATION.md](VALIDATION.md).
