# Real-build playthroughs — recovery audit, phase "after repair"

Same protocol as `artifacts/recovery-audit/playthrough-before/README.md`, run
after the repair (index.html and js/engine.js restored from vault; test pins
applied). Driven on the real production build (`index.html`) in headless
Chrome via CDP, real key presses only (no direct-API shortcuts). Each driver
starts its own `python3 -m http.server` and its own Chrome instance; runs
were sequential.

The approved-snapshot dir from the "before" phase
(`artifacts/recovery-audit/approved-snapshot/`) was confirmed still identical
to the current `artifacts/act-3-closure/` and `artifacts/act-4-implementation/`
(`diff -rq` empty, `git status --porcelain` empty) before this phase started,
so it was reused rather than re-taken. After every run the fresh output was
moved out and the approved dirs restored via `rsync -a --delete`.

Fresh outputs from each run live under `artifacts/recovery-audit/playthrough-after/act-3/`
and `.../act-4/{A,B,C}/`.

## Act 3 — `node test/act-3-playthrough.js --path=impeto-kept`

- **Command:** `node test/act-3-playthrough.js --path=impeto-kept`
- **Exit code:** 0
- **Assertions:** 58/58 passed, 0 failed (same as before)
- **Direct-API fallbacks:** 0
- **Console/runtime errors:** 1 — favicon 404 from the test HTTP server (harness noise, same as before)
- **Driver observation:** same as before — `{"path":"impeto-kept","kind":"obiettivo mai mostrato","objectives":["Segui la rotta oltre il confine: One Eyed Jacks."]}`, still present after the repair.

## Act 4 — `node test/act-4-playthrough.js --path={A,B,C}`

### Path A
- **Exit code:** 0
- **Assertions:** 112/112 passed, 0 failed (same as before)
- **Direct-API fallbacks:** 0
- **Console/runtime errors:** 1 — favicon 404 (harness noise)

### Path B
- **Exit code:** 0
- **Assertions:** 108/108 passed, 0 failed (same as before)
- **Direct-API fallbacks:** 0
- **Console/runtime errors:** 1 — favicon 404 (harness noise)

### Path C
- **Exit code:** 0
- **Assertions:** 105/105 passed, 0 failed (same as before)
- **Direct-API fallbacks:** 0
- **Console/runtime errors:** 1 — favicon 404 (harness noise)

## Before vs after comparison

| run | before | after | delta |
|---|---|---|---|
| Act 3 `impeto-kept` | 58/58 pass, 0 fb, 1 console err | 58/58 pass, 0 fb, 1 console err | none |
| Act 4 `A` | 112/112 pass, 0 fb, 1 console err | 112/112 pass, 0 fb, 1 console err | none |
| Act 4 `B` | 108/108 pass, 0 fb, 1 console err | 108/108 pass, 0 fb, 1 console err | none |
| Act 4 `C` | 105/105 pass, 0 fb, 1 console err | 105/105 pass, 0 fb, 1 console err | none |

No change in assertion counts, fallback counts, or console-error counts
between before and after. Same single Act 3 driver observation (unshown
objective text) persists post-repair.

## PNG size diff (before vs after, >5% threshold)

All screenshots are re-rendered per run (headless Chrome + PNG re-encode), so
some byte-level jitter between runs is expected even with no visual change.
Sizes below are for content that passed every pixel/structural assertion in
both runs; this is a size diff only, not a verified visual regression.

### Act 3 — all 6 PNGs exceed 5%

| file | before (bytes) | after (bytes) | diff % |
|---|---|---|---|
| room-315-onenter-night.png | 97563 | 91998 | 5.7% |
| comparison-ring-feedback.png | 77906 | 72042 | 7.5% |
| truman-contest-impeto.png | 77950 | 87850 | 12.7% |
| atto4-s1-echo.png | 82338 | 91986 | 11.7% |
| lucy-impeto.png | 83445 | 87769 | 5.2% |
| hospital-guard.png | 79524 | 88263 | 11.0% |

### Act 4 path A — 9 of 12 PNGs exceed 5%

| file | before (bytes) | after (bytes) | diff % |
|---|---|---|---|
| shore-before-discovery.png | 86033 | 79992 | 7.0% |
| threshold-widget-47-30.png | 82868 | 76873 | 7.2% |
| route-arrival-A.png | 76519 | 70491 | 7.9% |
| diner-maddy-leland.png | 96809 | 90992 | 6.0% |
| shore-after-discovery.png | 85842 | 79980 | 6.8% |
| station-hook.png | 82939 | 87401 | 5.4% |
| roadhouse-phone-widget.png | 80283 | 74146 | 7.6% |
| roadhouse-populated.png | 79477 | 73450 | 7.6% |
| roadhouse-giant-stage.png | 79742 | 73690 | 7.6% |

route-arrival-B.png, route-arrival-C.png, route-arrival-D.png: unchanged (0%).

### Act 4 path B — 1 of 12 PNGs exceeds 5%

| file | before (bytes) | after (bytes) | diff % |
|---|---|---|---|
| route-arrival-B.png | 85727 | 79788 | 6.9% |

All other 11 files in path B: byte-identical (0%).

### Act 4 path C — 1 of 12 PNGs exceeds 5%

| file | before (bytes) | after (bytes) | diff % |
|---|---|---|---|
| route-arrival-C.png | 95815 | 89878 | 6.2% |

All other 11 files in path C: byte-identical (0%).

**Note:** Act 4 path A shows far more churn (9/12 files) than B or C (1/12
each), all in the same direction pattern seen elsewhere (roadhouse/shore/
threshold shots), which is consistent with re-render jitter rather than a
content change, since every underlying assertion (pixel/structural, text,
HUD, entity, console) passed identically in both runs. Flagging path A's PNG
set for a visual spot-check is still warranted given it diverges more than
B/C.

## Final check

```
git status --porcelain artifacts/act-3-closure artifacts/act-4-implementation
```
→ empty after every run in this phase (confirmed after Act 3, after Act 4 A,
after Act 4 B, and after Act 4 C). No tracked file was edited.
