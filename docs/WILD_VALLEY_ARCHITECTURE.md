# Wild Valley architecture

The existing Phaser 4.2.1/Vite client, pure shared simulation, authoritative ws
rooms and serialized SQLite SaveStore remain the foundation. Existing forest,
bamboo crossing, shrine quest, combat and RPG progression remain playable.

The main extension risks are the monolithic shared entrypoint/client scene,
shape-based save validation, transient room lifetime, and movement prediction.
New systems therefore live in dedicated shared/client modules. No dependency or
engine replacement is planned.

`shared/valley.ts` owns versioned settlement state, crop/recipe/product data,
bounded action parsing, atomic resource transactions and deterministic day
transitions. The room owns shared stacks/gold, plots, placed furniture, resource
nodes and a cultivation clock. Existing player command sequencing gates actions;
clients send intent, never growth, gold, yields or placement authority.

Growth is evaluated once per day, never polled per plant per frame. Water is
consumed by a growth day; dry plants simply wait. No offline withering or forced
sleep. Rendering uses original generated assets registered in art.ts; a separate
presentation/controller module owns farming menus and the placement preview.

Legacy saves receive a fresh settlement only when the field is absent. Present
but malformed settlement state is rejected. SQLite still commits entire room
snapshots atomically; established settlements survive empty-room expiry and
restart. Character credentials can reopen their established home after the
60-second seat reservation expires. Unestablished combat rooms retain existing
expiry behaviour. No offline time advancement.

The initial scope is the connected farming/trading/building loop. Seasons,
automation, processing chains, large buildings and drag-and-drop inventory are
later extensions; existing character inventory and combat controls stay intact.
