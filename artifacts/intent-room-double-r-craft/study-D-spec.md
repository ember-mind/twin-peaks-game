# Study D — tabletop slab over open knee space

Independent alternative from **pre-study** renderer `7472a39:js/retro-authored.js`, not A/B accumulation. Change only `interiorBooth`, adjust tableware offsets only if needed. Same 48 px module, guest origins/table states/footprint/palette.

This tests table construction more than upholstery: retain recognizable dark burgundy rear booth and moderate vertical seams, but do **not** paint continuous wood/red cabinet face under cream table.

- Backrest stays x+2..45, y−15..−3, with fewer/briefer highlights than baseline; seat top dark red at y−2..5 partly occluded.
- Table slab x+5..42, top y+1..10. North light edge 2 px, broad cream/creamShade plan, woodHi front rim y+11..12, woodDark underside exactly y+13. It should read as top plus thickness, not 12-px vertical cream front face. Existing menu/cups/plate/guest hands must land on top. Do not add objects.
- Under slab y+14..16: real floor visible at sides of one slim central pedestal x+22..25, with a short foot x+19..28 at y+16..17. Booth has two separate edge feet, no full-width red apron/contact band. Tight contact marks only at feet/pedestal; prevent a 48-px black stripe.
- Keep independent side end posts restrained; no new broad cheek masses (that is B) and no significantly exposed red seat wings (that is A). This alternative isolates tabletop/negative-space causal change.
- No antialias, gradients, noise, palette-only modifications, map/character/lights/timing edits.

Capture same native whole/occupied/ready/cleared/Act4 views, nearest 4× crops, hashes and source revision under `artifacts/intent-room-double-r-craft/D/`. Run same targeted tests; commit source+artifacts+spec explicit. Lead reviews causal improvement at 1× before final comparison.
