# Sheriff's Station exterior — Golden Concept v01

One authored composition, generated from `prompt.txt` with two strict references (approved interior concept, Double R exterior native reference). No alternatives were generated; iteration stopped at 1.

## Author art-direction review (accepted as Golden Concept)

- **Same building as the interior:** SHERIFF sign family (forest-green board, cream border, cream letters), oak-framed two-leaf glass doors, sage board siding with oak corner boards and window frames, stone base course. Left window shows the reception counter and bulletin board, right window shows desks, filing cabinet and the one warm desk lamp — matching the interior's left/right zoning and its cool-institutional + single-warm-pool lighting.
- **Same world as the Double R exterior:** identical dusk state, cool slate asphalt with faded stall lines and wheel stops, warm-gray concrete apron, conifers cropped in rear corners, low shrubs at plot edges, elevated screen-parallel camera, roof about 45 px / facade about 55 px at native scale.
- **Focal hierarchy:** door + sign first, lit windows second, bench/notice board/flagpole third, vegetation darkest. Approach column clear.
- **Identity contrast:** cool pale green-white glazing against the diner's golden glazing; forest green against burgundy.

## Not to be translated literally

Fine grain on asphalt and concrete, the roof's soft plane shading, the illustrated interior detail inside the windows, and the concept's slight roof perspective are concept-only. The native translation keeps focal hierarchy, palette roles, lighting roles, material identity, density and negative space per `docs/world-visual-bible-v0.1.md` §11.

## Generation note

Gemini (nano-banana) quota was unavailable in this session; the raster was produced through the Codex image tool from the same prompt and references. The concept is a reference, not a native asset.

## Native translation and parity polish (Phase 3B/3C)

- First pass: `native-pass.png` (builder self-review only).
- Polish rounds: `native-polished.png` (bench below window, brighter glazing, roof rim), `native-polished2.png` (siding/oak/roof as three families, warm desk-lamp pool, bottom row opened like the Double R lot with corner shrubs, crisp notice board), `native-polished3.png` (windows rebuilt as lit rooms with legible reception/desk zoning, roof split into two value bands with oak brackets, hard stepped apron pools, warm oak + brass accent pair), `native-polished4.png` (lit openings lifted to the brightest band, three-step pools under windows and door, lamp cap and lit band on the door leaves, steel top edge on the cabinet).
- Runtime: `js/sheriffs-station-exterior-art.js`; scene `js/sheriffs-station-exterior-scene.js` (row 11 open x2..13 like the Double R lot); connections `js/sheriffs-station-location-data.js`.

### Independent critic rounds

Three fresh-context critic rounds (on `native-pass`, `native-polished2`, `native-polished3`) each returned FAIL at 5/10 versus the Double R exterior. Validated and acted on: window legibility and lit-opening hierarchy (rounds 1–4), accent separation (round 2), roof dead plane (round 3), hard-edged pools (round 3–4). Rejected as house style already present in the Double R reference: blocky stepped conifers, rectangular asphalt repairs, the unshadowed player sprite; rejected as factually wrong on the capture: "windows darker than the wall" (glass luma 183 vs siding 145 in round 3), "bench clipped by the window" after round 1.

### Golden freeze

**`native-golden.png` (= `native-polished4.png`) is the Sheriff's Station Exterior Golden Reference.** Lead art-direction verdict: **pass with notes** for commercial native quality on the same street as the Double R exterior — identical asphalt/concrete/vegetation values, same roof and facade heights (44/48 px vs 43/46), same camera and player scale, entrance and sign family continuous with the interior. Notes: the roof plane stays calmer than the concept's mansard by design; the cool station glazing is deliberately less luminous than the diner's gold; no further polish is authorised in this milestone.
