# Twin Peaks Game — Claude Code entry point

Browser RPG (Twin Peaks fan game, Italian dialogues), Three.js r147 + 2D
canvas fallback, no build step, plain script tags, all globals under `GAME`.

## Commands

- `node test/smoke.js` — structural checks + one full simulated playthrough.
- `node test/walkthrough.js` — data-driven simulator, validates the whole
  clue/act graph (not just one path).
- `node test/genmaps.js` — regenerates/validates the large ASCII maps (BFS
  reachability). Regenerate maps with this script, never by hand.
- `test/shot.sh <map> <x> <y> <dir> <out.png>` — headless screenshot. Chrome
  flags `--headless=new --enable-unsafe-swiftshader --use-angle=swiftshader`
  are mandatory — without them WebGL fails silently (black frame).

## Constraints tests don't yet enforce

- **Deploy**: rsync vault source → `~/Code/solo/projects/twin-peaks-game` →
  commit/push (ember-mind) → manual Deploy in Coolify. Deploy-key repo, NOT
  a webhook — pushing alone does not deploy.
- **Outdoor spawn**: row ≤ 23, unless inside the town's south varco (thinned
  tree row near the Benvenuti sign) — spawns behind the tree barrier are
  hidden from camera.
- **Test order**: all `node test/*.js` green BEFORE opening the browser.
- **Canonical source**: the vault is canonical; `ember-mind/twin-peaks-game`
  is a deploy copy, not source of truth.
- **Map fields**: any field added to a map object in `js/maps.js` must be
  propagated in `js/glue.js` or `render3d.js` sees `null` for it. A test
  guard is planned; until then it's a manual rule.

## Acceptance criteria

`node test/smoke.js` and `node test/walkthrough.js` both green, with no drop
in check/acquisition counts vs. the last MEMORY entry in `Twin Peaks Game.md`.

## Read next

Read `Twin Peaks Game.md` (project root) for architecture and MEMORY — do
not duplicate it here.
