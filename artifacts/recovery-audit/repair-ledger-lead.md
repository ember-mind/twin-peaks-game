# Repair ledger — lead changes (G1–G3), 2026-09-10

| FILE | PRE-AUDIT STATE | REASON FOR CHANGE | APPROVED SOURCE | CHANGE | VALIDATION |
|---|---|---|---|---|---|
| index.html | HEAD b4ef050 version: no `#speaker-portrait-hires[data-speaker-source="narrative"]` / `#speaker-name-hires[...]` overrides, no desktop-cabinet block, no R129 comment (copy kept at `artifacts/recovery-audit/index.html.pre-restore`) | committed `js/retro-ui.js:186-191` sets and `js/engine.js:1571` reads the attribute; the CSS half existed only in the vault; before-repair capture `playthrough-before/act-4/A/station-hook.png` shows the Cooper nameplate missing under the portrait, the approved 22:00 capture shows it | vault `index.html` (canonical authoring copy; superset of repo, +32 −1, all other lines identical) | file replaced by the vault copy | `tools/check-canonical-sync.js` 96/96; `retro-production` 54/54; smoke 420; after-repair capture (phase 12) |
| js/engine.js | HEAD version with comments "viewport nativo" / "centrato nel viewport." (copy at `artifacts/recovery-audit/engine.js.pre-restore`) | `test/retro-production.js` (heartgold_flat_world_projection) requires the literal "viewport DS-like: 16x12 metatile", present only in the vault copy; same authoring session as index.html | vault `js/engine.js` (diff = 2 comment lines) | file replaced by the vault copy | retro-production 54/54; all gates green |
| vault `js/render3d.js` | SIGN_LABELS `traincar:5,6` PONTE (older, commit e72f377 value) | repo `4,6` matches classic `sign_ponte` (`js/maps.js:378`) and adapter `bridge_rail` (`js/narrative-engine-adapter.js:76`) | repo HEAD | repo → vault | canonical-sync 96/96 |
| vault `tools/build-character-life-frames.js`, `tools/build-station-population-frames.js` | absolute coldstage `sharp` path | repo has the portable `require('sharp')` | repo HEAD | repo → vault | n/a (tooling) |
| vault `assets/portraits/cooper-speaker-r1.png` | 567 B, Aug 7 09:48 | repo file is newer and committed (84f5236) | repo HEAD | repo → vault | canonical-sync 96/96 |

Not changed (see gap-classification.md G8–G14).
