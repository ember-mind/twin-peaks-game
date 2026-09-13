# Cast Presence v0.1 — implementation report (Acts 1–4 migrated)

Date: 2026-09-12 (validators, data, resolver) → 2026-09-13 (integration, old owners removed, real build). Sources: `docs/cast-continuity-contract-v0.1.md`, `docs/cast-continuity-lead-decisions-v0.1.md`, `docs/cast-continuity-final-consistency-report.md`, `docs/cast-continuity-b1-resolution.md`; truth `artifacts/world-character-audit/cast-windows-acts-1-4.md`, `validation-plan.md`. Artifacts: `artifacts/cast-presence-v0.1/`.

**Scope reached**: all phases 0–15. Day 1 stopped at the population seam on the collision rule (§0); the lead's `continue` on 2026-09-13 authorised integration while preserving the concurrent session's working-tree edits. Verdict §18.

## 0. Phase 0 — baseline and collision

`artifacts/cast-presence-v0.1/phase0-baseline.md`. Narrative lint PASS (known P7 warning), story-truth lint PASS, canonical sync 90/99 (pre-existing divergences from the concurrent session).

**Collision.** Another session (Codex/qwen, last activity 16:57 today, idle since) holds **uncommitted edits to `js/narrative-engine-adapter.js`** (+136 lines: a `duplicate_named_presence` runtime diagnostic inside `syncNarrativeEntities`, a `getCastPresenceSnapshot()` inspector API keyed on `NARRATIVE_ENTITIES` and sprite grouping), **`index.html`** (two script tags for `js/cast-report.js`, `js/cast-inspector.js`) and untracked `test/cast-continuity.js`, `test/cast-inspector.js`, `test/cast-report.js`, `reports/qwen-cast-inspector-m1-m5.md`. Those files are exactly the population seam this milestone must rewrite (Phase 6/10 replace `NARRATIVE_ENTITIES` + classic NPCS bodies with registry placements, which empties the model their inspector reads). Per the brief ("If another session modifies the same population/adapter files: STOP and report collision") day 1 did not edit `js/narrative-engine-adapter.js`, `js/glue.js` or `index.html`; the lead answered `continue`. Day 2 edited those files **around** the other session's hunks (their inspector API, diagnostic comments and script tags remain in the working tree untouched) and committed only this pass's hunks: the committed adapter/index.html are HEAD + Cast Presence changes, their uncommitted work stays uncommitted as before. Consequence for their tooling: `NARRATIVE_ENTITIES` is now `[]`, so `getCastPresenceSnapshot()` and the untracked `test/cast-continuity.js` / `test/cast-inspector.js` read an empty registry until re-pointed at `GAME.CastPresence` (§17).

## 1. Core implementation

- `js/cast-presence.js` — `GAME.CastPresence`: `resolveCharacterPresence(id, state, opts)`, `resolveCast(state)`, `tryResolveCast(state)`, `bodiesFor(mapId, state)`, `snapshot(state)`, `format(result)`, `syncMaps(maps, state, live, opts)` (the Phase 6 seam: reconciles every map's `npcs` and the live engine list against the resolver; called by the adapter at enable / setState / refreshFromState / every commit), dev helpers `resolve(id)` / `where()`. Loaded by `index.html` after `narrative-data.gen.js`. Pure: no mutation, no save, no clock, no player position. Predicates evaluated with `GAME.NarrativeRuntime.evalCond` (single semantics).
- `narrative/cast/windows.json` — canonical data (26 characters, 32 windows), embedded as `GAME.NarrativeData.cast` by `test/gen-narrative-data.js` (extended) into `js/narrative-data.gen.js`.
- `test/cast-continuity-validate.js` — V1–V8, V5b, V6b, terminal lint, regression corpus RC1–RC8 with negative fixtures. `--report` writes `artifacts/cast-presence-v0.1/validator-results.md`.
- `test/cast-presence-pre-migration.js` — Phase 1 proof against the old body sources (FAILED on 2026-09-12 as required; now exits 0 with a note because both old owners are empty; the historical run is in the artifact).
- `test/cast-presence-sync.js` — seam function: exact body sets per map, idempotence, re-entry regression, live reconcile, same-map re-placement, save/reload.
- Fixtures: `test/fixtures/cast-pins-acts-1-4.json` (24 seeds/pins, whole cast per moment), `test/fixtures/cast-transitions-acts-1-4.json` (42 change records with authoring).
- `docs/cast-presence-authoring.md` — Phase 15 guide.

## 2. Data format

```
characters.<id> = { class, sprite, name, baseline: <placement>, authority }
windows[]       = { id, owner, when, cast: { <id>: <placement> }, cause, exit,
                    entry_authored_by?, exit_authored_by?, exit_residual? }
<placement>     = { status: PLACED, map_id, x, y, dir, dialogue, wander, actor_ids? }
                | { status: OFFSCREEN, label }
                | { status: TERMINAL_REMOVED, event }
```
Windows name only the cast that changes. Baseline dialogue cascades are the classic ones verbatim (`js/glue.js` NPCS), so a resolved baseline body keeps its dialogue reference. `when` is the mission grammar (no `any`: HAWK_SHORE split into two value-exclusive windows). Authoring references may be a mission page id or `classic:<dialogueId>` (a classic dialogue whose `setFlag` is the transition flag). `actor_ids` is the authored interaction reference of a body: the mission actor ids it answers to when they differ from the character id (`hawk` → `hawk_bridge` / `hawk_door` / `hawk_cut` on the three traincar placements; `giant` → `gigante`); the adapter's `tryInteract` reads it from the map data, never from an implicit alias table.

## 3. Resolver semantics

Exactly the contract §3: all windows naming the character are evaluated; 1 → placement; >1 → `CastPresenceError OVERLAP` (character, window ids, placements, owners); 0 → baseline; none → `NO_PLACEMENT`. No ordering, no priority. `OFFSCREEN` and `TERMINAL_REMOVED` are authored results. `bodiesFor` returns classic-shaped NPC records without `cond` (placement already decided).

## 4. Pre-migration validator failures (Phase 1)

`node test/cast-presence-pre-migration.js` → exit 1, `artifacts/cast-presence-v0.1/pre-migration-failures.md`. Over the 24 seeds: **duplicate=50, missing=29, phantom=93**. Reproduced known doubles: ACT4_EVENING_GATHERING / ACT4_ROADHOUSE_PRE_PHONE Norma diner+roadhouse and Truman sheriff+roadhouse; ACT3_OEJ Hawk body at sheriff and none at oej; James/Shelly/Log Lady at diner+roadhouse ×4 seeds; Hawk 21 duplicates across the Act 3 chain (classic sheriff body never conditioned) — the validator is not green before migration.

## 5. Migration performed (data side)

`artifacts/cast-presence-v0.1/migration-matrix.md`: every truth row → one window; every registry character → one baseline. Act 4 cluster (Truman, Hawk, Lucy, Andy, Sarah, Norma, Shelly, Log Lady, James, Bobby, Donna, Jacoby, Leland, Maddy, Giant) and Act 3 cluster (Truman, Hawk, Audrey, Jacques, guards) compiled from the final decisions, not from sprite lists. Remaining registry characters (Gerard, Ronette, nurse, Ben Horne, Laura, mfap, Bob) compiled as baselines + `BOB_FINALE`, `JAMES_NOT_YET`, `ACT5_LELAND_STATION`, `LELAND_DEAD` from classic conds.

## 6. Old body owners removed

Done 2026-09-13. `js/narrative-engine-adapter.js`: `NARRATIVE_ENTITIES = []` (22 entity records deleted), `classicIdsFor` deleted, `syncNarrativeEntities` now delegates to `GAME.CastPresence.syncMaps(GAME.Maps, state, {mapId, npcs} of the engine, { hydrate: hydrateNpc })` at the same four hook points; a resolver error is logged as `cast_presence_error` and re-thrown (contradictory authored world is a hard error). `js/glue.js`: NPCS is empty for every map (19 classic bodies deleted, the four `!flag:gigante2` hacks gone; `narrative-production.js` still derives `gigante2` for the objective text only). `index.html`: `js/cast-presence.js` loaded after `narrative-data.gen.js`, cache tags bumped. **V7 single-body-owner PASS**. Dependents migrated to the resolver: `test/smoke.js`, `test/walkthrough.js`, `test/act-3-flow.js`, `test/act-4-flow.js`, `test/act-4-mirror-gate.js`, `test/character-life.js`, `test/m8-engine-harness.html` (gate 9 now asserts the corrected Maddy exit), the two playthrough probe pages and drivers; 14 harness pages gained the script tag.

## 7. Act 3 truth snapshots

`artifacts/cast-presence-v0.1/act3-presence-trace.md` (resolver, derived): TRAINCAR_REPORT Truman traincar 9,8 + Hawk 14,8; NORTH_CUT Hawk 22,3; OEJ Hawk **oej 6,8**, Jacques oej 7,5, Audrey oej 13,7 only with `audrey_indaga ∧ ¬audrey_vista_oej`; AUDREY_SEEN Truman OFFSCREEN(boat); AFTER_ARREST Hawk OFFSCREEN(escort), Jacques OFFSCREEN(guarded), guard hospital 7,3; GUARDED_HOSPITAL Hawk sheriff; NIGHT Jacques TERMINAL_REMOVED only with `jacques_dead`.

## 8. Act 4 truth snapshots

`artifacts/cast-presence-v0.1/act4-presence-trace.md`: AFTERNOON / PROMISE_MADE Maddy diner 10,1, Leland diner 11,1, diner four at baseline, station four, Sarah palmer, Bobby/Donna/Jacoby town, Giant OFF; EVENING_GATHERING seven at the Roadhouse, Hawk OFF(patrol), Leland OFF(hidden), Maddy OFF(home), Jacoby OFF(home); PRE_PHONE + Giant 8,1, Sarah OFF(asleep); **POST_PHONE_INSIDE ×3 branches: crowd + Truman present, Giant OFF** (centrale: Andy OFF); ROUTE_*: Truman sheriff, Norma diner, five OFF(home); SHORE: Hawk town 16,27, Maddy TERMINAL; STATION_BEFORE_DAWN: same.

## 9. B1 runtime beat

`narrative/missions/M8.json` `m8_leland_taxi`: page `m8.b0.leland_taxi.chiusura.p01` (mode `action`, unconditional) inserted after `m8.b0.leland_taxi.accompagno.p02`, before the notebook page `m8.b0.leland_taxi.p02`, exact approved prose. `js/narrative-data.gen.js` regenerated. Direct coverage: validator RC7 (page id, node, map, mode, exact text, position; negatives a–d). Narrative lint, narrative-validate-m8, act-4-flow, act-4-mirror-gate green after the change.

## 10. Overlap / absence results

`artifacts/cast-presence-v0.1/overlap-report.md`: 0 overlapping pairs reachable on the seed corpus (51 pairs share a character, none co-true), 0 resolver errors over 24 × 26 resolutions.

## 11. V1–V8 results

`artifacts/cast-presence-v0.1/validator-results.md`: V1 PASS (624), V2 PASS (624), V3 PASS (624; jacques resolves via its window partition), V4 PASS (360 shuffles; RC8), V5 PASS (24 pins, whole cast), V5b PASS (27 checks; actor nodes gated by current mission + `NR.prepareNode` liveness; RC1 Hawk at oej, RC5 Truman at traincar; one printed allowlist, `m6_audrey` under R1, see §16), V6 PASS (42), V6b PASS (42 + negatives a–e, RC2 negative), **V7 PASS** (0 duplicate owners after Phase 10; 41 on 2026-09-12 before it), V8 PASS (24), terminal lint PASS (4). All green.

## 12. Character Life verification

`node test/character-life.js` (its Truman population check now resolves through `CastPresence.bodiesFor('sheriff', null)`: exactly one Truman at 10,4), `ambient-life.js`, `environment-life.js`, `walk-phase-contract.js`, `authored-cast-contract.js` PASS after integration. LIFE AFTER PRESENCE holds: `syncMaps` hydrates bodies with the engine's own `hydrateNpc` shape (homeX/homeY, vx/vy, moving); Character Life reads `S.npcs` as before and never decides presence. No Character Life architecture change.

## 13. Save / reload proof

`artifacts/cast-presence-v0.1/save-reload-report.md`: V8 identical snapshot after `NR.serialize` round-trip on all 24 seeds; no location keys in the save. **Browser reloads on the real build** (Chrome headless, iframe reload of `index.html`): Act 3 guarded hospital (after the arrest); Act 4 Roadhouse pre-phone (path A), Roadhouse post-phone before the crossroads (paths A, B, C, D), crossroads after the focus choice (A). Every one: narrative state identical, `CastPresence.where()` identical, save free of `cast_source` / `sceneId` / `homeX`.

## 14. Real-build proof

Run on the real build with the production drivers (Chrome headless, real keys, no teleport). `node test/act-3-playthrough.js` (all paths): **189/189**; snapshots at traincar report, OEJ before the arrest, after the arrest, guarded hospital, night station — every pin comparison `combacia` (two moments captured without pin compare because the driver's path always sets `audrey_indaga` in Act 2, §17). `node test/act-4-playthrough.js` A/B/C/D: **136/136, 133/133, 130/130, 125/125** (524/526 on the first full run; the two failures were path B visiting the Log Lady at the diner *after* the taxi — she is at the Roadhouse by then — the driver now visits her before, and asserts the four regulars are at the Roadhouse after the closing beat). Snapshots at afternoon diner, after the promise, evening gathering, pre-phone, **post-phone inside the room**, re-entry after the phone, crossroads, shore, station before dawn: 31 pin comparisons, 0 discrepancies, no duplicate body on any map, no missing required actor, no implicit absence, no API fallback. Re-entry regression (mandatory): after the phone and before the crossroads Cooper leaves and re-enters the Roadhouse by the door: Truman + crowd present, Giant absent, on all four paths; after `focus_destination` the room is empty and the cast has moved. Traces: `artifacts/cast-presence-v0.1/act3-presence-trace.md`, `act4-presence-trace.md` ("Real-build capture" sections).

## 15. Remaining unmigrated named cast

None. All 26 registry characters (incl. Gerard, Ronette, nurse, Ben Horne, Laura, mfap, Bob, the two guards) are registry-owned with no old owner left (V7). No character required a new story decision; the migration of the remaining cast was mechanical (baselines + classic-cond windows).

## 16. Story decisions surfaced

- **Giant exit page mis-cited**: "La sala riprende il suo tempo" is `m8.b.truman.p05` (the statement node), not a phone page. The Giant's exit at `warning_target` is carried by the lead-accepted residual R2 (`exit_residual`), not by a page.
- **Hawk cut → dock**: the only authored line is the *repeat* page `m5.hawk.hawk_cut.repeat` ("Hawk viene fino alla riva"); used as `exit_authored_by`. Lead may want the line on a mandatory page.
- **Day-boundary and self-announced departures**: Hawk leaves the station at `atto3` (classic `truman_atto3`, "Domani passiamo il confine") and Audrey leaves the hotel at `audrey_indaga` (classic `audrey_a2`, "devo essere nessuno"). Both fire while Cooper is in the room; authored by the classic dialogue that writes the flag (`classic:<id>` form, verified by `setFlag`).
- **Sarah's predicate** (found on the real build, path C): D1 was written as `presagio_status=active ∧ ¬atto5`, but `m8_discovery` turns `presagio_status` to `verified`, which put Sarah back in her living room while Andy was "with Sarah" at the shore. Corrected to `value_set presagio_status ∧ ¬atto5` (same intent, D1 text amended); the shore/station seeds now carry `verified` so the pins catch it.
- **Synthetic seeds must be reachable**: the M8 harness/probe seed (`atto4` + boundary flags, no Act 3 history) made the resolver throw `OVERLAP hawk: ACT3_HAWK_BRIDGE + ACT3_HAWK_ESCORT` on the real build — correct behaviour on a contradictory state. The harness and probe now seed the fixture's `ACT4_AFTERNOON` history.
- **Interaction ids**: mission actor nodes address `hawk_bridge`/`hawk_door`/`hawk_cut` and `gigante`; the registry has one `hawk` and one `giant`. Solved as authored data (`actor_ids` on those placements), not by renaming mission nodes.
- **Audrey's OEJ window has no lower bound**: with `audrey_indaga` set in Act 2, the resolver already places her at OEJ 13,7 during the traincar day (real-build Act 3 capture flags it against the `ACT3_TRAINCAR_REPORT` pin, which lacks `audrey_indaga`). This is the truth as authored (C4: entry `audrey_indaga`, her own line authors the departure); OEJ is unreachable before `east_route_confirmed`, so no player sees it. Lead may bound it (`∧ east_route_confirmed`) if the hotel should keep her until the crossing.
- **M6 data debt**: `m6_audrey` (actor node on `oej`) lacks `not flag jacques_preso`; after the arrest it stays live while Audrey's window has ended (R1). Today the absent body gates it implicitly (the defect class this milestone removes). V5b carries an explicit printed allowlist for this one node under R1; the fix is one condition in `narrative/missions/M6.json`, not made here (mission JSON outside the B1 delta). Same pattern was avoided for `m6_tactic` by completing the seed history (arrest ⇒ interrogation done).
- `m5_report_close` has no `map_id`; Hawk's door→cut move is authored by its page p06 ("Vieni") and passes V6b vacuously on the map test.

## 17. Known debt

- The concurrent session's uncommitted inspector (`getCastPresenceSnapshot`, `js/cast-inspector.js`, `js/cast-report.js`, untracked `test/cast-continuity.js` / `test/cast-inspector.js` / `test/cast-report.js`) reads `NARRATIVE_ENTITIES`, now empty: it needs re-pointing at `GAME.CastPresence.where()` or retiring. Not touched here.
- `test/probe-act4-pacing.js` (a probe, not in the suite) still reads the empty registry.
- Two Act 3 pins (`ACT3_TRAINCAR_REPORT`, `ACT3_OEJ_NO_AUDREY`) seed `audrey_indaga=false`; the Act 3 driver always talks to Audrey in Act 2, so it captures those moments without pin compare. The pins stay valid for a player who never talks to her.
- Classic-harness pattern: enabling the adapter with the full mission list routes `interact()` to `tryInteract` for every mission actor; `test/smoke.js` therefore syncs bodies through a transient enable/disable (`syncCastToMaps`).
- `m6_audrey` data debt (§16).
- `test/smoke.js` dropped from 420 to 415 checks (the five `E.npcActive` cond assertions replaced by body-presence assertions); `test/walkthrough.js` now reports 85 acquisitions (was 81: the resolver exposes baseline bodies the classic `cond`s used to hide in states the simulator visits) — both to be re-baselined in `Twin Peaks Game.md` MEMORY.
- Coordinates are today's; the environment pass may re-stage.

## 18. Verdict

**READY to resume Act 4 Environment Pass.** For every migrated named character and every tested reachable story state the engine has exactly one authored answer to "where is this person right now" (one scene, OFFSCREEN, or TERMINAL_REMOVED): causal, order-independent, derived, save-deterministic, single-owner, validated against the full window truth (V1–V8 green, V7 included) and against the real build (Acts 3–4, all paths, browser reloads). The pre-migration validator demonstrated the old defect (50 duplicate bodies); the post-migration validator and the real-build traces prove the class eliminated. Open items are debt, not blockers (§17).
