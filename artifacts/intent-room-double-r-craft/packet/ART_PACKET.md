# Double R booth/table — focused art packet

## Narrow problem

Improve **drawing craft of one 48 px booth module and its table**, then repeat one grammar across four modules. Preserve room massing, camera, floor, counter, walls, lights, characters and temporal life. This packet is factual evidence plus lead diagnosis, not a redesign instruction.

## Compare at native scale first

- Approved visual golden: `../../diner-final-art/final.png` (1280×960 = nearest 5× native). The packet also contains its corresponding lower-left crop.
- Current whole-room, canonical population: `normal-populated-native.png`, 256×192.
- Lower-left occupied booth/table: `booth-table-populated-native.png` (64×48 at screen x24..87, y128..175), then `booth-table-populated-4x.png` nearest-neighbor.
- Same local crop with named Cast disabled: `booth-table-unpopulated-native.png`. It is **not empty**: generic seated guest belongs to authored interior model and remains. Compare `unpopulated-native.png` for room architecture without named Cast.
- Alternate Act 4 named Cast: `act4-maddy-leland-native.png`. Empty/cleared booth crops also included in manifest.
- `manifest.json` records capture commands, exact dimensions, SHA-256 and limits. The reference is art direction; current production frame is baseline, not external reference.

## Current drawing, exact constraints

`js/maps.js` diner interior at lines 229–245 owns four `[tx,ty,widthTiles]` booths: `(1,6,3)`, `(10,6,3)`, `(1,8,3)`, `(10,8,3)`, 48 px each. Guests `[null, right-seat, left-seat, null]`; empty booth 0 ready, booth 3 cleared. `js/double-r-location-production.js` derives map layout from this model and existing solid row glyphs. Do not edit it.

`js/retro-authored.js` lines 4256–4262 palette: red `#8c2f3e`, redHi `#c45a61`, redLight `#e28b80`, redDark `#501f29`; wood `#5b3a28`, woodHi `#946345`, woodLight `#b88759`, woodDark `#35271f`; cream `#f4e6c8`, creamShade `#cfbc92`; ink `#292b26`; metal `#81918b`, metalHi `#d9dfc9`. Reuse family; this study cannot win by hue only.

`interiorBooth` at lines 4384–4421 receives screen-local anchor `(x,y)`, width `w=48`, variant index, optional generic guest. Paint order now:

1. Ground/contact at y+13..18; rear cabinet/backrest x..x+47, y−15..15.
2. 6-px vertical upholstered ribs y−13..2, short dark seat plane y−1..6, thin wood stripe y+7..8.
3. Generic seated pose x+8 or x+w−25, origin y−16; front table then covers body below chest.
4. Table x+3..x+w−4, top y+1..11, cream top edge 3 px, wood front rim y+12..13; red apron y+14..15, side posts y−12..14.
5. Table state props; guest hands redraw over tabletop; small highlights.

`interiorTableProps` lines 4298–4312 and `interiorOccupiedTable` lines 4367–4383 depend on tabletop position. `interiorSeatedGuest` lines 4313–4351 and hands lines 4355–4365 must still have believable occlusion. `R()` draws integer rectangles; no antialias/gradient/dither/noise. Shared `interiorContact` exists at lines 4263–4269, but booth contact may be drawn specifically within current envelope.

Native composition: 14×10 map centered in 256×192; entrance player `(6,8)` up. Collision `t` solid at each 3-cell table row and `h` solid behind (left backrest first two cells, right backrest last two); south door cells `(6,9),(7,9)`. Booth helpers are ground pass; actor sprites later drawn by foot depth. No moving any footprint, NPC, door, camera or sprite. Booth static warm pools already have strengths `[.75,1.05,.9,.5]`; no new light or animation. Four repeated modules must remain one visual language with only existing occupancy/table-state differences.

## Lead diagnosis from actual native frame

**Strengths:** Burgundy booth modules identify diner; fourfold rhythm frames social routes; cream table plane reads; seated guests and practical warmth integrate. Baseline already more composed than broad pink-padded prior trial.

**Weaknesses:** Backrest is largely a frontal striped rectangle; dark seat plane is quickly covered by table and has little visible thickness. Cream tabletop almost spans booth width, leaving only slender side returns. Table face, booth side posts and floor contact form a stacked frontal border; where table ends and upholstered seat begins is ambiguous. At 1×, extra rib pixels do not rescue form. Generic guest reads, but body/table contact could be clearer.

**Art question:** Within same silhouette envelope and colors, can plane hierarchy, shaped side returns, narrower/stepped tabletop, true seat lip, contact/occlusion and disciplined clusters make furniture read as a booth with a table rather than decorated wall plus cream strip? Preserve appealing moody Burgundy, room identity, existing guest hands, authored table states, and all four-booth rhythm.

Prior broad study B used large rose panels and looked flat/oversaturated; B3 made tiny front changes that disappeared at 1×. Neither is the target solution. Design five meaningfully different **construction** solutions, not palette alternatives. For each identify visible planes, thickness source, floor contact, table relation, upholstery/wood separation, native-size gain and main risk. No code changes in art-direction step.
