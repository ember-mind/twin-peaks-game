# Street fronts — stopped at four rounds

**BAR_WINS. Visual acceptance not achieved.** Package and simulation gates pass.
No conditional prop review or prop repainting was started.

Base: `e8a2c8f5261ca8b7485078087971f288fde007ea`, including the houses and migration.
Branch: `feat/living-town-street-fronts`. All changes confined to this package.

| Round | Same game | Recognition | Walkability | Verdict |
|---|---:|---:|---:|---|
| 1 | 9 | 7 | 8 | BAR_WINS |
| 2 | 9 | 8 | 9 | BAR_WINS |
| 3 | 9 | 8 | 8 | BAR_WINS |
| 4 | 9 | 8 | 8 | BAR_WINS |

## Current gaps

Southern house entrances remain visually ambiguous with their roofs. Night
occupants lose separation from dark interiors and jambs. No map impossibility
was established; these are unresolved drawing problems, not a request to change
collision or migration. The explicit four-round limit ends this run.

## Evidence

[Reference café](evidence/reference-03-noon-cafe.png),
[baseline on the new map](evidence/baseline-street.png),
[current street](evidence/round4-02-street.png),
[west](evidence/round4-06-street-west.png),
[east](evidence/round4-06-street-east.png),
[threshold](evidence/round4-06-street-threshold-east.png),
[night approach](evidence/round4-06-street-approach-night-east.png).

Critic verdicts are preserved verbatim in `critic-1.md` through `critic-4.md`.
Street review used only images and the fixed bar. Extra approach/threshold
frames expanded coverage after criticism; the original cameras and reference
stayed unchanged. The gallery now refuses placements on blocked cells.

## Gates

- Package: `town-places: 36/36`.
- Capture: `{"status":"pass","places":7}`.
- Capture check: `{"status":"pass","stale":[]}`.
- General suite: `PASS living-town/test — 970 checks total`.
- Runtime: Node 24.16.0. Node 26.5.0 fails the existing atlas byte check despite
  identical decompressed pixels; the atlas is unchanged.
- Source scope: only `living-town/content/town-places-v01/`.
- Main suite inclusion of the package remains an owner task outside the fence.

## Release decision

Do not describe this as visual parity or completed acceptance. The release audit
must fail the visual unit and final verdict despite passing technical checks.
