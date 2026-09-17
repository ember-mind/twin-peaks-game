# Twin Peaks Game — coding-agent entry point

Browser RPG (Twin Peaks fan game, Italian dialogues). Production is
`index.html`: plain script tags, `GAME` globals, **2D canvas 256×192**,
tile size 16, no build step. `js/engine.js` owns viewport, input and loop.
Three.js/render3d and the older 160×144 viewport are historical, not the
production rendering path.

## Run and validate

Serve the checkout over HTTP for production and editor testing (World Builder
loads fixtures over HTTP; the game itself still works from file://).

- `node tools/run-release-tests.js --list` — the CI Node gates.
- `node tools/run-release-tests.js --out=<dir>` — run them, keep evidence.
- `node test/smoke.js`, `node test/walkthrough.js` — fast core checks.
  Walkthrough is a simulator, not browser acceptance.
- `node test/genmaps.js` — regenerate/validate the large ASCII maps. Never
  edit generated map rows by hand.
- `node test/act-3-playthrough.js`, `act-4-`, `act-5-`, `test/world-builder-browser.js`
  — real Chrome gates. Run **one Chrome driver at a time** (the
  `TP-RETRO-READY` race makes parallel runs flaky). Every headless driver
  passes `--headless=new --mute-audio --enable-unsafe-swiftshader --use-angle=swiftshader`.
- Do not run every `test/*.js` blindly: some are fixtures, generators or
  local-only evidence checks. `reports/test-debt-triage.md` classifies them.

Acceptance: the CI gates green, act playthroughs green, no drop in check or
acquisition counts vs. the last MEMORY entry in `Twin Peaks Game.md`.
`docs/playable-build-01.md` defines campaign, recovery and human-test evidence.
Keep structural tests, real-browser completion and human usability distinct.
The unseeded campaign is known to fail on macOS Chrome after minutes of play
while hosted CI passes; certify campaigns on hosted CI.

## Ownership and safety

- Script order: `index.html`. Geometry: raw maps plus native scene installers.
- Registries under `world/` are the source: `connections.json`,
  `scene-objects.json`, `props.json`, `narrative-targets.json`. Apply with
  `tools/world-apply.js`; generated `js/*.gen.js` files are regenerated from
  their inputs (`test/gen-world-data.js`, `test/gen-narrative-data.js`),
  never edited.
- Named-character placement: `narrative/cast/windows.json` → Cast Presence.
  Conflicting true windows are errors, never first-match-wins, never a
  silent vanish.
- `js/glue.js` copies map fields generically; only `TRANSFORMED_KEYS` are
  reshaped by hand. `test/smoke.js` fails loudly if a field is dropped.
- Canonical source is the Obsidian vault (`Vault/1. Projects/Twin Peaks Game`);
  this repository is the deploy mirror. Sync is logged in `CANONICAL-SYNC.md`.
- Deploy: push to `ember-mind/twin-peaks-game`, then manual Deploy in Coolify.
  Pushing alone does not deploy. Never deploy or change hosting unasked.
- Legacy 3D-only rules (outdoor spawn row ≤ 23, camera barrier) do not apply
  to production; use current spawn, collision and traversal tests.

## Agent workflow

- Branch from `main`. Never push. Stage explicit paths only (other sessions
  edit the same checkout). Never run a bare `git stash`.
- The lead merges with `--no-ff`, runs gates, pushes, mirrors the vault.
- A commit that changes a registry, mission JSON or `state-enums.json` must
  include the regenerated `*.gen.js`.

## Narrative changes

Before changing acts, scenes, dialogue, evidence or objectives, read
`docs/narrative/README.md`, then the linked system and craft documents. Story
truth (what is objectively true, who knows what): `docs/story/README.md`.
Run `node test/narrative-lint.js`, `node test/narrative-validate.js`,
`node test/story-truth-lint.js` and the affected act flow/playthrough tests.
Locked script ambiguities need an explicit ruling from the lead, not silent
rewrites to make a test pass.

## Read next

`Twin Peaks Game.md` (project root) keeps architecture history and MEMORY.
Its older viewport, renderer and deploy descriptions are not current
operational instructions; this file and CI evidence are.
