# World Builder M7 — door gating and cast placement editing

Branch `qwen/night-world-builder-m7-gating-cast`, from main `b124584` (worktree `.worktrees/m7`). Not pushed.

**Status: COMPLETE.** Both parts are done.
- **Part A:** door gating fields and PAIRED ↔ ONE-WAY conversion in the Builder. Both export as the ordinary `upsert`.
- **Part B:** move a PLACED body (map, x, y, facing) inside an existing window or baseline. It exports a `cast-windows-changeset`, or a `world-builder-bundle` when connections changed too. `tools/world-apply.js` applies connections, cast, or a bundle in one atomic run.

**The one thing to read first:** every coordinate Truman has is also recorded in a V6 transition (C3.1–C3.3, C10.1, C10.4). A move of Truman therefore always fails the apply, and `--repin` does not help, as the brief requires. Case 13 shows this. Bodies that no transition records move end to end: Lucy, Ben Horne, Gerard, Ronette, Leland in `ACT5_LELAND_STATION`, and Bob. See Limitations.

## What changed

| File | Change |
|---|---|
| `js/editor/core/edit.js` | `setDoorField`, `planOneWay` / `toOneWay`, `planPaired` / `toPaired`, `DOOR_KEYS`. No new op and no new changeset version. |
| `js/editor/core/cast.js` (new, game-free) | Cast store over every PLACED placement, `placeBody`, `arrowDir`, `sameWhenConflicts`, `buildCastChangeset`, strict `applyCastChangeset`, `castDataWithDraft`, `placementErrors`, `splitChangesets`, `buildBundle`. Registered in `js/editor/core/index.js`. |
| `js/editor/apply/cast-write.js` (new, node-only) | Pin and transition prediction against the new cast data (same resolver, same `when` evaluator), `occupancy`, `pinLines` (fixture line numbers), `repinText` (only those lines may change), `auditAppend` / `auditLine`. |
| `tools/world-apply.js` | Accepts a connections changeset, a cast changeset or a bundle. The cast part boots the narrative runtime + `GAME.CastPresence` like `test/cast-continuity-validate.js`. New flag `--repin`. Rollback covers up to seven files. Connection output is unchanged from M6. |
| `js/world-builder-data.js` (bridge) | `castForSeed(G, seed, castData?)` resolves over the cast draft and returns `owner`. New `castContext(G, triggerAt)`: walkability via `GAME.Maps.isSolid` with no clues, legacy map doors, draft trigger tiles. |
| `js/world-builder.js`, `world-builder.html` | DOOR fields, CONVERT TO ONE-WAY / CONVERT TO PAIRED with a confirm step, npc MOVE / REVERT BODY, arrow-key facing, a facing tick on npc markers, one undo stack over `{conn, cast}`, bundle export. |
| `test/editor-runtime-isolation.js` | The UI-usage scan now blanks string literals and ignores `window` used as a data field (`op.window`, `{ window: id }`). A cast *window* is not the browser global. A self-check proves real `window` / `document` usage is still caught. |
| `test/world-builder.js` | API pin gains `castContext` (110/110). |
| Tests | `test/editor/edit.js` 101→129; `test/editor/cast.js` new, 54; `test/world-apply.js` 72→91; `test/world-apply-cast.js` new, 47; `test/world-builder-browser.js` 99→153; `test/editor-runtime-isolation.js` 6→7. |
| CI | Two new steps (`test/editor/cast.js`, `test/world-apply-cast.js`). 27 node steps. |

Nothing under `js/retro*.js`, `js/tiles.js`, `js/maps.js`, `js/cast-presence.js` or `narrative/missions/` changed (`git diff main --stat` on those paths is empty).

## Part A — door gating and direction

**Door fields.** In EDIT, the selected endpoint shows `needsFlag`, `blockedMsg` and `needsClues`, but only if that endpoint owns at least one trigger. A one-way arrival (b) shows `— (no trigger on this endpoint)`.
- Clearing an input removes the key.
- Clearing the last key removes `door`; when nothing else changed, the draft returns to the base.
- `needsClues` must be an integer ≥ 1. `needsClues 0` is refused in the Builder, and by the runtime validator verbatim on apply: `a.door.needsClues must be a positive integer`.

**PAIRED → ONE-WAY.** The conversion keeps the source's triggers and the arrival's spawn.
- **Dropped fields:** the source's spawn, the arrival's triggers, and the arrival's `door` and `departureReaction` (the runtime forbids both on a trigger-less endpoint). All are listed before CONFIRM.
- **Choice of source:** if the side that would lose its triggers has more than one, the Builder refuses until the author picks which endpoint stays the source: SOURCE A, or SOURCE B, which swaps the sides.
- **Interpretation:** the brief's "picks which becomes a's trigger" is read as picking the source side, not a single tile.

**ONE-WAY → PAIRED.** CONFIRM stays disabled until the author places both missing pieces:
- a.spawn: PLACE A SPAWN, plus a facing select that defaults to the interior facing;
- one b trigger: PLACE B TRIGGER, which switches to b's scene.

Nothing is defaulted.

Every conversion is a draft edit, so undo, redo, REVERT and the M5 validation apply as usual. Export is one `upsert` naming `a,b`; `world-apply` validates the result with the runtime rules and leaves the catalog untouched.

## Part B — cast placement

**Scope.** Only `map_id`, `x`, `y`, `dir` of a PLACED placement inside an existing window or a baseline can move.

Everything else stays hand-authored per `docs/cast-presence-authoring.md`, and the tool refuses it:
- windows, `when`, OFFSCREEN / TERMINAL_REMOVED, dialogue, `actor_ids`;
- an op with any other field;
- an unknown window;
- a non-PLACED body.

**Builder.**
- **Inspector:** STORY MOMENT resolves the cast over the cast draft. Selecting `npc:<char>:<scene>` shows SOURCE as `window <id> · owner <owner>` or `baseline (<class>)`.
- **Moving:** in EDIT, MOVE arms a tile pick on the current scene, and arrow keys set the facing.
- **Refusals:** a tile is refused with a message when:
  - it is not walkable;
  - it is a door trigger (a draft registry trigger or a legacy map door);
  - another resolved body stands on it at the chosen moment.

  The pick stays armed after a refusal, and Escape disarms it.
- **Same-`when` conflict:** MOVE is disabled, with the reason, when another window with the same `when` places the body elsewhere (V2). No real body is in that state; the core test proves it.

### Changeset and bundle schema

```json
{ "format": "cast-windows-changeset", "version": 1, "target": "narrative/cast/windows.json",
  "operations": [ { "op": "place", "window": "<window id>|baseline", "character": "<id>",
                    "map_id": "sheriff", "x": 3, "y": 6, "dir": "down" } ] }
```

```json
{ "format": "world-builder-bundle", "version": 1,
  "changesets": [ { "format": "world-connections-changeset", "version": 2, "...": "..." },
                  { "format": "cast-windows-changeset", "version": 1, "...": "..." } ] }
```

**Rules:**
- Operations are only the bodies that differ from the base, sorted by window then character. A second op on one (window, character) is refused.
- A bundle holds at most one changeset per target, never a nested bundle, and never an empty list.
- The Builder exports a bare changeset when only one side changed, and a bundle when both did.
- A connections changeset without `format` (M4b v1) is still accepted.

### Apply rules (`tools/world-apply.js`)

Before anything is written, the tool checks:
1. **Strict apply:** `Editor.cast.applyCastChangeset`. A refusal exits 2.
2. **Tiles:** the map exists, the tile is walkable with no clues, and it is not a door trigger of the resulting registry or a legacy map door.
3. **Occupancy:** on every pin story moment where the moved body resolves through the edited window, no other PLACED body may stand on its tile.
4. **Same-`when` overlap:** refused.
5. **V6 transitions,** resolved against the new data: any disagreement fails the run, with or without `--repin`. Transitions are never repinned.
6. **V5 pins,** resolved against the new data. A disagreement fails the run and prints one line per entry:
   ```
   PIN test/fixtures/cast-pins-acts-1-4.json:1046  "benhorne": "hotel_gn@5,7",  ->  "hotel_gn@6,7"  (ACT1_TOWN, resolves hotel_gn@6,7 down [BASELINE])
   ```
   The `windows.json` diff is always printed after BEFORE/AFTER, even when the run fails.

**`--repin` rules:**
- **What is rewritten:** exactly the (pin, character) entries that disagree, and only when all three hold:
  - the character was moved by this changeset;
  - the pin uses a map form (`map@x,y` or `map`);
  - the body is still PLACED.

  The new value keeps the pin's form.
- **Refused as unrelated:** a disagreement on any other character, or on an OFFSCREEN / TERMINAL_REMOVED pin. It fails the run.
- **Verified rewrite:** `repinText` rewrites the fixture as 1-space JSON and refuses if any line other than a repinned entry would change.
- **Audit record:** one line per moved body is appended to `artifacts/world-character-audit/cast-windows-acts-1-4.md` under `## Builder change record`. The heading is created at the end of the file on first use; later lines go under the same heading. Example:
  `- 2026-09-14 · window baseline (PERSISTENT) · benhorne · hotel_gn@5,7 down → hotel_gn@6,7 down · pins ACT1_TOWN, … · changeset ben-move.json`
- **Preview:** `--dry-run --repin` prints the REPIN and AUDIT lines and writes nothing.

**Write order:**
1. registry → `gen-world-data` → catalog → catalog test (if connections changed);
2. `windows.json` → `gen-narrative-data`;
3. pins → audit (if repinning);
4. `cast-continuity-validate`.

Any failure restores every written file from the pre-run bytes and prints `ROLLED BACK <files> (byte-identical to the pre-run copy)`. Exit codes: 0 ok / no-op, 1 problem or rollback, 2 usage or refused changeset.

## Proof

### Node

| Test | Result | What it covers |
|---|---|---|
| `test/editor/edit.js` | 129 | Door field set / clear / refusals, one-way plan with dropped-field list, two-trigger choice, source swap, paired placement refusals, round-trip, history. |
| `test/editor/cast.js` | 54 | Store over PLACED only, refusals (TERMINAL_REMOVED, OFFSCREEN, no baseline, unknown window or character), same-`when` refusal, strict changeset, key order kept, the real `windows.json` changing exactly one line, tile errors, bundle split. |
| `test/world-apply.js` | 91 | M6 cases plus M7 Part A on a temp copy: needsClues apply and clear (bytes restored), needsClues 0 refused, to one-way (catalog untouched, legacy-door inventory green), back to paired (bytes restored), hand-edited half-conversions refused. |
| `test/world-apply-cast.js` | 47 | On temp copies: Ben Horne baseline move fails with 24 exact pin lines; `--dry-run --repin` preview; `--repin` apply with the validator green inside the tool and after; exactly one `windows.json` line, 24 pin lines and one audit line change; the transitions fixture is untouched; a second run is a NO-OP; moving back restores bytes and adds a second audit line; Truman fails on V6 with and without `--repin`; refusals (Audrey's tile, the station door 7,11, a wall, an OFFSCREEN body, a `when` field, an unknown map, a foreign target); rollback on an injected validator or generator failure (4 files); bundle dry-run; bundle rollback on an injected catalog failure (7 files) and on an injected cast failure after the connections part was written; bundle apply; two cast changesets in one bundle refused. |

### Browser

`node test/world-builder-browser.js` passes 153/153. Screenshots are in `artifacts/world-builder-m7/`:

| Case | Evidence |
|---|---|
| 11 — door fields, to ONE-WAY | `case11-door-fields.png`, `case11-convert-one-way.png`, `case11-one-way.png`, `case11-pick-source.png`, `case11-changeset.json`, `case11-dry-run.txt` (VALID 15, catalog unchanged) |
| 12 — to PAIRED | `case12-a-spawn-placed.png`, `case12-b-trigger-placed.png`, `case12-paired.png`, `case12-changeset.json`, `case12-dry-run.txt` (VALID 15) |
| 13 — move Truman at ACT3_TRAINCAR_REPORT | `case13-truman-view.png`, `case13-truman-moved.png`, `case13-export.png`, `case13-changeset.json`, `case13-dry-run.txt` |
| 14 — onto Lucy refused | `case14-refused-lucy.png` |
| 15 — onto the door and a wall refused; bundle | `case15-refused-door.png`, `case15-bundle-export.png`, `case15-bundle.json`, `case15-dry-run.txt` |

**Case 13 detail.** The dry-run diff is a single hunk: `@@ line 660  - "x": 9,  + "x": 10,`, inside `ACT3_TRUMAN_REPORT`. The run then exits 1: V6 C3.1/C3.2/C3.3 expect `traincar@9,8`, and the 4 pin lines are listed.

**Case 15 detail.** The bundle carries a `needsFlag` on `sheriffs-station-front-entrance` plus Lucy's baseline moved to 3,6. `--dry-run --repin` exits 0 with 24 REPIN lines.

### Gates on the branch

| Gate | Result |
|---|---|
| `node test/smoke.js` | 415 |
| `node test/walkthrough.js` | 85 |
| `node test/world-builder.js` | 110/110 |
| `node test/world-door-equality.js` | PASS (59 descriptors) |
| `node test/legacy-door-inventory.js` | sources=0 live=0 shadowed=0 conflict=0 |
| `node test/migrated-door-traversal.js` | 45 |
| `node test/act-3-flow.js` | 280/280 |
| `node test/act-4-flow.js` | 1611/1611 |
| `node test/cast-presence-sync.js` | 232/232 |
| `node test/cast-continuity-validate.js` (real repo) | V1–V8, RC, terminal lint all PASS |
| `node test/editor-runtime-isolation.js` | 7 |
| editor core suites (changeset 32, history 19, hit-test 14, identity 51, inspector 30, interaction 31, model 8, world-builder-core 27) | pass |
| `node test/world-engine-v0.1-catalog.js`, `test-world-registry.js`, `location-connections.js`, `apply-changeset.js`, `editor-apply-preflight.js` | pass |
| Chrome `node test/world-builder-browser.js` | 153/153 |
| Chrome `node test/act-3-playthrough.js --path=all` | 189/189 (1 console error: the same 404 as the committed run) |
| Chrome `node test/act-4-playthrough.js --path=all` | 530/530 (1 console error: favicon.ico 404) |

**Hashes.** At the end, these files are byte-identical to main (sha256): `world/connections.json`, `narrative/cast/windows.json`, `test/fixtures/cast-pins-acts-1-4.json`, `test/fixtures/cast-transitions-acts-1-4.json`, `js/narrative-data.gen.js`, `artifacts/world-character-audit/cast-windows-acts-1-4.md`, `js/world-catalog.js`.

**Regenerated artifacts.** The Chrome drivers regenerate tracked artifacts (`artifacts/world-builder-m6/` cases 1–10, `artifacts/act-3-closure/`, …). Those were restored with `git checkout`, not committed.

## Limitations

1. **Transition-bound bodies cannot move.** V6 records pin exact coordinates for most windowed and moving bodies: Truman, Hawk, Audrey, Jacques, the guards, Maddy, Leland in the diner, the Roadhouse crowd, and the baselines that transitions start from. Moving any of them fails the run, and by rule that failure is not repinnable. Today the Builder can only *propose* such a move; applying it needs a hand edit of `test/fixtures/cast-transitions-acts-1-4.json`.
2. **Audit lines are written only with `--repin`** (as specified). A move that disagrees with no pin writes no change record. Examples: Leland in the Act 5 window, which no pin covers, or a facing-only change.
3. **Occupancy is checked on the 24 pin moments** in the tool, and on the chosen moment in the Builder. A window that is also live in an unpinned state (Act 5) is not checked there.
4. **Walkability assumes no clues held.** It is the same state the door validator uses for spawns, so an `X` barrier tile counts as solid.
5. **MOVE keeps the body on its current scene.** The changeset and the tool accept a different `map_id`, but cross-map moves were not exercised, and they interact with V5b scene-required presence; the validator run would catch that and roll back.
6. **V5b, V6b and V8 are not predicted before writing.** They run in `cast-continuity-validate` after the write, and a failure rolls back. Only V5 and V6 are predicted, so they can be printed as exact lines.
7. **Door field values are not checked against known flags or messages.** `needsFlag` and `blockedMsg` are any non-empty string, which is the runtime rule.
8. **The Builder does not install the narrative value catalogs.** This is unchanged since M4b, while the tool does install them, as the validator does.

## Recommended M8

- **Transition-aware moves.** When a moved body is recorded in V6 records, show those records in the inspector before MOVE. Offer an explicit, reviewed `--retransition` that rewrites only the `from`/`to` of those records when the move keeps the same map and the same authored page (V6b unchanged). Transitions would still never change silently.
- **Moment coverage.** Run the occupancy and pin checks over every reachable seed the validator knows (V1's state enumeration), not just the 24 pins, so Act 5 windows are covered.
- **Cross-map MOVE** with a V5b preview (which nodes need the body on its old map), then window creation as a separate, still-guarded step.

## Commits

- `277cbbe` feat(world-builder): M7 part A — door gating fields and PAIRED <-> ONE-WAY conversion
- `d49204e` feat(world-builder): M7 part B — cast placement editing and world-builder bundles
- docs(reports): this report
