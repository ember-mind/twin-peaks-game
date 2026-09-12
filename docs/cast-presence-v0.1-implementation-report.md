# Cast Presence v0.1 — implementation report (validators first, Acts 1–4 truth compiled)

Date: 2026-09-12. Sources: `docs/cast-continuity-contract-v0.1.md`, `docs/cast-continuity-lead-decisions-v0.1.md`, `docs/cast-continuity-final-consistency-report.md`, `docs/cast-continuity-b1-resolution.md`; truth `artifacts/world-character-audit/cast-windows-acts-1-4.md`, `validation-plan.md`. Artifacts: `artifacts/cast-presence-v0.1/`.

**Scope reached in this pass**: Phases 0–5, 7–9 (data side), 12, 15, and the seam function of Phase 6 with its tests. **Not reached**: Phases 6 (hook into the adapter), 10 (old body owners removed), 11 (Character Life through the new population), 13 (real-build proof), 14 (remaining migration) — blocked by the Phase 0 collision rule (§0). Verdict §18.

## 0. Phase 0 — baseline and collision

`artifacts/cast-presence-v0.1/phase0-baseline.md`. Narrative lint PASS (known P7 warning), story-truth lint PASS, canonical sync 90/99 (pre-existing divergences from the concurrent session).

**Collision.** Another session (Codex/qwen, last activity 16:57 today, idle since) holds **uncommitted edits to `js/narrative-engine-adapter.js`** (+136 lines: a `duplicate_named_presence` runtime diagnostic inside `syncNarrativeEntities`, a `getCastPresenceSnapshot()` inspector API keyed on `NARRATIVE_ENTITIES` and sprite grouping), **`index.html`** (two script tags for `js/cast-report.js`, `js/cast-inspector.js`) and untracked `test/cast-continuity.js`, `test/cast-inspector.js`, `test/cast-report.js`, `reports/qwen-cast-inspector-m1-m5.md`. Those files are exactly the population seam this milestone must rewrite (Phase 6/10 replace `NARRATIVE_ENTITIES` + classic NPCS bodies with registry placements, which empties the model their inspector reads). Per the brief ("If another session modifies the same population/adapter files: STOP and report collision") this pass did not edit `js/narrative-engine-adapter.js`, `js/glue.js` or `index.html`. Nothing of theirs was overwritten. Everything that does not touch that seam was completed.

## 1. Core implementation

- `js/cast-presence.js` — `GAME.CastPresence`: `resolveCharacterPresence(id, state, opts)`, `resolveCast(state)`, `tryResolveCast(state)`, `bodiesFor(mapId, state)`, `snapshot(state)`, `format(result)`, `syncMaps(maps, state, live, opts)` (the Phase 6 seam function, not yet called by the adapter), dev helpers `resolve(id)` / `where()`. Pure: no mutation, no save, no clock, no player position. Predicates evaluated with `GAME.NarrativeRuntime.evalCond` (single semantics).
- `narrative/cast/windows.json` — canonical data (26 characters, 32 windows), embedded as `GAME.NarrativeData.cast` by `test/gen-narrative-data.js` (extended) into `js/narrative-data.gen.js`.
- `test/cast-continuity-validate.js` — V1–V8, V5b, V6b, terminal lint, regression corpus RC1–RC8 with negative fixtures. `--report` writes `artifacts/cast-presence-v0.1/validator-results.md`.
- `test/cast-presence-pre-migration.js` — Phase 1 proof against today's body sources (must FAIL until Phase 10).
- `test/cast-presence-sync.js` — seam function: exact body sets per map, idempotence, re-entry regression, live reconcile, same-map re-placement, save/reload.
- Fixtures: `test/fixtures/cast-pins-acts-1-4.json` (24 seeds/pins, whole cast per moment), `test/fixtures/cast-transitions-acts-1-4.json` (42 change records with authoring).
- `docs/cast-presence-authoring.md` — Phase 15 guide.

## 2. Data format

```
characters.<id> = { class, sprite, name, baseline: <placement>, authority }
windows[]       = { id, owner, when, cast: { <id>: <placement> }, cause, exit,
                    entry_authored_by?, exit_authored_by?, exit_residual? }
<placement>     = { status: PLACED, map_id, x, y, dir, dialogue, wander }
                | { status: OFFSCREEN, label }
                | { status: TERMINAL_REMOVED, event }
```
Windows name only the cast that changes. Baseline dialogue cascades are the classic ones verbatim (`js/glue.js` NPCS), so a resolved baseline body keeps its dialogue reference. `when` is the mission grammar (no `any`: HAWK_SHORE split into two value-exclusive windows). Authoring references may be a mission page id or `classic:<dialogueId>` (a classic dialogue whose `setFlag` is the transition flag).

## 3. Resolver semantics

Exactly the contract §3: all windows naming the character are evaluated; 1 → placement; >1 → `CastPresenceError OVERLAP` (character, window ids, placements, owners); 0 → baseline; none → `NO_PLACEMENT`. No ordering, no priority. `OFFSCREEN` and `TERMINAL_REMOVED` are authored results. `bodiesFor` returns classic-shaped NPC records without `cond` (placement already decided).

## 4. Pre-migration validator failures (Phase 1)

`node test/cast-presence-pre-migration.js` → exit 1, `artifacts/cast-presence-v0.1/pre-migration-failures.md`. Over the 24 seeds: **duplicate=50, missing=29, phantom=93**. Reproduced known doubles: ACT4_EVENING_GATHERING / ACT4_ROADHOUSE_PRE_PHONE Norma diner+roadhouse and Truman sheriff+roadhouse; ACT3_OEJ Hawk body at sheriff and none at oej; James/Shelly/Log Lady at diner+roadhouse ×4 seeds; Hawk 21 duplicates across the Act 3 chain (classic sheriff body never conditioned) — the validator is not green before migration.

## 5. Migration performed (data side)

`artifacts/cast-presence-v0.1/migration-matrix.md`: every truth row → one window; every registry character → one baseline. Act 4 cluster (Truman, Hawk, Lucy, Andy, Sarah, Norma, Shelly, Log Lady, James, Bobby, Donna, Jacoby, Leland, Maddy, Giant) and Act 3 cluster (Truman, Hawk, Audrey, Jacques, guards) compiled from the final decisions, not from sprite lists. Remaining registry characters (Gerard, Ronette, nurse, Ben Horne, Laura, mfap, Bob) compiled as baselines + `BOB_FINALE`, `JAMES_NOT_YET`, `ACT5_LELAND_STATION`, `LELAND_DEAD` from classic conds.

## 6. Old body owners removed

**Not done** (Phase 10 blocked by §0). V7 lists the 41 duplicate owners to delete: 22 adapter entities, 19 classic NPCS entries, the four `!flag:gigante2` hacks. Prepared delta: adapter `syncNarrativeEntities` → one call `GAME.CastPresence.syncMaps(GAME.Maps, state, E && E.state, { hydrate: hydrateNpc })`; `NARRATIVE_ENTITIES` → `[]`; `js/glue.js` NPCS → maps start with `npcs: []` (registry populates at enable/setState/every commit, the same hook points as today); `index.html` adds `js/cast-presence.js` after `narrative-data.gen.js`. Known dependents to migrate in the same step: `test/smoke.js` and `test/walkthrough.js` read classic NPCS `cond`s directly (lines 129/411/430/460 and 125/237).

## 7. Act 3 truth snapshots

`artifacts/cast-presence-v0.1/act3-presence-trace.md` (resolver, derived): TRAINCAR_REPORT Truman traincar 9,8 + Hawk 14,8; NORTH_CUT Hawk 22,3; OEJ Hawk **oej 6,8**, Jacques oej 7,5, Audrey oej 13,7 only with `audrey_indaga ∧ ¬audrey_vista_oej`; AUDREY_SEEN Truman OFFSCREEN(boat); AFTER_ARREST Hawk OFFSCREEN(escort), Jacques OFFSCREEN(guarded), guard hospital 7,3; GUARDED_HOSPITAL Hawk sheriff; NIGHT Jacques TERMINAL_REMOVED only with `jacques_dead`.

## 8. Act 4 truth snapshots

`artifacts/cast-presence-v0.1/act4-presence-trace.md`: AFTERNOON / PROMISE_MADE Maddy diner 10,1, Leland diner 11,1, diner four at baseline, station four, Sarah palmer, Bobby/Donna/Jacoby town, Giant OFF; EVENING_GATHERING seven at the Roadhouse, Hawk OFF(patrol), Leland OFF(hidden), Maddy OFF(home), Jacoby OFF(home); PRE_PHONE + Giant 8,1, Sarah OFF(asleep); **POST_PHONE_INSIDE ×3 branches: crowd + Truman present, Giant OFF** (centrale: Andy OFF); ROUTE_*: Truman sheriff, Norma diner, five OFF(home); SHORE: Hawk town 16,27, Maddy TERMINAL; STATION_BEFORE_DAWN: same.

## 9. B1 runtime beat

`narrative/missions/M8.json` `m8_leland_taxi`: page `m8.b0.leland_taxi.chiusura.p01` (mode `action`, unconditional) inserted after `m8.b0.leland_taxi.accompagno.p02`, before the notebook page `m8.b0.leland_taxi.p02`, exact approved prose. `js/narrative-data.gen.js` regenerated. Direct coverage: validator RC7 (page id, node, map, mode, exact text, position; negatives a–d). Narrative lint, narrative-validate-m8, act-4-flow, act-4-mirror-gate green after the change.

## 10. Overlap / absence results

`artifacts/cast-presence-v0.1/overlap-report.md`: 0 overlapping pairs reachable on the seed corpus (51 pairs share a character, none co-true), 0 resolver errors over 24 × 26 resolutions.

## 11. V1–V8 results

`artifacts/cast-presence-v0.1/validator-results.md` (final run): V1 PASS (624), V2 PASS (624), V3 PASS (624; jacques resolves via its window partition), V4 PASS (360 shuffles; RC8), V5 PASS (24 pins, whole cast), V5b PASS (27 checks; actor nodes gated by current mission + `NR.prepareNode` liveness; RC1 Hawk at oej, RC5 Truman at traincar; one printed allowlist, `m6_audrey` under R1, see §16), V6 PASS (42), V6b PASS (42 + negatives a–d, RC2 negative, classic-setFlag negative), **V7 FAIL (41 duplicate owners — expected until Phase 10)**, V8 PASS (24), terminal lint PASS (4).

## 12. Character Life verification

`node test/character-life.js`, `ambient-life.js`, `environment-life.js`, `walk-phase-contract.js`, `authored-cast-contract.js` PASS (unchanged; the population they receive is unchanged because the hook is not integrated). LIFE AFTER PRESENCE stays true by construction: `bodiesFor`/`syncMaps` emit classic-shaped bodies; Character Life reads `S.npcs` as before.

## 13. Save / reload proof

`artifacts/cast-presence-v0.1/save-reload-report.md`: V8 identical snapshot after `NR.serialize` round-trip on all 24 seeds; no location keys in the save. Browser reloads (Roadhouse pre-phone, post-phone, guarded hospital) **pending** on the hook.

## 14. Real-build proof

**Not run** (hook not integrated). The re-entry regression (post-phone Roadhouse populated, Giant absent; closed after `focus_destination`) is covered at resolver and seam level (`test/cast-presence-sync.js` §3) and must be repeated on the real build after Phase 6/10.

## 15. Remaining unmigrated named cast

None at data level: all 26 registry characters have baselines/windows. Old owners still exist for all of them (§6).

## 16. Story decisions surfaced

- **Giant exit page mis-cited**: "La sala riprende il suo tempo" is `m8.b.truman.p05` (the statement node), not a phone page. The Giant's exit at `warning_target` is carried by the lead-accepted residual R2 (`exit_residual`), not by a page.
- **Hawk cut → dock**: the only authored line is the *repeat* page `m5.hawk.hawk_cut.repeat` ("Hawk viene fino alla riva"); used as `exit_authored_by`. Lead may want the line on a mandatory page.
- **Day-boundary and self-announced departures**: Hawk leaves the station at `atto3` (classic `truman_atto3`, "Domani passiamo il confine") and Audrey leaves the hotel at `audrey_indaga` (classic `audrey_a2`, "devo essere nessuno"). Both fire while Cooper is in the room; authored by the classic dialogue that writes the flag (`classic:<id>` form, verified by `setFlag`).
- **M6 data debt**: `m6_audrey` (actor node on `oej`) lacks `not flag jacques_preso`; after the arrest it stays live while Audrey's window has ended (R1). Today the absent body gates it implicitly (the defect class this milestone removes). V5b carries an explicit printed allowlist for this one node under R1; the fix is one condition in `narrative/missions/M6.json`, not made here (mission JSON outside the B1 delta). Same pattern was avoided for `m6_tactic` by completing the seed history (arrest ⇒ interrogation done).
- `m5_report_close` has no `map_id`; Hawk's door→cut move is authored by its page p06 ("Vieni") and passes V6b vacuously on the map test.

## 17. Known debt

- Adapter hook, classic NPCS removal, `gigante2` hack removal, smoke/walkthrough migration, index.html script tag, real-build traces, browser reloads (all blocked by §0).
- The other session's `test/cast-continuity.js` / inspector read `NARRATIVE_ENTITIES`; after Phase 10 they read an empty registry unless re-pointed at `GAME.CastPresence`.
- Coordinates are today's; the environment pass may re-stage.

## 18. Verdict

**NOT READY to resume Act 4 Environment Pass.** The single derived truth exists and is proven against the authored windows (V1–V6b, V8 green; pre-migration validator red as required), but the engine still spawns bodies from two old owners (V7 red) and no real-build trace exists. Unblocking is a lead decision on the concurrent session's uncommitted adapter/index.html work (commit, discard, or hand over); after that, Phase 6/10 is the prepared delta in §6 plus smoke/walkthrough migration, then Phases 11–14.
