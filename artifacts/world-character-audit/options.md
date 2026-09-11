# Architecture options — named-character presence (lead evaluation, 2026-09-11)

Baseline facts the design must respect: presence is already **derived** from story state (nothing persisted; `save-load-audit.md`); the adapter already has one merge point (`syncNarrativeEntities`, run at enable / setState / every commit); the narrative `when` grammar (`COND_KEYS`) is the only condition language with a validator; classic `cond` has no OR and no validator; Character Life animates bodies it finds by id and spawns nothing; World Engine v0.1 is a frozen catalog of locations/environments/connections with characters explicitly out of scope.

## Option 0 — status quo + validator + more conds (rejected)

Add the cross-map uniqueness validator and patch every classic entry with `cond`. Fails on its own terms: classic `cond` cannot express "at the Roadhouse tonight, back at the diner tomorrow" (no OR, one-shot flags), so the fix is exactly the `gigante2` hack repeated nine times; suppression stays permanent; ownership stays split; the validator would only ever report the next instance.

## Option A — Authoritative character location state (imperative)

`world.cast[characterId] = {sceneId, x, y, dir} | 'offscreen'`, mutated by narrative effects (`move: truman → roadhouse`), read by map population.
- Complexity: medium (new state, new effect type, new persistence key).
- Migration: every current `when` window becomes two effects (go, return) → ~40 effects across M5/M6/M8 plus classic bridges.
- Save: **breaks derivation**: the cast map must be persisted or replayed; old saves need a migration; the "same story state → same population" invariant becomes a *procedure*, not a property.
- Authoring: readable ("Truman goes to the Roadhouse") but every departure needs an authored return, and forgotten returns are the phantom class B by construction.
- World Engine / Character Life coupling: low.
- Debugging: state can be inspected, but *why* Truman is somewhere requires replaying effects.
- Reuse: fine.
- Impossible states: possible (effect ordering, missed returns, two missions moving the same character).

## Option B — Scene population ownership per story phase

Each story phase declares the full population of the locations it touches; characters unique by invariant inside a phase.
- Complexity: medium-high (phases must be defined and totally ordered; the game has none: Act 2 has no boundary flag at all).
- Migration: rewrite population for every map per phase (≈ 11 windows × 14 maps).
- Save: derived (phase from flags) — good.
- Authoring: coarse; a one-scene appearance (Giant on the stage between two nodes) needs a phase of its own; phases overlap across missions (M6 cards vs Room 315).
- Coupling: pulls the population table toward the environment briefs (World Engine side), away from missions.
- Impossible states: prevented within a phase, not across phase boundaries that two missions define differently.

## Option C — Character presence rules (declarative, per character, derived) — RECOMMENDED

A central cast registry: for every named character an **ordered list of presence rules** `{when, sceneId, x, y, dir, facing?, dialogue?}` plus a terminal default (home or `offscreen`). Resolution: for a given story state, the first rule whose `when` holds wins; the result is a total function `state → placement | offscreen` per character. Map population = classic *background* NPCs (unchanged) + the cast placements resolved to that map. Missions contribute rules for their windows (same `when` grammar as entities today, same validator), the registry owns the order and the defaults.
- Complexity: low: a resolver (~150 lines), one call in map population where `syncNarrativeEntities` already runs, a registry file; no new effect type, no engine simulation.
- Migration: mechanical: each classic named entry → default rule; each `NARRATIVE_ENTITIES` row → windowed rule; each `!flag:gigante2` cond → deleted (return is implicit when the window rule stops matching).
- Save: **unchanged** — derived from flags/values/nodes_done exactly as today; `resolve(snapshot) == resolve(live)` is testable.
- Authoring: "TRUMAN at ROADHOUSE when atto4 ∧ ¬warning_target" is literally the rule; return is the fall-through; offscreen is a rule; death is a top-priority `offscreen` rule.
- World Engine coupling: rules name `sceneId`s the catalog already validates; World Engine can later expose "environments of location" but needs no change now.
- Character Life coupling: none (it keeps animating the resolved body by id).
- Classic migration: partial by design — only named characters leave `NPCS`; generic interacts, dialogues and background NPCs stay.
- Debugging: `resolveCast(state)` prints the matched rule per character — one table answers "where is everyone and why".
- Impossible states: uniqueness by construction (one placement per character); the remaining risk is *wrong* placement (a rule with a bad `when`), which the enumerating validator exposes as expected/absent pins.
- Risks: rules that overlap unintentionally resolve silently by order → validator warns on any state where >1 rule of one character matches unless the overlap is declared; the crowd's `dialogue: null` bodies become placements *with* the classic dialogue reachable (a design decision per character: keep `dialogue: null` per rule if the scene wants silence).

## Verdict

Option C. It is the smallest change that makes the failure class *unrepresentable* rather than *detectable*, keeps presence derived (no save migration), reuses the existing `when` grammar and validator, and leaves World Engine and Character Life untouched. Option A is the natural instinct ("move him") and is rejected because it converts a property into a procedure and reintroduces phantoms by omission. Option B is rejected because the game has no phase lattice and a scene-scale appearance does not fit a phase. Option 0 is the `gigante2` hack at scale.
