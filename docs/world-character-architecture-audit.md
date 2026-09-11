# World + Character architecture audit v1 — cast presence, world state, ownership, continuity

Date: 2026-09-11. Audit only: no engine change, no migration, no Act 4 environment work, no M9. Evidence in `artifacts/world-character-audit/` (presence-sources, cast-presence-matrix, location-population-matrix, ownership-trace, presence-enumeration + `tools/presence-enumerator.js`, failure-catalog, save-load-audit, test-coverage-and-life-boundary, options, validation-plan, migration-plan, coldstage-removal-ledger). Coldstage removed first (see ledger; `CANONICAL-SYNC.md` 2026-09-11).

## Verdict in one paragraph

The game has no concept of a character's location. It has two per-map sprite lists — classic `NPCS` in `js/glue.js` gated by `cond`, and `NARRATIVE_ENTITIES` in `js/narrative-engine-adapter.js` gated by `when` — merged at map population and deduplicated by string id **inside one map only**. "Truman at the Roadhouse" is therefore a new sprite on the Roadhouse map and says nothing about the Truman standing at the station. Every "what removes him?" question in the ownership trace answers NOTHING; every return is the accident of a `when` turning false; every suppression available to the classic layer is a one-shot flag (`!flag:gigante2`) that never comes back. The recommended architecture is a small **declarative cast-presence layer** (Option C): one ordered rule list per named character, resolved from existing story state to at most one placement, with map population derived from it. It is derived (no save change), reuses the narrative `when` grammar and validator, and leaves World Engine and Character Life untouched.

## 1. Why could G10 happen?

Because the Roadhouse crowd was authored as *staging for a room* (add six sprites to `roadhouse`), not as *movement of six people*, and no layer could express movement: the diner entries carry no condition, the classic condition language has no OR and no "until", and the only suppression tool at hand was the one-shot `gigante2`. `failure-catalog.md` shows this is not an Act 4 quirk: Truman (station+traincar W4, station+Roadhouse W6–W8), Hawk (station+traincar W4–W5, station+shore W9–W10), Audrey (hotel+OEJ W4–W5), Bobby/Donna (town+Roadhouse W6–W7) are duplicated by the same mechanism; Andy is a phantom at the station while dispatched to the Palmers; Sarah, Bobby, Donna, Jacoby are suppressed forever from W8.

## 2. Why did existing tests not catch it?

Every presence test checks one map or one narrative state in isolation and none normalises identity across maps (`test-coverage-and-life-boundary.md`): `act-4-flow` pins entity `when` windows per map; `act-4-mirror-gate` pins the conds that *exist* on a hard-coded id list (sarah, bobby, donna, jacoby), not the conds that are *missing* (norma, shelly, james, loglady, truman, hawk); playthrough drivers record actor presence per map entry but assert only what the path expects. The audit's enumerator, which resolves both mechanisms for every map under sixteen seeded states and groups by character, prints G10 and the Hawk double immediately — that is the missing test (`validation-plan.md` V1).

## 3. Which subsystem should own physical character presence?

A new thin layer, **Cast Presence** (`js/cast-presence.js` + a cast registry), owning exactly one question: *given story state, where is each named character?* Not the classic layer (no grammar, no validator), not the adapter (a mission-scoped injector), not World Engine (places, not people), not Character Life (behaviour of an already-placed body). Missions contribute rules for their windows; the registry owns order and defaults.

## 4. Does World Engine change?

No. World Engine v0.1 scopes characters out explicitly (§2–§3) and its catalog already validates the `sceneId`s presence rules will name. Three designs were compared (`options.md`): imperative location state (A), per-phase population ownership (B), declarative presence rules (C). Neither A nor C belongs *inside* World Engine; B would have pulled population into the environment briefs and is rejected. Later, World Engine may expose "environments of a location" so a rule can say `location: double-r` instead of a scene id; not now.

## 5. Does Character Life change?

No. The boundary is clean today: `character-activity.js`, `character-life-scenes.js`, `ambient-life*.js`, `environment-reactions.js`, station-population frames all operate downstream of `S.npcs`, matching by id to animate or paint, never spawning or moving (`test-coverage-and-life-boundary.md` part 2). The invariant to write down is the one it already obeys: **life after presence**.

## 6. Should named-character presence leave the classic layer?

Yes — partial migration. Narrative System v0.1 §"Migration trigger" set the bar at "a cross-layer bug reaches a human test"; G10 reached the user's eyes, and the audit found the same bug class in Acts 3 and 4 for seven characters. Named characters' *bodies* move to the cast registry; classic dialogue cascades, interacts, doors, background NPCs stay classic and are referenced by the placement (`dialogue` field). No Narrative Engine v2, no rewrite of Act 1 content.

## 7. What is the minimal reusable architecture?

- **Cast registry**: per named character an ordered list `[{when, sceneId, x, y, dir, dialogue?, wander?}, …, default]` where `default` is a home placement or `offscreen`; `when` uses the existing `COND_KEYS` grammar (flags reach it through the existing classic→narrative sync).
- **Resolver**: `resolveCast(state) → {characterId: placement | offscreen, ruleIndex}` — first match wins; pure; no persistence.
- **Population hook**: where `syncNarrativeEntities` already runs (map load, `setState`, every commit), map bodies = background `NPCS` (ids not owned by the registry) + placements resolved to that scene. `interact()` unchanged; mission preemption per (map, actor) unchanged.
- **Validator**: V1 uniqueness over reachable states, V6 no-shadow-copy, V3 return-by-fall-through, V5 terminal offscreen, V2 pins from scene contracts, V4 save determinism (`validation-plan.md`).
- **Classes** (§17): PERSISTENT NAMED (registry, unique), STORY-BOUND NAMED (registry, narrow window, unique: Giant, Jacques, piantone), LOCAL BACKGROUND (classic per-map `NPCS`, no cross-map identity: patrons, guards), EPHEMERAL CROWD (unnamed bodies a scene may declare; named crowd members are placements).
Estimated size: resolver ≈150 lines, registry ≈ 25 characters, hook ≈ 20 lines, validator ≈ 200 lines reusing the flow harness loops.

## 8. How will future authors use it?

Authoring contract (`§11` of the brief): a mission or the registry states
```
TRUMAN  at ROADHOUSE 4,8 facing up   when atto4 ∧ ¬warning_target
TRUMAN  home SHERIFF 10,4
HAWK    offscreen ("di pattuglia")   when presagio_status=active ∧ ¬value_set body_found_by
HAWK    at TOWN 16,27                when body_found_by=hawk ∧ ¬maddy_trovata
JACQUES offscreen                    when jacques_preso          (terminal: death/removal)
GIANT   at ROADHOUSE 8,1             when presagio_status=active ∧ ¬warning_target   (one-scene appearance)
```
Source of truth = the registry (missions append rules under their own window; the registry orders them). Temporary move = a rule; return = fall-through to the next rule (never a second flag); offscreen = an explicit rule; one-scene appearance = a narrow rule over a `nodes_done`/value window; death/removal = a terminal `offscreen` rule at top priority. A writer never touches `js/glue.js` or injects sprites. Environment briefs (World authoring methodology, §13) gain a **Cast & population** section for named characters only: baseline residents, story-window placements, ingress/egress, offscreen characters, who owns each transition (which mission window), save expectation ("derived"). Background NPCs need none of it.

## 9. How will it be validated?

`validation-plan.md`. The hard gates are V1 (≤1 body per character per reachable state — the test that would have printed `(act4_presagio_active, norma, [diner, roadhouse])`), V6 (no named id in `NPCS`/`NARRATIVE_ENTITIES`), V3 (return by fall-through), V5 (terminal offscreen); V2 pins come from each act's scene contracts; V4 compares `resolve(saved) == resolve(live)` and a browser reload probe. State enumeration reuses the `act-3-flow`/`act-4-flow` route loops and the walkthrough seeds; entity resolution reuses the adapter bootstrap of `act-4-mirror-gate`.

## 10. What migration is required for Acts 1–4?

`migration-plan.md`: 19 named characters, in risk order — Truman, Hawk, the six crowd members, Bobby/Donna (delete `!flag:gigante2`), Jacoby, Sarah (design decision: dark house W8–W10 or present), Andy (Palmer when `sarah_support_state=vice`), then Audrey, Leland, Maddy, Giant, Jacques, Gerard, Ronette, Ben Horne, Lucy; Cooper exempt. Save impact: none for every row (derived). Sequence: Act 4 cluster first with V1/V6 green and the real-build A/B/C paths; then Act 3 cluster; then defaults.

## 11. What remains intentionally unchanged?

World Engine v0.1; Character Life v0.1 and Ambient Life; classic dialogues, interacts, doors, objectives; the mission runtime and `when` grammar; save format; Ronette's bed draw special case; background NPC placement in `NPCS`; Story Truth and Narrative System methodology (one addition each: the cast section in environment briefs, the presence validator in the lint list — recorded as proposals, not applied).

## 12. Is the Act 4 Environment Pass safe to resume afterward?

After the cast layer exists and the Act 4 cluster is migrated (migration step 1) with V1/V6 green: **yes**. Before that: no — the Roadhouse brief would place six bodies the world cannot own, and the shore brief would place Hawk twice. The environment pass then reads its population from the registry, not from a staging list.

## World state vs story state (§14)

Story state = flags, values, evidence, propositions, `nodes_done` (Narrative System). World state = what physically exists where now. Under Option C the world state of named characters is a **projection** of story state through presence rules: nothing about presence is stored, and a story flag becomes a world switch only by appearing in a rule's `when`. Player position and transient wander offsets are the only world-only state. Consequence: `gigante2` stops being a world switch (its classic conds are deleted in migration); it remains a story-derived flag for classic readers if any survive.

## Invariants derived from the audit (§9)

1. **Character uniqueness** — a named character resolves to at most one placement per story state (by construction of the resolver).
2. **Single presence owner** — only the cast resolver places named bodies; `NPCS` and `NARRATIVE_ENTITIES` may not contain a registry id (V6).
3. **Presence is derived** — no persisted location; `resolve(saved state) == resolve(live state)` (V4).
4. **Authored default** — every named character has a terminal rule (home or offscreen); a window rule ending returns by fall-through, never by a second flag (V3).
5. **Offscreen is explicit** — absence is a rule, not the absence of a sprite; terminal offscreen for dead/removed characters (V5).
6. **Life after presence** — Character Life and Ambient Life animate only resolved bodies (already true; written down).
7. **Background exemption** — LOCAL BACKGROUND and EPHEMERAL CROWD have no cross-map identity and no uniqueness rule.
Dropped from the brief's candidates: "location population is derived" is subsumed by 2–3; "authored return" is restated as 4 because a return rule is a duplicate of a default.

## Recommendation (§18)

Adopt Option C. **Why**: smallest change that makes duplicates unrepresentable; derived; reuses the validated `when` grammar; zero coupling to World Engine and Character Life; readable authoring. **Why not the others**: A converts a property into a procedure and reintroduces phantoms by forgotten returns and needs a save migration; B needs a phase lattice the game does not have and cannot express a one-scene appearance; 0 is `gigante2` nine more times. **Migration cost**: one resolver, one registry, one hook, one validator, 19 mechanical rule sets, deletion of four classic conds and nine adapter bodies; no text, no save, no art. **Bug classes eliminated**: A duplicate, B phantom (by explicit windows), D permanent suppression, E ownership collision, G transition without cause (every move is a rule with a window), I visual-only duplicate. **New risks**: wrong-window rules resolve silently (mitigated by V2 pins and V8 overlap warnings); design decisions surfaced by the migration (Sarah at night, Andy at the Palmers, James's arrival) must be made by the lead, not defaulted.

STOP. Next milestone: cast-presence implementation pass (resolver + registry + V1/V6 + Act 4 cluster migration), then resume Act 4 Environment Pass D with population read from the registry.
