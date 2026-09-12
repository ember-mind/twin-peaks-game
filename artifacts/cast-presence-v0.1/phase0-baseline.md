# Phase 0 baseline — 2026-09-12

## git status (short)
      10
 M index.html
 M js/narrative-engine-adapter.js

## untracked
?? artifacts/cast-presence-v0.1/
?? js/cast-inspector.js
?? js/cast-report.js
?? reports/qwen-cast-continuity-guard.md
?? reports/qwen-cast-inspector-m1-m5.md
?? test/cast-continuity.js
?? test/cast-inspector.js
?? test/cast-report.js

## canonical sync
canonical-sync: FAIL
  checked=99 equal=90 known=0 errors=9
  ERROR index.html [unaudited_divergence]
  ERROR js/cast-inspector.js [canonical_missing]
  ERROR js/cast-report.js [canonical_missing]
  ERROR js/diorama.js [canonical_missing]
  ERROR js/engine.js [unaudited_divergence]
  ERROR js/narrative-engine-adapter.js [unaudited_divergence]
  ERROR js/retro-authored.js [unaudited_divergence]
  ERROR js/sheriffs-station-art.js [unaudited_divergence]
  ERROR js/town-dusk.js [unaudited_divergence]

## narrative lint
WARN  [read-before-write] KNOWN-OPEN: proposition_path "P7.formulation.status" is read but never written by any mission effect, and has no declared external writer [owner: M9 pass: formulate P7 or cut the dead presentation branch; found 2026-09-10, narrative-lint v0.1 first run; M9's m9_present_truman node (narrative/missions/M9.json:517) has a presentation.on.P7 branch, but no mission node anywhere formulates P7 (no {proposition: "P7", to: "formulated"} effect exists); the branch is currently dead code.]
narrative-lint: PASS (7 checks, 1 warnings)

## story truth lint
story-lint: PASS (1043 checks, 0 warnings)
story-truth-lint: PASS
