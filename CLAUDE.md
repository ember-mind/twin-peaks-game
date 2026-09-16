# Twin Peaks Game — coding-agent entry point

Production is `index.html`: plain script tags, `GAME` globals, **2D canvas
256×192**, tile size 16. `js/engine.js` owns the current viewport and loop.
Three.js/render3d and older 160×144 descriptions are historical, not the
production rendering path. There is no mandatory bundling step.

## Run and validate

Serve the checkout over HTTP for production and editor testing. The game also
retains its file:// design, but the World Builder loads fixture data over HTTP.

- `node tools/run-release-tests.js --list` — list the current CI Node gates.
- `node tools/run-release-tests.js --out=/tmp/tp-release-UNIQUE` — run those
  gates and preserve per-test evidence. Use a clean disposable checkout.
- `node test/smoke.js` and `node test/walkthrough.js` — fast core checks;
  walkthrough is a simulator, not a complete browser acceptance test.
- `node test/genmaps.js` — generate/validate the authored large maps. Follow
  its explicit write options; do not edit generated map rows arbitrarily.

Do not execute every `test/*.js` blindly: browser drivers, fixtures, generators,
local-only evidence checks and historical art contracts have different inputs.
See `reports/test-debt-triage.md` and its later amendments before classifying debt.

The browser foundation/campaign changes are separate work packages. Only claim
commands that exist in the current checkout. See `docs/playable-build-01.md` for
acceptance, recovery coverage, human testing and evidence requirements. Keep
structural tests, real-browser completion and human usability results distinct.

## Ownership and safety

- Production script order: `index.html`. Geometry: raw maps plus native scene
  installers. Connections: `world/connections.json` -> generated binding.
- Named-character placement: `narrative/cast/windows.json` -> Cast Presence.
  Conflicting true windows are errors, never first-match-wins.
- Classic scene objects: `world/scene-objects.json`; narrative environmental
  targets still have separate ownership in the adapter until explicitly migrated.
- Generated files must be regenerated from their authoritative inputs.
- The Vault is still documented as canonical; this repository is the deploy
  mirror. Remote agents cannot assert Vault parity or overwrite unseen local WIP.
  Preserve unrelated changes and reconcile accepted PRs deliberately.
- Do not merge, publish, change hosting or deploy without explicit authorization.
  Old documents disagree about webhook vs manual deployment; verify actual
  configuration rather than relying on either historical statement.
- Old outdoor camera/spawn restrictions apply to the legacy 3D renderer. For
  production, use current spawn, collision and traversal tests.

## Narrative changes

Before changing acts, scenes, dialogue, evidence or objectives, read
`docs/narrative/README.md`, then the linked system and craft documents. Story
truth and knowledge/provenance rules start at `docs/story/README.md`.
Run narrative lint and the affected mission/story validators. Locked script
ambiguities need explicit decisions, not silent rewrites to make a test pass.

## Historical architecture and decisions

`Twin Peaks Game.md` retains the project history and MEMORY. Its older viewport,
renderer and deployment descriptions are not current operational instructions.
Use this entry point, executable production code and verified CI evidence for
current status; do not infer release readiness from an old completion report.
