# Footbridge / traincar — native translation brief (D2)

Golden Concept: `traincar-concept.png`. Target: native **24×12 tiles (384×192 logical, one screen tall, horizontal scroll)**, same pipeline as `js/hospital-art.js` / `-scene.js` / `-production.js` but with the **exterior hook pattern** of `js/sheriffs-station-exterior-scene.js` (drawTile no-op on authored rows, drawStructures, drawForegroundStructures, `limitBackgroundPalettes` bypass, camera south of the player). Not built in this pass (D3).

Authored state: **late afternoon, overcast** (single state; no `town-dusk` grade; no directional shadow). Bible amendment proposed with the design report: one weather state per outdoor investigative scene.

## Tile plan (replaces the 24×14 `traincar.rows` in `js/maps.js`)

```
      000000000011111111112222
      012345678901234567890123
 0    TTTTTTTTTTTTTTTTTTTTTDTT   north canopy face (48 px, rows 0–1) · D (21,0) → oej, needsFlag east_route_confirmed
 1    TTTTTTTTTTTTTTTTTTTTTpTT   canopy face continues; cut opening at 21
 2    TggwwgggggggggggggggSpgT   creek w (3-4) · sign_oej S (20,2) · path p (21,1..6)
 3    TggwwggggiiiiiiiigggkpgT   car north rim i (9..16,3) [stove on rim at 12,3] · tracks_north landmark at (21,2), reached from (21,3); Hawk state 3 at (22,3) facing up
 4    TggwwggggifffffffigggpgT   interior f (10..16,4..6) · bent sheet at (16,4)
 5    TggwwggggifffffffigggpgT   crossbeam (12..14,5) with ring at (13,5) · scene_center landmark (12,5)
 6    TggwwggggifffffffigggpgT   torn seat + cards (10,6) · mound (13,6) just inside the door
 7    ppBBpprrrrrrriiiDiiiirpgT   bridge planks B (2-3,7) · rails r (6..12 and 21) · car south rim with door D at (13,7) · rails end under the car's east trucks (17,7)
 8    TggwwggggggggggggggggggT   open ballast (grass g here is ballast in art; collision = walkable)
 9    TggwwggggggggggggggggggT   Hawk state 2 at (14,8) facing down · Truman at (9,8) facing right
 10   TggwwggggggggggggggggggT   spawn from town (1,7) facing right (door 0,7 → town 54,14)
 11   TTTTTTTTTTTTTTTTTTTTTTTT   south tree line
```

Legend for the map generator: `T` tree/solid, `g` walkable ground (art decides ballast vs grass), `p` walkable path, `w` creek (solid), `B` bridge plank (walkable), `r` rail (walkable), `i` car rim (solid), `f` car floor (walkable), `D` door tile, `S` sign (solid, interact), `k` walkable landmark tile. Collision must be inferable from art alone (Bible §8): rim, creek and trees are the only solids besides the sign.

## Interactables (WORLD_TARGETS after the re-key; faced tile = target)

| id | kind | tile | player stands | node |
|---|---|---|---|---|
| bridge_rail | landmark | (4,6) east parapet above the planks | (4,7) facing up | m5_bridge |
| traincar_entrance | landmark | (13,7) door | (13,8) facing up | m5_discovery |
| mound | object | (13,6) | (13,7) door tile facing up, or (12,6)/(14,6) | m5_mound |
| ring | object | (13,5) on the beam | (13,6) facing up | m5_ring |
| scene_center | landmark | (12,5) west half of the beam | (12,6) facing up: the player stands in the empty middle of the floor, beside the door→mound→ring column | m5_scene |
| stove | object | (12,3) rim | (12,4) facing up | m5_stove |
| cards | object | (10,6) | (11,6) facing left | m5_cards |
| tracks_north | landmark | (21,2) | (21,3) facing up (the tile before the cut) | m5_tracks_north / _early |
| sign_oej | sign | (20,2) | (20,3) facing up | m5_sign_oej |
| truman | actor | (9,8) | adjacent | m5_report_intro |

Rule: door → mound → beam/ring are one column (x = 13) so the "una linea sola" page is literally visible; scene_center sits one tile west so the positional page is earned by walking *into* the empty middle, not by examining the ring twice.

Re-key list for D5: adapter `WORLD_TARGETS.traincar`, `NARRATIVE_ENTITIES` hawk/truman coords, `js/environmental-inspect.js` traincar keys, `test/act-3-flow.js` entity-position assertions, harnesses under `test/m5-*.html`, `js/traincar-location-data.js`.

## Definitions (props with `cells`, `bounds`, `shadow`, `footY`)

1. `creek` cells (3..4, 2..10): flat slate plane, 2–3 pale ripple clusters per screen, 1 px darker bank line each side; a 1-tile ochre bank strip (2 and 5) either side.
2. `bridge` cells (2..3,7) + parapets drawn on rows 6 and 8 as wall-face-only: warm grey timber planks, 1 px joints; **west half two values paler (worn)**; rails as thin posts + top bar; contact shadow on the creek.
3. `stake` cell (2,6): county survey stake, 6 px tall, pale tape strip 2 px (the one saturated-pale note).
4. `rails` cells (6..12,7) and under the car to (17,7): two 1 px steel lines on dark ballast, ties every 4 px; they **stop under the east trucks** with a visible buffer block at (17,7).
5. `car` bounds (9..17, 2..7): body = three values of oxidised red-brown + one paler faded panel (east half of the south face), 1 px rust streaks (max 3); black trucks and wheels on row 7 south edge; **roof cut**: the north rim (row 3) carries a 48 px-scale wall face like an interior north wall (Bible §9 amendment), east/west rims 1 tile, south rim 1 tile with the open door at 13. Interior floor: pale grey dust (quietest plane inside), unbroken.
6. `mound` cell (13,6): dark earth, 2 values, one 2×2 pale paper corner cluster.
7. `crossbeam` cells (12..14,5): warm grey timber beam, 1 px highlight; `ring` = 2×2 pale cluster at the exact centre (13,5); the ring is **part of the beam definition and hidden when `s1` is set** (the sprite leaves the beam in both custody branches: scene module reads `values.s1`).
8. `seat` cell (10,6): torn bench, rust-brown with a torn ochre patch; `cards` = 2–3 tiny pale rectangles at its foot, one with a red pip.
9. `sheet` cell (16,4): bent corrugated metal, 2 cool greys, one crisp highlight.
10. `stove` cell (12,3) on the rim: black iron box with a pipe rising onto the wall face; **one ash-grey cluster + one 2×2 ember cluster** (the only warm accent on the map).
11. `signOej` cell (20,2): weathered board with arrow, native glyphs "ONE EYED JACKS" (two lines, `js/retro-font.js`).
12. `tracks` cells (18..21, 2..6) diagonal: small dark stepped foot marks, 3–4 px, leading from the car's north-east corner to the cut at (21,1); they are the only diagonal marks on the map.
13. Post-report overlay (`flags.east_route_confirmed || values.s1`): `tape` across the door at (13,7) (2 px pale band) and `stake2` at (4,7) bridge east end (county tape). Painted by the scene module on the flag; never a second map (Bible amendment).
14. Trees: north canopy face rows 0–1 (48 px), south line row 11, the same stepped conifer family as the station exterior; the cut at (21,0..1) is a gap with a darker interior.

Wall-face-only (no footprint): the stove pipe, the sign post height, the bridge parapets.

## Palette roles

Reuse the station exterior families where the material is the same; new families only for what the station lacks.

- Vegetation: `forest '#233a2f'`, `hedge '#2f4d3b'`, `hedgeHi '#3e6248'` unchanged (evergreen wall darkest).
- Ballast / wet gravel (new, cool): base `'#5c6168'`, dark stones `'#474b52'`, pale stones `'#767b82'`; ties `'#3c3a36'`; rail steel `steelDark '#7d8785'` + 1 px `steel '#aeb6b3'`.
- Dead grass (new, ochre): `'#8a8558'` base, `'#9c9663'` tufts (sparse 2 px), `'#726e49'` shade.
- Creek slate (new): `'#4f5e6a'` base, `'#5f7080'` ripples, bank line `'#3d4852'`.
- Timber (bridge, beam): `oak '#9a6a3e'` family is too warm; use grey timber `'#8c8474'`, `'#a39a86'` worn, `'#5e584c'` joints.
- Car body (new, rust): `'#6e3a2e'` base, `'#8a4a38'` mid, `'#5a2e24'` shade, faded panel `'#a08a7a'`, rust streak `'#3f2219'`; trucks `'#1f1d1c'`.
- Interior dust floor: `'#9a9791'` with `'#8c8984'` rim shade — quiet, close to the ballast in value but warmer by one step so the inside reads as sheltered.
- Earth (mound): `'#4a3a2c'`, `'#5e4a37'`; paper `paper '#d8d6c6'`.
- Stove: `'#1c1b1a'` body, ash `'#8f8d86'`, ember `'#c2622a'` (the only saturated warm).
- Tape / stake: `'#d9d4b8'` pale; stake wood `'#8c8474'`.
- Sign: board `'#7f6a4c'`, letters `paper`.

Value order (test gates, luma): county tape ≥ car faded panel > car body mid > ballast pale stones > dead grass > interior dust ≈ ballast base > creek > evergreen. Native test asserts: exactly one ember-hue cluster inside the car bounds; no pixel warmer than the ember outside the four sprites; dust-floor luma variance inside (10..16,4..6) below a small threshold (unbroken film); creek luma < ballast luma; tape luma > car body luma + 20.

## Hawk / Truman states

| state | condition (adapter `when`) | Hawk | facing |
|---|---|---|---|
| 1 | ¬vagone_scoperto | (5,7) east end of the bridge | left (planks) |
| 2 | vagone_scoperto ∧ ¬s1 | (14,8) outside the door, one tile east | down (back to the door) |
| 3 | s1 set | (22,3) beside the tracks at the cut | up |

Truman: value_set m5_final_theory ∧ ¬east_route_confirmed at (9,8) facing right, on the rails' south edge ("arriva lungo i binari"). Nobody stands in the door column (13, rows 8–10).

## Parity checklist (concept → native)

- [ ] Three zones read at 1×: bridge+creek left, car centre, cut+sign right, in one scroll.
- [ ] Rails visibly stop under the car's east trucks; nothing east of the car but grass and tracks.
- [ ] From (12,6)/(13,6): door, mound, seat+cards, sheet, beam+ring, stove all on screen with no rim occluding them (roof cut; rim 1 tile; north face on the rim only).
- [ ] Worn planks two values; stake with tape on the west bank.
- [ ] Foot tracks are the only diagonals; rails the only straight lines; trees the only crooked silhouettes.
- [ ] One ember; no other saturated warm.
- [ ] 48 px north face on the canopy AND on the car's north rim; player scale as the station exterior.
- [ ] After `s1`: ring gone from the beam; after `east_route_confirmed`: tape on the door, stake at the bridge.
- [ ] Nothing from the town dusk grade; no lit openings.

## Concept-only elements dropped

Fifth sprite at the bottom; gravel speckle; two-row south tree line; the car's ten-tile width; soft rim shading; plank grain.
