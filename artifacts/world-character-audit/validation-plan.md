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
