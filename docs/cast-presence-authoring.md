# Cast Presence — how to move a named character (authoring guide, v0.1)

Companion of `docs/cast-continuity-contract-v0.1.md` (the contract) and `docs/cast-presence-v0.1-implementation-report.md` (what is implemented). Read this before touching where anyone stands.

## The rule

A named character's physical position is **authored world state**, derived from story state. For every reachable story state the resolver (`js/cast-presence.js`, `GAME.CastPresence`) returns exactly one of: a placement on one map, `OFFSCREEN`, `TERMINAL_REMOVED`. It evaluates every window that names the character: one true window wins; two true windows are a hard error (`OVERLAP`); none → the authored baseline; no baseline → hard error (`NO_PLACEMENT`). There is no priority, no first match, no fallback sprite.

## To move a named character

DO NOT:
- add or edit a body in `js/glue.js` NPCS;
- inject a body into `NARRATIVE_ENTITIES` in `js/narrative-engine-adapter.js`;
- add a hide flag / `cond` on the old map (`!flag:gigante2` style);
- store a position in the save.

DO (all in `narrative/cast/windows.json`, then `node test/gen-narrative-data.js`):
1. Author a **window**: `id`, `owner` (mission), `when` (mission `when` grammar over existing story state: `flag`, `evidence`, `node_done`, `value_set`, `value_is`, `proposition_path`, `not`, `all`; no `any`: split into value-exclusive windows), `cast` (only the characters that change; each a placement `{status: PLACED, map_id, x, y, dir, dialogue}` / `{status: OFFSCREEN, label}` / `{status: TERMINAL_REMOVED, event}`), `cause` (one line: the story event that moves them), `exit` (the event that ends the window).
2. Make the window **exclusive** with every other window naming the same character over reachable states (V2). Adjacent windows are half-open intervals on the story order: `A ∧ ¬B`, then `B ∧ ¬C`.
3. If the move fires while Cooper stands on the character's map, the page that shows the departure/arrival must exist in a node on that map and be named in `entry_authored_by` / `exit_authored_by` (V6b). A lead-accepted residual is named in `exit_residual` (`R1`, `R2`) and documented in the consistency report. No silent vanish.
4. `OFFSCREEN` is a real result (alive, deliberately no body: patrol, asleep, guarded, escort, home). `TERMINAL_REMOVED` only for a death/removal event listed in the terminal lint (`jacques_dead`, `maddy_trovata`, `leland_morto`).
5. Update the truth: `artifacts/world-character-audit/cast-windows-acts-1-4.md` (window row, pin table, change record) and the fixtures `test/fixtures/cast-pins-acts-1-4.json` (V5 snapshot of the whole cast for the new moment) and `test/fixtures/cast-transitions-acts-1-4.json` (V6 record: before/after seed, cause, authored page).
6. Run `node test/cast-continuity-validate.js`. V1–V8 and the regression corpus must be green. Never re-pin a fixture to make a runtime defect green.

## Environment briefs with named cast

A world-building brief for a room with named characters carries a **CAST & POPULATION** section (contract §7): BASELINE CAST, TEMPORARY STORY WINDOWS, EXPECTED ABSENCES, INGRESS/EGRESS CAUSE, RETURN / NEXT WORLD STATE. The brief names window ids; it never lists sprites to spawn.

## Debugging

In the browser console: `GAME.CastPresence.resolve('truman')` → status, scene, coordinates, source window, owner. `GAME.CastPresence.where()` → the whole snapshot on the current story state. `node test/cast-presence-pre-migration.js` reproduces the pre-migration defects against the old body sources.
