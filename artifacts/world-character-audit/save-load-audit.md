# Save/load audit

## What is persisted

**Classic save** (`localStorage['tp_save']`, written by `saveGame()`, `js/engine.js:153-174`):
```
{ mapId, tx, ty, dir, clues, flags }
```
Quoting `js/engine.js:156-159`:
```
var snapshot = {
  mapId: S.mapId, tx: S.player.tx, ty: S.player.ty, dir: S.player.dir,
  clues: S.clues, flags: S.flags
};
```
That's it: **map id, player tile position/facing, the clue list, and the classic flags dict.** No NPC list, no NPC positions, no wander offsets/state — `S.npcs` is never part of the snapshot.

**Narrative save** (`localStorage['twin-peaks:narrative:<package>:slot:<id>']`, `js/narrative-save.js:114-155`): the full serialized narrative runtime state (`NR().serialize(A.getState())`, `js/narrative-save.js:131`) plus an envelope (format/schema/package/slot/generation/classic-fingerprint/mission, `:122-132`). This is where flags/values/nodes_done/evidence for the narrative layer (M4-M9) live — none of it is NPC position data either; the adapter's `NARRATIVE_ENTITIES` table itself is static code, not saved state.

**Conclusion: neither save persists NPC positions.** Population (which NPCs appear where) is **entirely recomputed** on every map load from the two static registries (`js/glue.js` NPCS + `js/narrative-engine-adapter.js` NARRATIVE_ENTITIES), driven by the persisted flags/values/nodes_done/evidence.

## What is recomputed on load, and when

- **Classic NPC list**: `loadMap(id, tx, ty, dir)` (`js/engine.js:107-122`) unconditionally rebuilds `S.npcs` from `S.map.npcs` (i.e. `GAME.Maps[id].npcs`, a global shared array) every time a map is loaded — `js/engine.js:113-122`. A classic NPC's `cond` (`js/glue.js`) is evaluated lazily, per-frame, against **live** `S.flags` via `E.npcActive`/`E.checkCond` (`js/engine.js:337-345`, `:558-580`) — not baked in at load time. So classic NPC visibility tracks `S.flags` continuously, not just at load.
- **Adapter (narrative) entities**: mutated onto `GAME.Maps[mapId].npcs` — the *same* global array `loadMap` reads from — by `syncNarrativeEntities`, called on `A.enable`, after `A.setState`, after `A.refreshFromState`, and after every narrative-runtime commit (doc comment `js/narrative-engine-adapter.js:148-150`, wrapping mechanism `:392-411`). This is state-change-driven, **not** map-load-driven and **not** per-frame/polled.

## Ordering: does narrative→classic sync run before the first map is populated after load?

Traced the actual boot sequence:

1. `js/main.js:290`: `document.addEventListener('DOMContentLoaded', boot)` — the **game** boot (`js/main.js`'s own `boot`, distinct from narrative-production's). This calls `GAME.Engine.init()`/`GAME.Engine.start()` (`js/main.js:277-283`), which loads the **title**/arrival map via the classic path only. At this point the narrative adapter is not yet enabled, so `GAME.Maps[*].npcs` still holds only classic NPCs.
2. `js/narrative-production.js:357`: `window.addEventListener('load', boot)` — narrative-production's own `boot()` (`js/narrative-production.js:273-338`). The `load` event fires strictly after `DOMContentLoaded`, so this always runs after step 1. Inside, `boot()` reads the classic save (`inspectClassicSave()`, `:286-288`), loads/deserializes the narrative save (`loadNarrativeState`, `:293`), bridges classic flags into the narrative state (`syncClassicToNarrative`, `:300`), and calls `A.setState(state)` (`:301`) — which (per the Part A adapter trace) triggers `syncNarrativeEntities('setState')` and mutates the **global** `GAME.Maps[*].npcs` for every map, not just the currently-loaded one.
3. The player only reaches a saved map by pressing "continue" on the title screen (`pressA`, `js/engine.js:497-509`), which calls `restoreClassicSave(save)` (`js/engine.js:233-242`). This is a **user-triggered** action that can only happen after the title screen has rendered — i.e., strictly after both `DOMContentLoaded` and `load` have already fired in a real browser session.

**Verdict: the ordering is safe in normal play.** By the time `restoreClassicSave` calls `loadMap()` for the actual saved map, step 2 has already run and `GAME.Maps[*].npcs` is already synced to the loaded narrative state for every map, including the one about to be loaded. `restoreClassicSave` (`js/engine.js:233-242`) also sets `S.flags` synchronously from `save.flags` **before** calling `loadMap`, so classic `cond` evaluation is likewise correct from the first frame.

**Caveat (not a hazard in production, but worth flagging):** this safety depends entirely on the `load` event firing before any user input reaches the title screen's "continue" handler, and on `NarrativeProduction.boot()` (`js/narrative-production.js:279`) not bailing out early (`if (!NR || !A || !D || !container || !GAME.installNarrativeCatalogs) return;`). If that early-return fires (e.g. the `#narrative` container element is missing, or scripts loaded out of the order `index.html` currently uses — `js/engine.js` then `js/main.js` then later `js/narrative-engine-adapter.js`/`js/narrative-production.js`, confirmed at `index.html:584,622,630,634`), `A.setState` never runs, `syncNarrativeEntities` never runs, and `GAME.Maps[*].npcs` stays classic-only — silently: no error is surfaced to the player, narrative NPCs (Ronette, Maddy, Truman-at-Roadhouse, the whole Act 4 Roadhouse cast, etc.) simply never appear anywhere. This is a silent-failure mode, not an ordering race, and it is out of scope to assess likelihood here (Part A only covers `js/narrative-engine-adapter.js`).

A second, narrower caveat: any test harness or headless driver that calls `E.restoreClassicSave` / `loadMap` directly **without** first running `narrative-production.js`'s `boot()` (e.g. a hand-rolled harness that skips the `window.load` event entirely) will reproduce exactly the "classic-only" state above — this is very likely why the audit's Part B enumerator had to bootstrap `GAME.Maps` + `A.setState` manually rather than relying on any load-path shortcut.

## Determinism

Given the same persisted flags/values/nodes_done/evidence, the **set and base position** of visible NPCs is deterministic — both `js/glue.js` conds and `js/narrative-engine-adapter.js` `when` clauses are pure functions of that state (`E.checkCond`, `NR.evalCond`), confirmed structurally in Part A and empirically by the enumerator (`presence-enumeration.md`): re-running the same seed twice (the script does this implicitly since `resolveSeed` is called once per seed from a fresh `NR.createState()`) always yields the same population per map.

One non-deterministic element exists but does **not** affect population: `js/engine.js:120` seeds each spawned NPC's `nextThink` with `tGlobal + Math.random() * 4000`, and wander-tick jitter reuses `Math.random()` at `:695/:704/:706/:710`. This only affects the *timing/direction of idle wandering animation* for NPCs with `wander: true`, never whether an NPC is present or its spawn (`homeX`/`homeY`) coordinates.

## Summary verdict

| Question | Answer |
|---|---|
| NPC positions persisted? | No — only `mapId/tx/ty/dir/clues/flags` (classic) and narrative flags/values/nodes/evidence (narrative slot). |
| Classic NPC list recomputed when? | Every `loadMap()` call, from `cond` evaluated live against `S.flags`. |
| Adapter entities re-injected when? | On `A.enable`, after `A.setState`, after `A.refreshFromState`, after every narrative commit — state-change-driven, global (`GAME.Maps[*]`), not map-load-scoped. |
| Sync-before-first-populated-map hazard? | Not in normal play — `window.load` (narrative boot) always precedes the user's "continue" press (classic restore). Hazard exists only if narrative boot's early-return fires, or a test harness skips it. |
| Deterministic given same save? | Yes, for population/positions. Wander-timing jitter is the only non-determinism, and it's cosmetic. |
