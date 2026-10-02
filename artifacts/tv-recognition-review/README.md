# TV recognition audit evidence

Start with [the paired gallery](index.html) and [the Italian review](../../reports/tv-recognition-review.md).

- Base production source: `7a3de3fd249cc908756a269e116c597bc82f1767`, not the dirty primary checkout and not a certified deployed build.
- Native PNGs: 256×192, production `index.html` through the existing A4 probe. Diagnostic walkable placements, not walked campaign entries. No art changes.
- `main/all-capture.json` is the original capture batch. Its Room 315 record has been superseded by `main/room-315-capture.json` after dismissing the entry dialogue. The consolidated `capture-index.json` selects the current record and verifies each native PNG hash.
- Candidate branches are unmerged alternatives, not the shipped baseline. All four source worktrees were clean when checked.
- Palmer `palmer-day.png` and `palmer-evening.png` are byte-identical. The latter fixture is `ACT4_AFTERNOON`, not a certified night-lighting variant. Retained as an honest comparison, not independent evidence.
- The original MovieMaps hotel photograph is retained under `source-correction/`. Its parent link was mistyped; the lead's temporary Kiana identification was also wrong. `sources.json` records the correction. Final gallery and score use the verified Pilot establishing frame.
- Reviewer notes are independent, and their differences remain visible. Only the main report's synthesis is authoritative for recommendations; aggregate scores in raw notes do not certify any room.
- `contract.json`, `progress.md`, and `evidence-manifest.json` archive the local Gauntlet audit. Contract command/path strings describe the original `.gauntlet/tv-recognition` run layout, not this copied archive. The manifest paths are relative to this folder.

To reproduce diagnostic game captures from this branch:

```sh
node tools/capture-tv-recognition.js . main
node tools/capture-tv-recognition.js . main room-315
```

Output goes to ignored `.gauntlet/tv-recognition/evidence`. The helper neither installs a second renderer nor changes the game. It uses fixture seeds and the existing probe, which can add acquired evidence as setup; this is not unseeded campaign evidence. See flags and actor positions in capture JSON.

Reference photographs/frames are for criticism and comparison, with provenance in `sources.json`; all rights remain with their respective owners. Not a reusable game asset pack.
