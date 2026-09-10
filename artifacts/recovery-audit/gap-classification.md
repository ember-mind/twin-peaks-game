# Gap classification (lead decision, 2026-09-10)

| id | discrepancy | type | priority | decision |
|---|---|---|---|---|
| G1 | `index.html` in repo lacks the narrative-widget portrait/name CSS overrides (`[data-speaker-source="narrative"]`), the R129 percentage comment and the desktop-cabinet block; committed `js/retro-ui.js:186-191` sets the attribute and `js/engine.js:1571` reads it; vault has the coherent file (superset, +32 −1) | A accidental loss | P1 (every narrative dialogue box) | RESTORE index.html from vault (exact approved version; all other lines identical) |
| G2 | `js/engine.js` comment-only divergence from vault (2 lines) | D mirror drift | P2 | take vault version (same authoring session as G1) — no runtime effect |
| G3 | vault stale vs repo: `js/render3d.js` PONTE 5,6→4,6 (repo matches `sign_ponte` at maps.js:378 and adapter bridge_rail), `tools/build-*-frames.js` (portable `require('sharp')`), `assets/portraits/cooper-speaker-r1.png` (repo committed 84f5236, newer) | D mirror drift (vault side) | P2 | mirror repo→vault for these three items |
| G4 | `test/narrative-validate-m9.js` pins M8 `runtime_total === 12`; M8 has 16 nodes by approved pass 01 | E | P2 | re-pin to 16 |
| G5 | `test/retro-production.js` pins cache tag `?v=18act3c`; live tag `19act4b1` (pass 01) | E | P2 | re-pin |
| G6 | `test/narrative-repair-contract.js` expects "Perché" in `anello.desc`; story CHANGELOG 2026-09-10 retired that wording | E | P2 | update the assertion to the canonical wording |
| G7 | `test/double-r-exterior-native.js`, `test/double-r-location-native.js` DOM mocks lack `getAttribute`; engine.js:1571 calls it (real DOM has it; browser playthrough proves runtime) | E | P2 | add `getAttribute` to the two mocks |
| G8 | coldstage.config.mjs, test/coldstage-config.js, test/coldstage-baselines/** deleted in repo before b5de5d2; vault copies exist; "no coldstage for now" standing | G | — | UNTOUCHED — lead decision needed (restore from vault or accept the deletion) |
| G9 | sprite-gates: one profile sprite 15 px wide vs 12–14 bar (cast commit d089490 era) | C (art) | — | UNTOUCHED — art gauntlet scope, not narrative recovery |
| G10 | Norma/Shelly/James/Log Lady rendered both in the Roadhouse crowd and at their classic diner posts during the night window; diner route text keeps Norma at the diner | C (design tension) | — | UNTOUCHED — needs a design decision (classic conds have no OR); recorded as known debt |
| G11 | `narrative_m8_owned` written (`js/narrative-production.js:162`) and read nowhere since the Palmer duplicates were retired | C (dead write) | — | UNTOUCHED — harmless; remove only in a deliberate cleanup |
| G12 | vault-only `js/station-population-scenes.js`, unreferenced by any index.html | G | — | UNTOUCHED — report |
| G13 | Roadhouse / lake shore native | F | — | UNTOUCHED (Environment Pass D not started; no partial work exists) |
| G14 | `docs/narrative-system-v0.1.md` §4 says "Nine templates", table and folder have 10 | E (doc) | — | UNTOUCHED — methodology docs frozen during recovery |
