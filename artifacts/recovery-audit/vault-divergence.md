# Vault ↔ repo divergence (checksum, audit start 2026-09-10 23:05)

Repo = HEAD b4ef050, clean tree. Vault = canonical authoring home.

## Content differs

| file | repo | vault | evidence | verdict |
|---|---|---|---|---|
| index.html | lacks 32 lines: desktop-cabinet box-shadow, R129 portrait % recompute comment, `#speaker-portrait-hires[data-speaker-source=narrative]` and `#speaker-name-hires[...]` overrides | superset of repo (+32 −1) | repo js/retro-ui.js:186-191 SETS `data-speaker-source=narrative`, js/engine.js:1571 READS it; the consuming CSS exists only in vault. Never in git history (`git log -S 'Desktop cabinet'` empty). Vault mtime 22:07:29 = repo file mtime at the lead's rsync (rsync -a preserves mtime); commit b5de5d2 (22:56) has the reverted version | TYPE A accidental loss in repo; vault authoritative |
| js/engine.js | comments 'viewport nativo' | comments 'DS-like' / '256x192' | comment-only, 2 lines | trivial, leave repo |
| js/render3d.js | SIGN_LABELS traincar:4,6 PONTE | traincar:5,6 | adapter WORLD_TARGETS.traincar.bridge_rail = 4,6 (js/narrative-engine-adapter.js:76) | repo correct; vault stale (TYPE D vault side) |
| tools/build-character-life-frames.js, tools/build-station-population-frames.js | require('sharp') | absolute coldstage sharp path | repo is the portable form | repo correct; vault stale |
| assets/portraits/cooper-speaker-r1.png | 546 B, Aug 7 09:52, committed 84f5236 | 567 B, Aug 7 09:48 | repo newer and committed | repo correct; vault stale |

## Vault-only

- js/station-population-scenes.js (3110 B, Sep 9) — referenced by no index.html (repo or vault); orphan.
- coldstage.config.mjs, test/coldstage-config.js, test/coldstage-baselines/** — DELETED in the repo working tree by an unknown process before b5de5d2 (commit records the deletions; session-start git status still showed them as M). Standing instruction: 'do not use coldstage for now'. TYPE G: intentional removal vs accidental loss undecidable here.

## Repo-only (never mirrored, concurrent art/QA session)

- test/choice-prompt-dedup.js, notebook-objective.js, objective-notebook-visibility.js, objective-resolver.js, walk-phase-contract.js, production-motion-capture.html, retro-cast-motion-board.html; tools/{audit-cast-atlas.sh, build-cast-atlas.sh, build-character-atlas.sh, export-native-cast-matrices.js, rebuild-generated-cast.sh, refine-authored-group-b.js, refine-authored-motion.js}; test/hd2d-cabin-* (codex prototype).
- All other js/test/docs differences are mtime-only (rsync -c equal).
