Gameplay/progression audit found no reproduced P0/P1 failures in read-only act/runtime gates: Act 3 passed 280/280, Act 4 1611/1611, Act 5 90729/90729, plus smoke and full simulated walkthrough. Real-Chrome playthrough was attempted under the shared lock but DevTools never started (`DevTools endpoint timeout`), so no browser screenshot or console-error claim is made. Two concrete P2 defects remain in static/runtime paths: an unreachable Act 5 P7 presentation branch and isolated walkable map cells.

## Findings

### 1. Act 5 P7 presentation branch is unreachable

**Severity**: P2 (noticeable progression/content flaw)

**Where**: Act 5 Truman presentation, `narrative/missions/M9.json:289-297,519-537`; runtime filter `js/narrative-runtime.js:448-455`. Repro: follow normal Act 5 until P6 is formulated, reach Truman's presentation, and inspect available proposition choices; P7 cannot be selected.

**What**: `m9_present_truman` contains a `presentation.on.P7` rejection branch, but normal presentation choices include only propositions whose formulation status is `formulated`. No mission effect writes P7 formulation status, so no normal Act 5 route can ever expose or exercise this branch. Expected behavior: either provide the intended P7 formulation route, or remove dead branch/data so progression content matches reachable state.

**Evidence**:

- `rg -n '"proposition": "P7"|"proposition":"P7"|P7\.formulation\.status' narrative js test tools` returns only `tools/narrative/lint-allowlist.json:94`.
- `js/narrative-runtime.js:450-453` filters every presentation option by `peekProp(state, pid).formulation.status === 'formulated'`.
- `narrative/missions/M9.json:519-528` defines P7 branch; `narrative/missions/M9.json:289-297` gates node on P6 only.
- `node test/narrative-lint.js` output: `.audit/tp-gameplay-extra-gates.log:1-3` reports `P7.formulation.status` read-before-write and `narrative-lint: PASS (7 checks, 1 warnings)`.

**Suggested fix**: Decide whether P7 is playable content. Add one authored mission effect `{ "proposition": "P7", "to": "formulated" }` plus its intended objective path, or delete the P7 presentation branch and remove its known-open allowlist entry.

### 2. Town and woods contain walkable tiles disconnected from every walkable route

**Severity**: P2 (collision/topology flaw; cells are inaccessible rather than progression-blocking)

**Where**: `js/maps.js:24-31,59-64,248-274`; town cell `(1,3)` and woods cells `(11,20)` and `(17,20)`. Repro: run `node test/level-autopsy.js`, then inspect reported isolated coordinate `(1,3)`; an all-map BFS likewise finds the two woods cells as one-cell components.

**What**: The collision table treats `.`/`g` as walkable, but these cells are enclosed by solid `T`/`w`/`n` tiles and form separate one-cell components. Expected behavior: every walkable cell should be reachable, or these cells should be solid/decorative. Current state leaves false walkable collision holes in map topology.

**Evidence**:

- Read-only `node test/level-autopsy.js` uses `GAME.maps.SOLID` and BFS (`test/level-autopsy.js:11-12,51-57`) and reports `.audit/tp-gameplay-extra-gates.log:165`: `C2 RAGGIUNGIBILITÀ da 12,21 : calpestabili 1384 raggiunti 1383 !! 1 TILE ISOLATI`.
- Same output identifies `.audit/tp-gameplay-extra-gates.log:209-214`: `1,3 char="."`; adjacent cells are `(0,3)=T`, `(2,3)=w`, `(1,2)=w`, `(1,4)=w`.
- `js/maps.js:62` defines town row 3 with `.` at x=1; `js/maps.js:24-31` leaves `.` non-solid.
- Independent read-only component scan of `GAME.maps.maps` reports `town components 1,1383` and `woods components 1,1,113`; isolated woods cells are `[[11,20,"g"]]` and `[[17,20,"g"]]`. `js/maps.js:273` confirms both `g` tiles sit in the enclosed spawn-border row.

**Suggested fix**: Change isolated `.`/`g` cells to solid map characters, or connect them to intended paths; rerun map reachability validation after changing rows.
