# Town world-cohesion pass v01 (Phase 4, 2026-09-09)

Brief: `../production-vertical-slice-01/town-cohesion-brief.md`. Bible: `docs/world-visual-bible-v0.1.md`.

## What changed

- `js/town-dusk.js` (new): authored day→dusk grade on the existing pre-OBJ palette hook for map `town` only (three-segment luma curve, family rules for ground / vegetation / warm accents / blues, separate asphalt curve for road glyphs via the map rows), an authored emissive table (sheriff and Double R window glows, warm lamp dots, door lamps, stepped ground pools, street-lamp bulbs and pools on the civic strip), and a foreground-band wrap so the painter's-algorithm tree bands are graded too. Deterministic, memoised, integer output, no blur.
- `js/retro-authored.js`: `townDoubleR` and its palette rewritten to the Double R exterior language (charcoal roof, cream clapboard, burgundy fascia and door recentred on tile 42, DOUBLE R on forest board, RR roof sign); the sheriff block of `townHeroAccents` rewritten to the station exterior language (forest roof, oak fascia, sage boards, stone base, oak door on 12,20, SHERIFF board, flagpole); `townSidewalk` repainted as the lot concrete stack (slab, 48 px seams, kerb on road edges). Footprints, doors, bounds and camera focus unchanged.
- `test/town-dusk.js` (new, 17 checks): determinism, memoisation, no black, family classification, ±12 concrete/asphalt match to the Double R lot, emissive rects inside landmark bounds, overlay inert outside `town`.

## Evidence

`before-*.png` (day), `p1-*`…`p4-*` (iterations: ungraded foreground trees, lamp pool floating on a roof, over-bright stone base, gray-fog first grade), `after-{sheriff,diner,street,walk}.png` + `-5x.png` (final).

Measured after grading (max per-channel delta vs the Double R lot): concrete slab 5, seam 0, kerb 0, asphalt 6, shrub 2, burgundy 11, lit clapboard 21.

## Lead review

Pass with notes. The street and both frontages now read as the same evening and the same buildings as their lot scenes (`../production-vertical-slice-01/same-world-sheet.png`). Notes: the RR roof sign reads slightly like a billboard (a roadside pole would need walkable sidewalk tiles); the Double R approach column in town is a path glyph, so its apron stays dirt; buildings outside the slice (pharmacy, hardware, roadhouse) are graded but not re-authored — the roadhouse roof beside the Double R is a flat dark plane.

No visual baseline was advanced automatically; the Coldstage `visual` diff sheet is expected to differ and awaits a scoped review record.
