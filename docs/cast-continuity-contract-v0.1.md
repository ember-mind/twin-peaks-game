# Cast Continuity contract v0.1 — where the named cast is, as authored world state

Date: 2026-09-11. Status: **architecture + authoring contract, frozen for the implementation pass. Not implemented.** Amends `docs/world-character-architecture-audit.md` (see its "Amendment" section). Migration truth tables: `artifacts/world-character-audit/cast-windows-acts-1-4.md`.

## 0. What this replaces

The audit v1 proposed a per-character **ordered rule list, first match wins**. That is rejected. If two location predicates for the same named character are true at once, the resolver does not have two candidates to choose from: the authored world is contradictory and the build must fail. Priority, rule order, "more specific wins", and fallbacks that hide an overlap are all forbidden.

## 1. Core principle

A persistent named character's physical location is part of the **authored world state of that story moment**. It is a projection of story state (what has happened) onto the world (where the people are as a consequence), but it is authored narrative truth, not a rendering detail.

For every reachable story state, every registry-owned named character resolves to **exactly one** of:

- one physical placement: `{sceneId, x, y, dir}` (optionally `dialogue`, `wander`, `facing`);
- explicit `OFFSCREEN` (alive, elsewhere, not shown; optionally with a label such as `patrol`, `at home, house dark`);
- explicit `TERMINAL_REMOVED` (dead, gone from the story; never returns).

Never zero by omission. Never more than one.

**Semantics (clarified 2026-09-11).** `OFFSCREEN` does NOT mean absent from story reality: it may mean physically present somewhere that is deliberately not represented as a body (Jacques alive in the guarded room, Hawk on patrol, Sarah asleep upstairs); the world may render it through traces (a guard, a register, a dark house, a line). `TERMINAL_REMOVED` means the named physical character can never return under the current story truth (dead, or gone from the story). Hiding a sprite is never a reason for `TERMINAL_REMOVED`.

## 2. Vocabulary

| term | meaning |
|---|---|
| **Story state** | flags, values, evidence, propositions, `nodes_done` — the Narrative System's state. Answers *what has happened*. |
| **Cast Continuity / World Cast State** | the authored answer to *where are the people as a consequence*. Authored as windows and changes; compiled to per-character predicates; resolved at runtime. |
| **Baseline** | the authored normal location of a character *outside explicit story movement* ("Truman is normally at the Sheriff's Station"). One per character, or explicit `OFFSCREEN` / `TERMINAL_REMOVED` baseline (Maddy before Act 4, Giant, BOB). A baseline is a truth, not a competing rule. |
| **Story window** | a span of story states with an ENTRY condition and an EXIT condition/transition, inside which a set of named characters is somewhere other than baseline. |
| **Cast change** | one authored move or removal: CAST BEFORE → EVENT/CAUSE → CAST CHANGE → CAST AFTER. |
| **Placement** | the resolved answer for one character in one story state. |
| **Registry** | the compiled, order-independent set of (character, predicate, placement) plus baselines. |

## 3. Resolution semantics (normative)

```
resolveCharacterPresence(characterId, storyState):
    matches = [w for w in windowsNaming(characterId) if w.predicate(storyState)]
    if len(matches) == 1: return matches[0].placement
    if len(matches)  > 1: HARD ERROR (overlap: contradictory authored world)
    if baseline(characterId) is defined: return baseline(characterId)
    HARD ERROR (no placement, no baseline: implicit absence)
```

- An explicit `OFFSCREEN` window counts as a real placement (it is a match, not a miss).
- `TERMINAL_REMOVED` is a window whose exit condition is never true (or a baseline for characters who exist only in one window).
- **Order-independent**: the registry is a set. Reordering entries, files, or missions must never change any resolved world. Implementation must not iterate "until first match".
- **Reachable states only**: mutual exclusion is required over the reachable story-state space (the flow harness enumeration + walkthrough seeds), not over the free boolean product of every flag. `atto4` implies `east_route_confirmed` in every reachable state, so a traincar window and a Roadhouse window for Truman are exclusive by reachability, not by an extra `¬atto4` clause.
- **Derived**: nothing about presence is persisted. `resolve(saved state) == resolve(live state)`.
- **Pure**: the resolver reads story state only; no clock, no player position, no previous resolution.
- **No silent vanish** (added 2026-09-11): a window may end only on an authored story event. A character may not leave a room the player is standing in when that event fires unless a visible authored beat (a page, a caption, the character's own line) carries the departure. A flag changing while Cooper stands in the Roadhouse does not send the town home; the room empties after Cooper has reached the authored threshold (`focus_destination`). The state that ends a window must therefore be one the player reaches *after* leaving the room, or one whose node authors the exit on screen.

Debug contract: `resolveCast(storyState)` returns, per character, the placement and the **window id** that produced it (or `baseline`). One table answers "where is everyone and why".

## 4. Authoring model — Cast Continuity windows

Cast Continuity is authored as **windows**, not as bags of per-character predicates. A window is the unit a writer thinks in ("the Roadhouse before the phone"). For every load-bearing story window:

```
WINDOW ID          ACT4_ROADHOUSE_PRE_PHONE
ENTRY              value_is presagio_status=active
EXIT / TRANSITION  value_set warning_target   (m8_roadhouse_phone)
CAST CHANGES       (only characters that differ from the previous window / baseline)
                   a PLACED placement may carry actor_ids: the mission actor ids this body answers to
                   when they differ from the character id (authored interaction reference, no alias table)
  truman   → roadhouse / truman_table     cause: the town gathers; he waits for Cooper
  hawk     → OFFSCREEN (patrol)           cause: sent out for the night (Lucy: "è di pattuglia")
  norma, shelly, bobby, donna, james, loglady → roadhouse   cause: the town gathers
  giant    → roadhouse / stage            cause: the statement (one-scene appearance)
  sarah, leland, maddy → palmer / OFFSCREEN per truth (the house; never at the Roadhouse)
EXPECTED RESULTING PRESENCE   the full relevant snapshot (the V5 pin table)
```

Rules:

- A window names only the characters whose placement differs from what the previous window or the baseline gives. The **expected resulting presence** is the full relevant snapshot and is what tests pin.
- Windows are keyed by story state (flags, values, `nodes_done`, evidence). Branch values (`warning_target`, `sarah_support_state`, `focus_destination`, `body_found_by`) split a window into sibling windows with disjoint predicates.
- For one character, every window that names them must be **pairwise exclusive over reachable states**. Two windows may overlap in time only if they name disjoint characters.
- Every window ends by **transition**: the EXIT condition is the story event that ends it, named. A character whose window ends returns to baseline *because the window ended* (fall-through to the authored baseline), never because a second flag hides them.
- A character who is "not here tonight" is an explicit `OFFSCREEN` entry in the window; a dead character is `TERMINAL_REMOVED`. "Missing from the sprite list" is not absence.
- Runtime may compile windows into per-character predicates (`entry ∧ ¬exit`); the compiled form must preserve window ids for debugging and must stay order-independent.

## 5. Location is story causality — cast change records

Every story beat that moves a named character records:

```
CAST BEFORE    hawk: traincar (north cut)          [window ACT3_TRAINCAR_REPORT]
EVENT / CAUSE  atto4 set: Act 4 sends Hawk on patrol
CAST CHANGE    hawk → OFFSCREEN (patrol)
CAST AFTER     hawk: OFFSCREEN                     [window ACT4_AFTERNOON ...]
RETURN / NEXT  hawk → town shore when the anonymous call dispatches him (body_found_by / maddy_trovata)
```

No animation or travel simulation is required. The causal transition must exist in the authored model: an unexplained teleport is a design defect (V6), whether or not it renders.

## 6. Authoring contract for narrative design

Add to `docs/narrative/templates/scene-contract.md` and `act-design.md` a small **CAST CONTINUITY** section, required **only** for beats that change a named character's physical presence:

```
CAST BEFORE        who is where (only the characters this beat touches)
CAST MOVES / REMOVALS
CAST AFTER
CAUSE              the event in this beat that moves them
RETURN / NEXT STATE   which later event ends the move (the window's EXIT)
```

Beats where nobody moves carry no section. The act design's §9 (environment brief pointers) lists the act's windows by id; the scene contract of the beat that opens a window carries the change record. The freeze report lists the act's window table as the migration truth for the implementation pass.

## 7. World-building contract

Location and environment briefs that involve persistent named characters must state:

```
BASELINE CAST            who is normally here (registry baselines resolving to this location)
TEMPORARY STORY WINDOWS  window ids that bring someone here or take someone away
EXPECTED ABSENCES        who is not here during those windows, and why (rendered how: dialogue, empty chair, nothing)
INGRESS / EGRESS CAUSE   the story event that brings each temporary body in and out
RETURN / NEXT WORLD STATE   what the place looks like after the window ends
```

Population is part of world building, decided with the brief, not added after visual production. Background NPCs (LOCAL BACKGROUND, EPHEMERAL CROWD) are listed as a count and a style, never as cast entries.

## 8. Runtime architecture (thin, derived)

- Owner of named physical presence: the **Cast Presence** layer (`js/cast-presence.js` + compiled registry). Missions and the world cast file contribute windows; nothing else places a named body.
- Map population = background `NPCS` (ids not owned by the registry) + registry placements resolved to that scene. Hook where `syncNarrativeEntities` already runs (map load, `setState`, every commit).
- The `when` grammar (`COND_KEYS`) is reused for predicates; the narrative validator validates them.
- Contract: `resolveCharacterPresence(characterId, storyState)` → one authored answer, per §3. It must **not** "select the best matching placement".
- `interact()`, dialogue cascades, mission preemption per (map, actor), Character Life, Ambient Life, World Engine v0.1, save format: unchanged. Life after presence.
- Classes: PERSISTENT NAMED (registry, baseline required); STORY-BOUND NAMED (registry, baseline `OFFSCREEN` or `TERMINAL_REMOVED`, windows only: Giant, Jacques, Maddy); LOCAL BACKGROUND and EPHEMERAL CROWD (outside the registry, no cross-map identity, no uniqueness rule).

## 9. Hard validators

| id | rule | gate |
|---|---|---|
| **V1 exactly one presence** | for every registry character in every seeded reachable state, resolved count == 1 (`OFFSCREEN`, `TERMINAL_REMOVED` count as explicit states) | hard |
| **V2 zero overlaps** | matching explicit windows per character per reachable state ≤ 1; any overlap fails the build | hard |
| **V3 no implicit absence** | a character with no matching window and no authored baseline is an error; `OFFSCREEN` is never inferred from missing sprite data | hard |
| **V4 order independence** | shuffle registry/window/rule order (several seeds); resolution identical for every state; otherwise the architecture is invalid | hard |
| **V5 world window pins** | for every load-bearing window, assert the whole relevant cast snapshot, not one NPC (tables in `cast-windows-acts-1-4.md`). **V5b scene-required presence**: every mission node with an `actor_id` naming a registry character must resolve that character to the node's `map_id` in every state where the node's conditions hold; every page whose text asserts a named character's presence in the scene (a pin list per act) must agree | hard for rows present |
| **V6 causal transition** | for every authored move: a reachable predecessor state resolves to the old placement, the transitioning event/state resolves to the new one, and the change record exists; no unexplained teleport. **V6b no silent vanish**: for every placement change (a window exit, or a window entry that moves a character off their previous placement) whose setting node has a `map_id`, the departing character must either not be placed on that map, or the window must be marked `exit_authored_by: <page id>` / `entry_authored_by: <page id>` naming the page that shows the departure; the page must exist in the mission, in a node on that map | hard |
| **V7 single body owner** | no registry character id in classic `NPCS`, adapter `NARRATIVE_ENTITIES`, or manual environment rendering | hard |
| **V8 save determinism** | `resolve(snapshot(state)) == resolve(live state)` for every seeded state; browser reload probe in the act drivers; no character-location persistence anywhere | hard (node) + probe |

State enumeration reuses the `act-3-flow`/`act-4-flow` route loops, the walkthrough seeds, and `tools/presence-enumerator.js`. V1/V2 must reproduce the audit's G10 line, `(act4_presagio_active, norma, [diner, roadhouse])`, as a **build failure** on the pre-migration world.

Warnings (allowlisted, Narrative System lint convention): a classic dialogue cascade keyed to a named character on a map where no window ever places them (ghost interaction).

## 10. Story state vs world state

Story state answers WHAT HAS HAPPENED. Cast Continuity answers WHERE ARE THE PEOPLE AS A CONSEQUENCE. The second is a projection of the first, authored, validated, and derived at runtime. A story flag becomes a world switch only by appearing in a window's predicate. `gigante2` ceases to be a world switch (its classic conds are deleted in migration); it survives only as a story-derived flag for any remaining classic reader.

## 11. Migration truth

`artifacts/world-character-audit/cast-windows-acts-1-4.md` derives the canonical windows for Acts 1–4 from Story Truth and the frozen act designs (sprite lists are reported as "engine today" and never used as truth where they conflict). It contains: the window table (id, entry, exit, cast changes, expected presence), the baseline table, the cast change records, the open design decisions the lead must close before implementation, and the V5 pin tables.

## 12. Implementation plan (revised; not started)

1. **Registry + compiler**: `narrative/cast/windows.json` (windows, baselines) → generated registry; compile to per-character predicates with window ids; `resolveCast` per §3.
2. **Validators first**: V1–V4, V7, V8 as `test/cast-continuity-validate.js` reusing the flow harness; V5 pins from the truth tables; V6 from the change records. Run them against the **pre-migration** world through the enumerator: they must fail on G10 and the Hawk/Truman/Audrey doubles.
3. **Act 4 cluster migration** (Truman, Hawk, six crowd, Bobby/Donna, Jacoby, Sarah, Andy, Leland, Maddy, Giant, Lucy baseline): delete classic named entries and adapter bodies for these ids; delete `!flag:gigante2` conds; validators green; `act-4-flow`, mirror gate, smoke, walkthrough, real-build A/B/C.
4. **Act 3 cluster** (traincar Truman/Hawk collocations, Audrey, Jacques, piantone as STORY-BOUND NAMED).
5. **Baselines for the rest** (Gerard, Ronette, nurse, Ben Horne, Red Room figures) — V7 closes the classic layer for named ids.
6. Then, and only then, Act 4 Environment Pass D reads its population from the registry.

Out of scope, unchanged: World Engine v0.1, Character Life v0.1, Ambient Life, save format, dialogue text, any scheduling/pathfinding/day-night simulation.

## 13. Open decisions for the lead (block step 3)

Listed with the evidence in `cast-windows-acts-1-4.md` §"Open decisions". Defaults are not taken.
