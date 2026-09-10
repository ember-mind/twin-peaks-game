# Studio systems audit

Reports document existence and code linkage only — no quality judgment.

## World Visual Bible (`docs/world-visual-bible-v0.1.md`)

- Exists: 136 lines. First heading: `# World Visual Bible v0.1`.
- Body line: *"Art-direction contract for every environment that claims to
  belong to the Twin Peaks game world. Extracted from the approved
  references, not invented."*
- Code it names: only `js/retro-font.js` — confirmed present. This doc is a
  reference/contract document (palette, style rules), not something with a
  1:1 implementing module; it's consulted by artists/builders, not executed.
- No validator/test named inside the doc.

## World Engine (`docs/world-engine-v0.1.md`)

- Exists: 125 lines. First heading: `# World Engine v0.1`, section 1 `Purpose`.
- Code it names: `js/world-catalog.js` — confirmed present (`js/world-catalog.js`,
  loaded in `index.html` after `js/world-engine.js`). The doc also describes
  `GAME.World.register(catalog)` (implemented in `js/world-engine.js`, not
  named by file path in the doc text but confirmed present on disk).
- Validator named: `test/world-engine-v0.1-catalog.js` — confirmed present.
- The doc is explicit about scope limits it does **not** cover: it flags the
  town-door-names-a-scene-id coupling for Double R as a recorded, unrefactored
  boundary (line 27) — see `artifacts/recovery-audit/map-transitions.md` §2.

## Ambient Life (`docs/ambient-life.md`)

- Exists: 162 lines. First heading: `# Ambient Life v0.1`.
- Body line: *"The approved environment art is an immutable base layer.
  Ambient Life adds sparse native-pixel overlays; disabling it draws
  nothing."*
- Code it names: `js/ambient-life-scenes.js`, `js/ambient-life.js`,
  `js/engine.js`, `js/sheriffs-station-production.js` — all confirmed present.
- Validators named and confirmed present: `test/ambient-life.js`,
  `test/sheriffs-station-ambient.js`, `test/sheriffs-station-door.js`,
  `test/environment-entry.js`, `test/environment-life.js`.
- The doc describes the sheriff-station front-door reaction as *"now
  implemented"* (line 144), matching `js/sheriffs-station-production.js`'s
  `EnvironmentReactions.register('sheriff', [{ id: 'front-door', ... }])`
  call found in code.

## Character Life (`docs/character-activity.md`, `artifacts/character-life-v01`)

- Doc exists: 32 lines only. First heading: `# Double R — first character
  routines`. Much shorter than the other system docs — covers a narrow slice
  (two authored diner gestures), not a full character-life system doc.
- Code it names: none by file path in the doc text (no `js/...` references
  found by grep), but the body names `test/character-activity.js` as the
  validator, which is confirmed present and covers *"seeded timing, separate
  starts, pause/disable, scene/workstation guards and wipe cancellation"*
  plus a `dinerGestures` Coldstage capture.
- `artifacts/character-life-v01/` exists on disk with production art
  (`character-life-*-native.png`, `frame-sheet-12x.png`,
  `npc-crop-strip-8x.png`) and a `validation/` subdirectory (contains
  `smoke.log`, `walkthrough.log`, `coldstage.config.mjs.before` per the
  earlier grep) — this is the asset/validation trail for the feature the doc
  describes.

## Narrative System v0.1

- `docs/narrative/README.md` exists (31 lines) — entry point, points to
  `docs/narrative-system-v0.1.md` (330 lines, exists) and
  `docs/narrative-craft-bible-v0.1.md` (644 lines, exists), plus
  `docs/narrative/templates/`. States validators live at `tools/narrative/`
  and are run via `node test/narrative-lint.js` — confirmed present.
- Matches the memory note that v0.1 is frozen.

## Story Truth v0.1

- `docs/story/README.md` exists (75 lines). First heading: `# Story truth
  (author-only)`. Body: *"What is objectively true in this game, kept apart
  from what any character knows and from what the player has seen. The
  runtime never reads this directory; the ledgers cite it."*
- Validator: `test/story-truth-lint.js` — confirmed present (also named in
  `CLAUDE.md`).

## CLAUDE.md / AGENTS.md pointers

- `CLAUDE.md` (project root) contains both pointers, quoted verbatim:
  - Line 40: `evidence, objectives), read \`docs/narrative/README.md\` (two
    screens) — it` (part of the sentence *"Before designing or writing any
    narrative content ... read `docs/narrative/README.md`"*).
  - Line 45: `Story truth (what is objectively true, who knows what):
    \`docs/story/README.md\``.
- `AGENTS.md` exists in the project root but **does not** contain either
  pointer — `grep -n "docs/narrative/README\|docs/story/README" AGENTS.md`
  returned no matches. Only `CLAUDE.md` documents these entry points.
