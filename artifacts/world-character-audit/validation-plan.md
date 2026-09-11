# Validation plan — cast continuity (deterministic, node-only) — amended 2026-09-11

Supersedes the first version (V1 "≤1", V7 ghost, V8 overlap-warning). Normative list: `docs/cast-continuity-contract-v0.1.md` §9. All eight are **hard** gates.

Reuse: `test/act-3-flow.js` / `test/act-4-flow.js` route loops (`NR.prepareNode` / `commitNode` over every choice combination), `test/walkthrough.js` classic seeds, `GAME.NarrativeAdapter.setState(state)` bootstrap (`test/act-4-mirror-gate.js:19-40`), `tools/presence-enumerator.js` (resolves classic `cond` + adapter `when` per map for a seeded state — the pre-migration oracle the validators must fail against).

```
reachable = act1Seeds ∪ M4..M8 routeEnumeration ∪ postStation   # never the free boolean product
```

## V1 — exactly one presence
```
for state in reachable:
    for c in REGISTRY:
        r = resolveCharacterPresence(c, state)      # {placement | OFFSCREEN | TERMINAL_REMOVED}
        assert count(r) == 1, (state.label, c, r)
```
Pre-migration (through the enumerator) this prints `(act4_presagio_active, norma, [diner, roadhouse])` and `(act4_after_discovery_hawk, hawk, [sheriff, town])` as **failures**.

## V2 — zero overlaps
```
for state in reachable:
    for c in REGISTRY:
        assert len([w for w in windows(c) if w.pred(state)]) <= 1
```
Any overlap fails the build. No `shadowed_by`, no allowlist.

## V3 — no implicit absence
For every registry character: baseline defined (placement, `OFFSCREEN`, or `TERMINAL_REMOVED`), or every reachable state matched by a window. A character whose only "absence" is a missing sprite fails.

## V4 — order independence
```
base = {s: resolveCast(s) for s in reachable}
for seed in SEEDS:
    shuffledRegistry = shuffle(windows, baselines, mission order, file order, seed)
    assert {s: resolveCast(s, shuffledRegistry) for s in reachable} == base
```
Any difference invalidates the architecture, not the data.

## V5 — world window pins
For every window in `cast-windows-acts-1-4.md`, one table `(window state seed, character → expected)` covering the **whole relevant cast**, e.g. `ACT4_ROADHOUSE_PRE_PHONE`: truman=roadhouse, hawk=OFFSCREEN, norma/shelly/bobby/donna/james/loglady=roadhouse, giant=roadhouse, sarah=palmer|OFFSCREEN (lead decision), leland=OFFSCREEN, maddy=OFFSCREEN, andy=sheriff, lucy=sheriff, jacoby=(lead decision). The lint fails on a missing pin row for any character the window names.

## V6 — causal transition
For every change record (BEFORE → CAUSE → AFTER): pick a reachable state before the cause, assert the old placement; apply the causal node/effect through the flow harness, assert the new placement; assert the record exists in the windows file (a window naming a character without a change record fails).

## V7 — single body owner
`js/glue.js` `NPCS`, `js/narrative-engine-adapter.js` `NARRATIVE_ENTITIES`, and scene modules' manual bodies must contain no id the registry owns. Fails on the next "just inject a sprite".

## V8 — save determinism
`resolve(classicSnapshot(state) ∘ narrativeSnapshot(state)) == resolve(liveState)` for every reachable state; grep gate: no `cast`/location key in the save payload; browser probe (existing `test/production-persistence-fault-probe.html` pattern): save mid-window, reload, list `S.npcs` per map, compare with V5.

## Warning (allowlisted)
Ghost interaction: a classic dialogue cascade keyed to a named character on map M with no window ever placing them on M.

Gate placement: all V1–V8 in `test/cast-continuity-validate.js` (node), run in the test order before any browser gate; V8 browser probe inside the act playthrough drivers.

## Regression corpus (added 2026-09-11 by the final consistency pass)

These cases encode *why* the corrected truth was wrong. Each must FAIL against the pre-correction tables and PASS against `cast-windows-acts-1-4.md` as corrected. They live in `test/cast-continuity-validate.js` as named fixtures.

| id | defect class | seeded state | assertion | validator |
|---|---|---|---|---|
| RC1 Hawk at OEJ | 3 frozen scene needs a character placed elsewhere | `east_route_confirmed ∧ ¬jacques_preso` (with and without `audrey_indaga`) | `hawk → oej` (landing), never `sheriff`; `m6_arrest` (map oej) requires him: V5b | V5, V5b |
| RC2 Roadhouse depopulation | 7 room empties on a flag while the player is inside | `warning_target ∧ ¬focus_destination` (all three branches) | truman + norma/shelly/loglady/james/bobby/donna → `roadhouse`; giant → `OFFSCREEN` | V5, V6b (`m8_roadhouse_phone.map_id = roadhouse`, crowd placed there, exit not authored → the old `warning_target` exit fails) |
| RC3 Jacques alive | 2 TERMINAL used for a hidden sprite | `jacques_preso ∧ ¬jacques_dead` | `jacques → OFFSCREEN` (label guarded), not `TERMINAL_REMOVED`; `TERMINAL_REMOVED` only when `jacques_dead` | V5; new lint: a `TERMINAL_REMOVED` window whose entry is not a death/removal event listed in `docs/story` fails |
| RC4 Maddy leaves before her caption | 1/7 return before the player left the room | `promise_stance ∧ ¬T_LELAND_TAXI` | `maddy → diner`; at `T_LELAND_TAXI` → `OFFSCREEN` with `exit_authored_by: m8.b0.leland_taxi.p00` | V5, V6b |
| RC5 Truman leaves the car | 7/4 "returns home" with no cause while Cooper is on the map | `east_route_confirmed ∧ ¬jacques_preso ∧ ¬audrey_vista_oej` | `truman → traincar` (he stays with the ring); `audrey_vista_oej` → `OFFSCREEN` (boat); `jacques_preso` → `sheriff` | V5, V6 |
| RC6 Hawk escort | 5 OFFSCREEN as shorthand | `jacques_preso ∧ ¬m6_hospital_guard` | `hawk → OFFSCREEN` with label `escort`, record C2b present, exit `m6_hospital_guard` (the register) | V6 (record required) |
| RC7 gathering entry (B1) | 7 | `T_LELAND_TAXI ∧ ¬presagio_status` | until B1 closes: the diner four have no compiled window here → V3 must FAIL loudly (no implicit absence, no silent move); after B1: they resolve per the chosen event | V3, V6b |
| RC8 order independence on the Act 3 chain | — | every Act 3 seed | shuffled registry gives identical Hawk/Truman/Jacques results | V4 |
