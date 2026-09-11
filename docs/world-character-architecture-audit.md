# World + Character architecture audit v1 — cast presence, world state, ownership, continuity

Date: 2026-09-11. **Amended 2026-09-11 (Cast Continuity amendment — see the last section; it supersedes every "ordered rules / first match wins" statement below).** Audit only: no engine change, no migration, no Act 4 environment work, no M9. Evidence in `artifacts/world-character-audit/` (presence-sources, cast-presence-matrix, location-population-matrix, ownership-trace, presence-enumeration + `tools/presence-enumerator.js`, failure-catalog, save-load-audit, test-coverage-and-life-boundary, options, validation-plan, migration-plan, coldstage-removal-ledger). Coldstage removed first (see ledger; `CANONICAL-SYNC.md` 2026-09-11).

## Verdict in one paragraph

The game has no concept of a character's location. It has two per-map sprite lists — classic `NPCS` in `js/glue.js` gated by `cond`, and `NARRATIVE_ENTITIES` in `js/narrative-engine-adapter.js` gated by `when` — merged at map population and deduplicated by string id **inside one map only**. "Truman at the Roadhouse" is therefore a new sprite on the Roadhouse map and says nothing about the Truman standing at the station. Every "what removes him?" question in the ownership trace answers NOTHING; every return is the accident of a `when` turning false; every suppression available to the classic layer is a one-shot flag (`!flag:gigante2`) that never comes back. The recommended architecture is a small **declarative cast-presence layer** (Option C, as amended): per named character an authored baseline plus story windows whose predicates are mutually exclusive over reachable states, resolved from existing story state to **exactly one** placement (scene, `OFFSCREEN`, or `TERMINAL_REMOVED`), order-independent, with map population derived from it. It is derived (no save change), reuses the narrative `when` grammar and validator, and leaves World Engine and Character Life untouched.

## 1. Why could G10 happen?

Because the Roadhouse crowd was authored as *staging for a room* (add six sprites to `roadhouse`), not as *movement of six people*, and no layer could express movement: the diner entries carry no condition, the classic condition language has no OR and no "until", and the only suppression tool at hand was the one-shot `gigante2`. `failure-catalog.md` shows this is not an Act 4 quirk: Truman (station+traincar W4, station+Roadhouse W6–W8), Hawk (station+traincar W4–W5, station+shore W9–W10), Audrey (hotel+OEJ W4–W5), Bobby/Donna (town+Roadhouse W6–W7) are duplicated by the same mechanism; Andy is a phantom at the station while dispatched to the Palmers; Sarah, Bobby, Donna, Jacoby are suppressed forever from W8.

## 2. Why did existing tests not catch it?

Every presence test checks one map or one narrative state in isolation and none normalises identity across maps (`test-coverage-and-life-boundary.md`): `act-4-flow` pins entity `when` windows per map; `act-4-mirror-gate` pins the conds that *exist* on a hard-coded id list (sarah, bobby, donna, jacoby), not the conds that are *missing* (norma, shelly, james, loglady, truman, hawk); playthrough drivers record actor presence per map entry but assert only what the path expects. The audit's enumerator, which resolves both mechanisms for every map under sixteen seeded states and groups by character, prints G10 and the Hawk double immediately — that is the missing test (`validation-plan.md` V1).

## 3. Which subsystem should own physical character presence?

A new thin layer, **Cast Presence** (`js/cast-presence.js` + a cast registry), owning exactly one question: *given story state, where is each named character?* Not the classic layer (no grammar, no validator), not the adapter (a mission-scoped injector), not World Engine (places, not people), not Character Life (behaviour of an already-placed body). Missions and the world cast file contribute windows; the registry owns baselines and validates exclusion. There is no order.

## 4. Does World Engine change?

No. World Engine v0.1 scopes characters out explicitly (§2–§3) and its catalog already validates the `sceneId`s presence rules will name. Three designs were compared (`options.md`): imperative location state (A), per-phase population ownership (B), declarative presence rules (C). Neither A nor C belongs *inside* World Engine; B would have pulled population into the environment briefs and is rejected. Later, World Engine may expose "environments of a location" so a rule can say `location: double-r` instead of a scene id; not now.

## 5. Does Character Life change?

No. The boundary is clean today: `character-activity.js`, `character-life-scenes.js`, `ambient-life*.js`, `environment-reactions.js`, station-population frames all operate downstream of `S.npcs`, matching by id to animate or paint, never spawning or moving (`test-coverage-and-life-boundary.md` part 2). The invariant to write down is the one it already obeys: **life after presence**.

## 6. Should named-character presence leave the classic layer?

Yes — partial migration. Narrative System v0.1 §"Migration trigger" set the bar at "a cross-layer bug reaches a human test"; G10 reached the user's eyes, and the audit found the same bug class in Acts 3 and 4 for seven characters. Named characters' *bodies* move to the cast registry; classic dialogue cascades, interacts, doors, background NPCs stay classic and are referenced by the placement (`dialogue` field). No Narrative Engine v2, no rewrite of Act 1 content.

## 7. What is the minimal reusable architecture?

- **Cast registry** (amended): authored as **Cast Continuity windows** (`WINDOW ID · ENTRY · EXIT · CAST CHANGES · EXPECTED PRESENCE`) plus one **baseline** per character (home placement, `OFFSCREEN`, or `TERMINAL_REMOVED`); compiled to a *set* of `{characterId, predicate, placement, windowId}`; predicates use the existing `COND_KEYS` grammar (flags reach it through the existing classic→narrative sync).
- **Resolver** (amended): `resolveCharacterPresence(characterId, state)` — evaluate all windows naming the character: exactly one match → that placement; more than one → HARD ERROR; none → authored baseline; no baseline → HARD ERROR. Pure, order-independent, no persistence. Never "first match wins".
- **Population hook**: where `syncNarrativeEntities` already runs (map load, `setState`, every commit), map bodies = background `NPCS` (ids not owned by the registry) + placements resolved to that scene. `interact()` unchanged; mission preemption per (map, actor) unchanged.
- **Validator** (amended): V1 exactly-one, V2 zero overlaps, V3 no implicit absence, V4 order independence (shuffled registry), V5 world-window pins (whole cast snapshot), V6 causal transition, V7 single body owner, V8 save determinism (`docs/cast-continuity-contract-v0.1.md` §9, `validation-plan.md`).
- **Classes** (§17): PERSISTENT NAMED (registry, unique), STORY-BOUND NAMED (registry, narrow window, unique: Giant, Jacques, piantone), LOCAL BACKGROUND (classic per-map `NPCS`, no cross-map identity: patrons, guards), EPHEMERAL CROWD (unnamed bodies a scene may declare; named crowd members are placements).
Estimated size: resolver ≈150 lines, registry ≈ 25 characters, hook ≈ 20 lines, validator ≈ 200 lines reusing the flow harness loops.

## 8. How will future authors use it?

Authoring contract (amended, `docs/cast-continuity-contract-v0.1.md` §4–§6): the author writes **windows**, not per-character rules:
```
WINDOW ACT4_ROADHOUSE_PRE_PHONE   entry presagio_status=active   exit warning_target set (m8_roadhouse_phone)
  truman → roadhouse / truman_table        cause: the town gathers, he waits for Cooper
  hawk   → OFFSCREEN (patrol)              cause: Act 4 sends him out
  norma, shelly, bobby, donna, james, loglady → roadhouse   cause: the town gathers
  giant  → roadhouse / stage               cause: the statement
  expected presence: the whole snapshot (V5 pin)
BASELINE truman = sheriff 10,4 · hawk = sheriff 12,8 · giant = OFFSCREEN · jacques = TERMINAL_REMOVED after jacques_preso
```
Every move carries CAST BEFORE / CAUSE / CAST CHANGE / CAST AFTER / RETURN. Return = the window's EXIT, resolving to the baseline (never a second flag); absence = an explicit `OFFSCREEN` entry; death = `TERMINAL_REMOVED`. Two windows naming the same character must be exclusive over reachable states, or the build fails. A writer never touches `js/glue.js` or injects sprites. Environment briefs gain a **Cast Continuity** section for named characters only: BASELINE CAST, TEMPORARY STORY WINDOWS, EXPECTED ABSENCES, INGRESS / EGRESS CAUSE, RETURN / NEXT WORLD STATE (contract §7). Background NPCs need none of it.

## 9. How will it be validated?

`validation-plan.md` (amended). All eight validators are hard gates: V1 exactly one presence (== 1, not ≤ 1 — the test that would have printed `(act4_presagio_active, norma, [diner, roadhouse])` as a build failure), V2 zero overlaps, V3 no implicit absence, V4 order independence under shuffled registries, V5 whole-window cast pins, V6 causal transitions, V7 single body owner (no named id in `NPCS`/`NARRATIVE_ENTITIES`/manual rendering), V8 save determinism plus a browser reload probe. State enumeration reuses the `act-3-flow`/`act-4-flow` route loops and the walkthrough seeds; entity resolution reuses the adapter bootstrap of `act-4-mirror-gate`.

## 10. What migration is required for Acts 1–4?

`migration-plan.md`: 19 named characters, in risk order — Truman, Hawk, the six crowd members, Bobby/Donna (delete `!flag:gigante2`), Jacoby, Sarah (design decision: dark house W8–W10 or present), Andy (Palmer when `sarah_support_state=vice`), then Audrey, Leland, Maddy, Giant, Jacques, Gerard, Ronette, Ben Horne, Lucy; Cooper exempt. Save impact: none for every row (derived). Sequence: Act 4 cluster first with V1/V6 green and the real-build A/B/C paths; then Act 3 cluster; then defaults.

## 11. What remains intentionally unchanged?

World Engine v0.1; Character Life v0.1 and Ambient Life; classic dialogues, interacts, doors, objectives; the mission runtime and `when` grammar; save format; Ronette's bed draw special case; background NPC placement in `NPCS`; Story Truth and Narrative System methodology (one addition each: the cast section in environment briefs, the presence validator in the lint list — recorded as proposals, not applied).

## 12. Is the Act 4 Environment Pass safe to resume afterward?

After the cast layer exists and the Act 4 cluster is migrated (migration step 1) with V1/V6 green: **yes**. Before that: no — the Roadhouse brief would place six bodies the world cannot own, and the shore brief would place Hawk twice. The environment pass then reads its population from the registry, not from a staging list.

## World state vs story state (§14)

Story state = flags, values, evidence, propositions, `nodes_done` (Narrative System). World state = what physically exists where now. Under Option C the world state of named characters is a **projection** of story state through presence rules: nothing about presence is stored, and a story flag becomes a world switch only by appearing in a rule's `when`. Player position and transient wander offsets are the only world-only state. Consequence: `gigante2` stops being a world switch (its classic conds are deleted in migration); it remains a story-derived flag for classic readers if any survive.

## Invariants derived from the audit (§9)

1. **Exactly one presence** (amended) — a named character resolves to exactly one of {placement, `OFFSCREEN`, `TERMINAL_REMOVED`} per reachable story state; zero and more-than-one are build errors, not resolver choices.
2. **Single presence owner** — only the cast resolver places named bodies; `NPCS`, `NARRATIVE_ENTITIES` and manual environment rendering may not contain a registry id (V7).
3. **Presence is derived** — no persisted location; `resolve(saved state) == resolve(live state)` (V8).
4. **Authored baseline, no priority** (amended) — every named character has one baseline; windows are mutually exclusive over reachable states; a window ending returns to the baseline by its EXIT transition, never by a second flag; no order, priority, or specificity resolves anything (V2, V4, V6).
5. **Offscreen is explicit** — absence is an authored `OFFSCREEN` entry, never inferred from missing sprite data; `TERMINAL_REMOVED` for dead/removed characters (V3).
6. **Life after presence** — Character Life and Ambient Life animate only resolved bodies (already true; written down).
7. **Background exemption** — LOCAL BACKGROUND and EPHEMERAL CROWD have no cross-map identity and no uniqueness rule.
8. **Location is story causality** (amended) — every move has an authored CAST BEFORE / CAUSE / CHANGE / AFTER record; a body that changes place without a recorded cause is a design defect even if it never renders (V6).
Dropped from the brief's candidates: "location population is derived" is subsumed by 2–3; "authored return" is restated as 4 because a return is the window's exit.

## Recommendation (§18)

Adopt Option C. **Why**: smallest change that makes duplicates unrepresentable; derived; reuses the validated `when` grammar; zero coupling to World Engine and Character Life; readable authoring. **Why not the others**: A converts a property into a procedure and reintroduces phantoms by forgotten returns and needs a save migration; B needs a phase lattice the game does not have and cannot express a one-scene appearance; 0 is `gigante2` nine more times. **Migration cost**: one resolver, one registry, one hook, one validator, 19 mechanical rule sets, deletion of four classic conds and nine adapter bodies; no text, no save, no art. **Bug classes eliminated**: A duplicate, B phantom (by explicit windows), D permanent suppression, E ownership collision, G transition without cause (every move is a rule with a window), I visual-only duplicate. **New risks**: a wrong-window predicate places someone in the wrong room silently (mitigated by V5 whole-cast pins and V6 transition checks — overlaps are no longer a warning but a build failure); design decisions surfaced by the migration must be made by the lead, not defaulted (contract §13).

## Amendment (2026-09-11) — position is world state, not rule priority

The lead rejected one part of the recommendation above: **ordered rules / first match wins**. The corrected architecture is frozen in `docs/cast-continuity-contract-v0.1.md`; this section records what changed in the audit's answers.

1. **Rejection of first-match-wins.** If two location predicates for one named character are true at once, the authored world is contradictory. There is no priority number, no override hierarchy, no "more specific wins", no fallback used to hide an overlap. Overlap = HARD ERROR at validation time. Every statement above of the form "the first rule whose `when` holds wins", "top-priority offscreen rule", "order = priority", "`shadowed_by` declared precedence" is withdrawn.
2. **Exact-one-state invariant.** For every reachable story state, every registry character resolves to exactly one of: one scene placement, explicit `OFFSCREEN`, explicit `TERMINAL_REMOVED`. Never zero implicitly, never more than one. Invariant 1 above is rewritten accordingly.
3. **Order-independent resolution.** Evaluate all explicit story windows naming the character; exactly one match → use it; more than one → error; zero → authored baseline; no baseline → error. Reordering registry entries must never change the resolved world (V4 shuffles and compares).
4. **Baseline semantics.** A baseline is an authored truth ("Truman is normally at the station outside explicit story movement"), not a competing rule; it applies only when no window matches. Characters who exist only in windows have an `OFFSCREEN` or `TERMINAL_REMOVED` baseline.
5. **Cast-window authoring model.** The authoring source is **Cast Continuity / World Cast State**: per load-bearing story window, `WINDOW ID · ENTRY · EXIT/transition · CAST CHANGES · EXPECTED RESULTING PRESENCE`. The runtime compiles windows to predicates; the per-character rule list of §7–§8 is a compiled artifact, not what authors write. Windows for Acts 1–4 are derived from Story Truth and the frozen designs in `artifacts/world-character-audit/cast-windows-acts-1-4.md`; sprite lists are never truth where they conflict.
6. **Transition causality.** Every move records CAST BEFORE / EVENT-CAUSE / CAST CHANGE / CAST AFTER / RETURN. No travel simulation, but no unexplained teleport in the authored model.
7. **Validation rules.** V1 exactly one, V2 zero overlaps, V3 no implicit absence, V4 order independence, V5 world-window pins (whole snapshot), V6 causal transition, V7 single body owner, V8 save determinism — all hard. The earlier V7 (ghost interaction) becomes an allowlisted warning; the earlier V8 (overlap warning) is replaced by V2 as a failure.
8. **Authoring and world-building contracts.** Narrative templates gain a CAST CONTINUITY section for beats that move named characters only; location/environment briefs must state BASELINE CAST, TEMPORARY STORY WINDOWS, EXPECTED ABSENCES, INGRESS/EGRESS CAUSE, RETURN/NEXT WORLD STATE. Population is world building, decided with the brief.
9. **Options re-read.** Option C survives as the *runtime shape* (thin, derived, `when` grammar reused); its authoring and resolution semantics are replaced by the contract. Options A (imperative) and B (per-phase population) stay rejected; note that the amended model takes from B the idea of authoring whole-window snapshots as pins, without B's need for a total phase order — windows only need exclusion per character.
10. **Implementation plan** updated in the contract §12 and `migration-plan.md`: validators are built first and must fail on the pre-migration world; migration follows Act 4 cluster → Act 3 cluster → baselines.

STOP. Next milestone: cast-continuity implementation pass (registry + compiler + resolver, V1–V8, Act 4 cluster migration), gated on the lead closing the open decisions in the truth tables; then resume Act 4 Environment Pass D with population read from the registry.
