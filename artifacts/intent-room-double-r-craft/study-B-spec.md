# Study B — shaped upholstered end cheeks

Independent alternative from committed **pre-study** renderer `7472a39:js/retro-authored.js`, not cumulative polish atop A. Implement by replacing only `interiorBooth` (and restore any A-only `interiorOccupiedTable` offset) in `js/retro-authored.js`. Same w48, x/y/envelope, four footprints, camera, palette, guest and table states. Astra concept B; lead construction choices below.

- Backrest face x+7..40, y−12..−3: dark burgundy field with three broad red upholstered panels separated by dark joints, no full-height six-pixel stripes. Upper 1–2 px lit wood/burgundy cap stays restrained.
- End cheeks left x+1..6 and right x+41..46: stepped outer silhouette (narrow at y−14..−10, wider from y−9..8). Each has dark exterior, burgundy front/inner plane at least 3 px wide and only 1–2 px redHi cap on top. Never fill them pink. They project to y+8 and expose a meaningful 5×8 mass beside table at 1×.
- Seat top x+7..40 around y−2..4, a distinct dark burgundy horizontal plane behind table; small lit leading edge. Guest origin unchanged; chair/cheek must not erase torso/face.
- Independent table between cheek returns, approximately x+7..40, y+1..11 (cream top, darker 2px wood front rim y+12..13). Reposition *only tableware relative to same x/y* if edge support requires it; do not remove authored ready/occupied/cleared variants. Paint table over guest, hands after.
- Short wood feet beneath cheeks around x+2..4 and x+43..45, y+12..16; narrow independent table supports if needed. Leave visible floor gaps and short local contact shadows, no solid cabinet base across width.
- Pixel clusters broad and few: 2–3 values per padded plane, no gradients/noise/speckle. Retain moody Double R value order, not prior broad rose-paneled B.

Capture exact fixed state and crop suite used for A, plus manifest SHA and source revision under `artifacts/intent-room-double-r-craft/B/`. Run same targeted gates. Check production diff touches only `js/retro-authored.js`, independent of A; commit explicit source+artifacts+this spec, no push. Lead judges structural promise before blind review.
