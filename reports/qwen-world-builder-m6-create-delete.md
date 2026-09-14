# World Builder M6 — create and delete connections from the Builder

Branch `qwen/night-world-builder-m6-create-delete`, from main `569267c` (worktree `.worktrees/m6`). Not pushed.

**Status: COMPLETE.** All three phases are done.
- **Create:** pick two tiles on the canvas, confirm, export, then `node tools/world-apply.js <file>`.
- **Delete:** select an endpoint, click DELETE CONNECTION, confirm, export, apply.
- **Catalog:** in both cases `js/world-catalog.js` is rewritten in the same run. It stays bijective with `world/connections.json` without any hand edit.

## What changed

| File | Change |
|---|---|
| `js/editor/core/edit.js` | **Changeset v2.** New functions `createConnection`, `deleteConnection`, `newConnection`, `spawnInFront`, `interiorFacing`, `suggestId`, `idErrors`, `claimConflicts`, `isCreated`, `isDeleted`. `reapply` accepts v1 and v2. `validateDraft` gains the `created` and `draft` options. Still game-free. |
| `js/editor/core/changeset.js`, `js/editor/apply/changeset-apply.js`, `js/editor/core/validation.js` | `create` and `delete` added to all three, kept in lockstep. `create` never overwrites an existing record. |
| `js/editor/apply/catalog-write.js` (new) | Surgical text rewrite of the catalog's `connections: [...]` arrays, verified by evaluating the result in a vm. |
| `tools/world-apply.js` | Applies `create`/`delete` and writes the catalog. The write is atomic across 3 files with rollback. Adds the reference guard, the legacy-door guard and the claimed-tile check. Boots `<root>/js` strictly, in index.html order. |
| `js/world-builder-data.js` (the bridge) | New predicates `catalogHasId`, `sceneLocation`, `legacyDoorAt`. |
| `js/world-builder.js`, `world-builder.html` | New buttons NEW CONNECTION, DELETE CONNECTION (with a confirm step) and REDO. Ctrl+Shift+Z / Ctrl+Y redo. The validation panel lists draft ops. |
| `test/world-engine-v0.1-catalog.js` | Catalog membership is now derived from the catalog file instead of pinned lists. It adds a check that each id is listed **exactly** in its endpoint locations. This lets the test pass on a repo copy after an apply. |
| `test/gen-world-data.js` | The "exactly 15 records" pin is removed. The exact 15-id set is still pinned in `test/test-world-registry.js`. |
| Tests | `test/editor/edit.js` 51→101, `test/editor/changeset.js` 12→32, `test/world-apply.js` 35→72, `test/catalog-write.js` (new, 39), `test/world-builder-browser.js` 54→99. |
| CI | New step `node test/catalog-write.js`; step labels updated. 25 node steps. |

## Changeset schema v2

```json
{ "format": "world-connections-changeset", "version": 2, "target": "world/connections.json",
  "operations": [
    { "op": "upsert", "id": "<existing>", "endpoints": ["a","b"], "connection": { "id": "...", "a": {}, "b": {} } },
    { "op": "create", "id": "<new>", "connection": { "id": "<new>", "one_way": true, "a": {}, "b": {} } },
    { "op": "delete", "id": "<existing>" }
  ] }
```

**Version rules:**
- A missing version means version 1.
- Version 1 allows `upsert` and `remove`. Version 2 allows `upsert`, `create` and `delete`.
- Using an op outside its version is refused, with a hint (`use delete` or `needs version 2`).

**Rules for `create`:**
- The id must be kebab-case: `^[a-z0-9]+(-[a-z0-9]+)*$`.
- The id must be absent from the registry. The tool also checks that it is absent from the catalog, and the Builder checks the draft as well.
- `connection.id` must equal `id`.
- The keys must be exactly `id`, optional `one_way`, `a` and `b`.
- The record must follow the M5 one-way rules: a one-way `a` has no spawn, and a one-way `b` has no triggers.
- Every map rule comes from `GAME.LocationConnections.validateConnection`, and its messages are kept verbatim.

**Rules for `delete`:** the id must exist in the registry.

**Rules for any changeset:** only one op per id. A trigger tile claimed by two records is an error; there is no first-match-wins.

**Export:** the Builder always exports version 2, with ops sorted by id. Deleting a record that was created in the same draft exports nothing.

## Catalog write rules (`tools/world-apply.js` + `catalog-write.js`)

1. **Scene resolution.** Each endpoint scene resolves to its catalog location through `environments[].sceneId`.
   - It must match exactly one location.
   - With 0 matches, the run fails and lists every location with its scenes, so the author picks one: `scene "x" has no catalog location; add it to a location in js/world-catalog.js first. Locations: double-r (double_r_exterior_prototype, diner); town (town); …`
   - With 2 or more matches, the run fails as "ambiguous".
   - There is no guessing.
2. **Create.**
   - The id is appended as `, '<id>'` before the closing `]` of each endpoint location.
   - It is added once if both endpoints share a location.
   - The run fails if the id is already listed anywhere in the catalog.
3. **Delete.**
   - `'<id>'` is cut together with its separating comma from each endpoint location.
   - The run fails if the id is listed somewhere other than exactly those locations.
4. **Rewrite safety.**
   - An array holding anything other than quoted ids (a comment, an expression) is refused: "edit it by hand".
   - Every rewrite is evaluated in a vm, and the membership of **every** location must equal the plan.
5. **Round trip.** Create followed by delete restores the original bytes, which the tests assert.
6. **Delete guards.**
   - **Legacy door:** the run fails if any trigger tile of the record holds a legacy door, meaning a booted door with no `connectionId`. There are none after M5, but the guard stays.
   - **References:** the run fails if the id appears as a whole token in any file under `js/`, `test/` or `narrative/`. `js/world-catalog.js` and the generated `js/world-connections.gen.js` are exempt. The failure lists the files: `REFUSED delete town-roadhouse: referenced by N file(s) … test/world-builder-browser.js …`.
   - A version-1 `remove` goes through the same guards.
7. **Order and atomicity.**
   - First everything is validated: reapply, validator on all records, claimed tiles, legacy doors, references, and the catalog plan.
   - Then the writes run in order: write `world/connections.json`, run `test/gen-world-data.js`, write `js/world-catalog.js`, run `test/world-engine-v0.1-catalog.js` in `<root>`.
   - Any failure restores all three files from the pre-run bytes, prints `ROLLED BACK … (byte-identical to the pre-run copy)`, and exits 1.
8. **`--dry-run`** prints `CREATE`/`DELETE` lines, TARGET/BEFORE/AFTER per endpoint, `VALID n record(s)`, and then the catalog diff as `@@ line N` with `-`/`+` lines.
9. **Exit codes:** 0 for ok or no-op; 1 for validation failure, refused delete or rollback; 2 for usage errors or a changeset refused by reapply.

## Builder UI

**NEW CONNECTION** (EDIT mode):
1. Click a tile in any scene to set trigger a.
2. Switch scene if needed and click a tile to set b.
3. Choose PAIRED or ONE-WAY. On a one-way record, b takes no trigger; the clicked tile only positions its spawn.
4. The id is prefilled as `<sceneA>-<sceneB>` (underscores become hyphens) and can be edited.

Details of the create panel:
- **Default spawns:** each spawn defaults to the tile in front of its trigger, one step away from the nearest map edge, facing the interior. On a tie the vertical axis wins; that rule is written in the code.
- **MOVE SPAWN:** the candidate's spawns can be moved before confirm.
- **Live validation:** the candidate is checked as you edit — id format and uniqueness (registry, draft, catalog), a catalog location for both scenes, two different scenes, the runtime validator, claimed tiles and legacy doors. CONFIRM stays disabled while it is invalid.
- **On confirm:** the record enters the draft store and history, and shows on the canvas at once. The inspector marks it `new (create)`.

**DELETE CONNECTION:**
- It appears on any selected endpoint or trigger in EDIT mode.
- A confirm box explains the catalog removal and the reference guard.
- After confirm, the record leaves the canvas; its original is drawn dimmed.

**History:** undo and redo work through `Editor.history`, and the export is version 2. The header still reports `legacy doors 0`.

## Browser cases (`node test/world-builder-browser.js` → 99/99)

Screenshots are in `artifacts/world-builder-m6/`. Cases 1–7 are the M4b/M5 cases, re-run on this branch, with their screenshots written to the same folder.

**Case 8 — create a paired connection, town 30,9 ↔ hospital 14,9, id `town-hospital-side-door`.**
- The prefilled id `town-hospital` collides with the registry, so CONFIRM is disabled. A non-kebab id is flagged.
- After the id is edited, the record is valid. The candidate's spawn b is moved to 12,9.
- Confirm puts the record in the draft. Undo removes it and redo brings it back.
- Both scenes show its items. The export is a v2 `create`.
- `world-apply --dry-run` prints `VALID 16 record(s)` and the town + hospital catalog diff.
- Screenshots: `case8-id-collision.png`, `case8-create-confirm.png`, `case8-created-town.png`, `case8-created-hospital.png`, `case8-export.png`.
- Files: `case8-changeset.json`, `case8-dry-run.txt`.

**Case 9 — create a one-way connection, town 34,9 → hospital 1,9.**
- The candidate offers MOVE SPAWN for b only.
- The inspector shows `ONE-WAY town → hospital`. a has no spawn item and no MOVE SPAWN; b has no ADD TRIGGER.
- The export is a v2 `create` with `one_way`.
- Screenshots: `case9-create-one-way.png`, `case9-one-way-source.png`, `case9-one-way-arrival.png`.
- File: `case9-changeset.json`.

**Case 10 — delete on a temp repo copy** (js/ test/ world/ narrative/ index.html world-builder.html, with assets symlinked).
- Case 8's changeset is applied for real with `--root=<copy>`.
- A second server serves the copy's Builder, which shows the record from the registry.
- DELETE CONNECTION opens the confirm box. CANCEL keeps the record; CONFIRM DELETE removes it. Undo and redo both work. The export is a v2 `delete`.
- `world-apply --root=<copy>` deletes the record and prints the catalog diff and the catalog check.
- On the copy, `node test/world-engine-v0.1-catalog.js` and `node test/legacy-door-inventory.js` both pass.
- The copy's registry, gen and catalog are byte-identical to their state before the create.
- The real repo's `world/connections.json` and `js/world-catalog.js` hashes are unchanged.
- Screenshots: `case10-before-delete.png`, `case10-delete-confirm.png`, `case10-deleted.png`, `case10-export.png`.
- Files: `case10-apply-create.txt`, `case10-apply-delete.txt`, `case10-copy-checks.txt`.

## Gates (real repo)

| Gate | Result |
|---|---|
| smoke | 415 |
| walkthrough | 85 |
| world-builder | 110/110 |
| world-door-equality | PASS (59 descriptors) |
| legacy-door-inventory | 0 / 0 / 0, booted 59, unowned 0 |
| migrated-door-traversal | 45 |
| act-3-flow | 280/280 |
| act-4-flow | 1611/1611 |
| cast-presence-sync | 232/232 |
| act-4-playthrough --path=all (Chrome) | 530/530 (only console error: favicon 404, same as main) |
| world-builder-browser (Chrome) | 99/99 |
| editor/edit | 101 |
| editor/changeset | 32 |
| editor history / hit-test / identity / inspector / interaction / model / world-builder-core | 19 / 14 / 51 / 30 / 31 / 8 / 27 |
| world-apply | 72 |
| catalog-write | 39 |
| apply-changeset | 14 |
| editor-apply-preflight | 9 |
| editor-runtime-isolation | 6 |
| test-world-registry | PASS (15) |
| world-catalog-coverage | 15 |
| world-engine-v0.1-catalog | PASS |
| location-connections | PASS |

Whole-suite exit codes, every `node test/*.js` except the 7 Chrome drivers:

Main (`569267c`) ran 117 tests and this branch ran 118. Exit codes are identical for all 117 shared tests. The one extra test is the new `test/catalog-write.js`, which passes. 33 tests exit non-zero on both, unchanged; for example sheriffs-station-location, character-life, station-population and act-2-flow.

## Known limitations

- **Missing fields on new records.** The Builder cannot author door fields (`needsFlag`, `blockedMsg`, `needsClues`) or `departureReaction`. They have to go through the JSON. A new door is ungated.
- **Paired/one-way toggle.** It exists only before confirm. An existing record cannot be converted.
- **Default spawn.** It is purely geometric, with no walkability look-ahead. An unwalkable default shows up as a live error until MOVE SPAWN fixes it. Facing is only editable after confirm, through FACING.
- **Catalog locations.** The Builder cannot add catalog locations or environments. A scene outside the catalog cannot take a new connection; the error says so and lists the locations.
- **Reference guard.**
  - Every current registry record is referenced by tests, so in practice only newly created records can be deleted.
  - Ids in comments count as references. The browser test assembles its ids at runtime for that reason.
  - `docs/`, `reports/` and `artifacts/` are not scanned.
- **Guards the Builder cannot run.** The reference guard and the "listed elsewhere in the catalog" check run only in `tools/world-apply.js`. A Builder export can therefore still be refused at apply time.
- **Emptying a location.** Deleting a location's last connection leaves `connections: []`. If the world engine rejects that, the catalog check fails and the run is rolled back.
- **Outdoor spawn rule.** "Row ≤ 23 outdoors" is not enforced for new records. The case 8 and 9 town spawns are on row 10.
- **`test-world-registry.js` fails on a copy after a create.** It pins the real repo's 15 ids, so this is expected; `test/world-apply.js` asserts that it notices.
- **Behaviour change in world-apply.** `tools/world-apply.js` now boots `<root>/js`; before, it always booted this repo's `js/`. Every file in the chain must load; there is no longer a silent `try` per file.
- **Carried over from M5.** The finale override of the redroom 8,11 door still drops `connectionId` at runtime.
- **Base commit.** Main has moved to `efb064d` (a CANONICAL-SYNC log commit). This branch starts at `569267c`, as the brief asked.

## Recommended M7

Door gating and direction on records in the Builder:
- `needsFlag`, `blockedMsg` and `needsClues` fields in both the NEW CONNECTION panel and the inspector, validated with the runtime rules;
- a paired ↔ one-way conversion on existing records, with the M5 shape rules applied;
- a facing picker on candidate spawns.

With these, a real gated door such as `town-hospital` can be authored end to end with zero hand edits.
