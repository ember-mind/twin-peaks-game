# Validation plan — cast presence (deterministic, node-only)

Reuse: `test/act-3-flow.js` / `test/act-4-flow.js` route loops (`NR.prepareNode` / `commitNode` over every choice combination), `test/walkthrough.js` classic seeds, `GAME.NarrativeAdapter.setState(state)` bootstrap (`test/act-4-mirror-gate.js:19-40`), and the audit's `tools/presence-enumerator.js` (already resolves classic `cond` + adapter `when` per map for a seeded state).

## V1 — cast uniqueness over reachable states (the G10 test)
```
for state in reachableStates():          # Act 1 seeds ∪ M4..M8 route enumeration ∪ post-station
    placements = resolveCast(state)      # after migration: registry; before: enumerator fallback
    for character in NAMED:
        bodies = placements[character]   # list of (sceneId, x, y, source)
        assert len(bodies) <= 1, (state.label, character, bodies)
```
Would have printed for pass 01: `(act4_presagio_active, norma, [(diner,5,2,classic), (roadhouse,5,6,adapter)])` and `(act4_after_discovery_hawk, hawk, [(sheriff,12,8,classic), (town,16,27,adapter)])`. Runs before any screenshot.

## V2 — expected presence / absence pins (from scene contracts)
Table of `(state, character, sceneId | offscreen)` taken from `scene-contracts.md` and `offscreen-timeline.md` per act: e.g. W8 `norma → roadhouse`, `norma ↛ diner`; W9 palmer-vice `andy → palmer`; W10 hawk `→ town` and `↛ sheriff`; post-`jacques_preso` `jacques → offscreen`. Each act's design pass adds its rows; the lint fails on a missing row for any named character the act moves.

## V3 — handoff / return
For every windowed rule R of character C: pick a reachable state s1 where R matches and the reachable successor s2 where it stops matching (the flow harness gives the node that flips it); assert `resolve(s1)[C].sceneId == R.sceneId` and `resolve(s2)[C]` equals the next rule (home or offscreen) — i.e. the return is authored by fall-through, never by a second flag.

## V4 — save / reload determinism
For each state: `resolve(classicSnapshot(state) ∘ narrativeSnapshot(state)) == resolve(liveState)`; plus a browser probe (existing `test/production-persistence-fault-probe.html` pattern): save mid-window, reload, list `S.npcs` per map, compare to V1's expected bodies.

## V5 — dead / removed
For characters with a terminal `offscreen` rule (jacques after `jacques_preso`, maddy after discovery, leland after `leland_morto`): assert zero bodies in every reachable state after the flag.

## V6 — no classic shadow copy (mirror gate extension)
`js/glue.js` `NPCS` must contain no id that the cast registry owns (named set); the adapter's `NARRATIVE_ENTITIES` must contain no body for a registry character (bodies only via rules). Fails loudly on the next "just inject a sprite".

## V7 — interaction ghost
For every classic dialogue cascade keyed to a named character on map M, there exists a reachable state where the registry places that character on M; otherwise warn (dialogue without body).

## V8 — overlap warning
For every state and character, count matching rules; >1 is a warning unless the registry marks the lower rule `shadowed_by` the upper (declared precedence).

Gate placement: V1, V3, V5, V6 hard; V2 hard for rows present; V4 browser probe in the act playthrough drivers; V7, V8 warnings with an allowlist file (Narrative System lint convention).
