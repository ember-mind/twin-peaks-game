# Room 315 — native translation brief (Phase 3)

Map id: `room_315` (new, 16×12 tiles, 256×192 native, `indoor:true`). Pattern to follow exactly: `js/sheriffs-station-art.js` (palette table + `R(x,y,w,h,color)` integer rects, `definitions[]` with `cells/bounds/shadow/footY`, `draw` = architecture + shadows + player contact + props, `foreground(ctx,cx,cy,minFoot,maxFoot)`) and `js/sheriffs-station-scene.js` (footprints → `authoredRows()` → throw guard against `js/maps.js`, hook install scoped to `mapId`). New files: `js/room-315-art.js` (`GAME.Room315Art`), `js/room-315-scene.js` (`GAME.Room315Scene`), `js/room-315-location-data.js` (`GAME.Room315LocationConnections`), `js/room-315-production.js`.

Golden Concept: `artifacts/room-315-v01/concept.png`. Intent: `intent.md`. Bible: `docs/world-visual-bible-v0.1.md` (§2 clusters, §3 scale, §4 materials, §5 lighting, §6 contact, §7 density, §11 parity).

## Tile plan (x 0..15, y 0..11; walls: rows 0–2 north face, row 11 south wall, cols 0 and 15)

| Footprint id | Cells | Pixel bounds (approx) | Notes |
|---|---|---|---|
| bed | [1,3],[2,3],[3,3],[1,4],[2,4],[3,4],[1,5],[2,5],[3,5] | x16..64, y28..96 | headboard drawn on the north wall face y28..48 (dark walnut, 2 px lighter rim); mattress/sheet from y48; quilt slate-teal, turned back on the east side (a pale sheet triangle at the SE corner); two pillows cream; folded lodge blanket across the foot y84..96 with one ochre + dark stripe band |
| bedsideTable | [4,3] | x64..80, y40..64 | walnut table top; brass lamp with parchment shade drawn up onto the wall face (shade y30..40, stem to table); black telephone 6×4 on the table's south edge. **Lamp is ON**: shade brightest warm value, 3-step stepped warm pool on the table top, on the pillow edge and on the carpet cells (4,4) and (3,4) partial |
| desk | [7,3],[8,3],[9,3] | x112..160, y44..64 | walnut writing desk under the window; tape recorder (dark body, one red pixel) and open notebook (cream, 2 line marks); a tucked chair back as a 4 px walnut rail at y64..68 inside the desk bounds (no extra footprint) |
| dresser | [12,3],[13,3] | x192..224, y40..64 | walnut dresser, 2 drawer fronts with brass pulls; **oval mirror on the wall face above** x198..218, y14..38: dark cool glass with 2 stepped reflections and a 1 px brass rim. Interact target tiles (12,3),(13,3) from (12,4)/(13,4) facing up |
| luggageStand | [13,7] | x208..224, y112..128 | folding stand + closed dark-brown suitcase, brass clasps |

Wall face (rows 0–2, y0..48): upper wall sage-cream pine boards (1 px board lines every 8 px, calm), walnut wainscot y36..48 with 1 px lighter top rim, walnut crown line at y0..2. **Window** x104..168, y6..40: walnut frame 2 px, cold dawn glass in two values, dark stepped pine silhouettes low in the pane, heavy forest curtains 12 px each side in 3 vertical values half-open. **Framed print** x76..100, y12..30 (lake + pines, 4 values). Nothing else on the wall; no bathroom door.

Floor (rows 3–10): slate-teal carpet, quiet two-value field like `drawFloorValueField`, one darker border band 4 px inside the walls. **Cold dawn rectangle** under the window: x104..168, y64..96, two cool paler steps (hard edges). Contact shadows 1–2 px under every prop and the player (`drawPlayerContact` pattern).

South wall (row 11, y176..192): walnut wainscot band; **hall door** single leaf x112..128, y172..192: oak leaf, brass handle, brass "315" plate (3 tiny glyph pixels or a plain brass rectangle 8×3), dark threshold. Trigger cell (7,11); approach column x96..144 must stay empty from y96 to the door.

## Collision / spawns
- `authoredRows()`: walls as in sheriff; footprints above; `cells[11][7] = '.'` (door trigger).
- Wake spawn (from `redroom` door `8,11`): `tx:2, ty:6, dir:'down'` — foot of the bed. Must be walkable and one tile off any trigger.
- Hall connection (LocationConnection `great-northern-room-315-hall`): a = `room_315` triggers `[[7,11]]` spawn `{tx:7, ty:10, dir:'up'}`; b = `hotel_gn` triggers `[[14,1]]` spawn `{tx:14, ty:2, dir:'down'}` (hotel_gn row 1 becomes `'ifffffffffffiiDiii'`; its old room cells row 1 x13..15 `KKU` are removed, `interact '15,1'` moved to room_315 objects, `onEnter` moved to room_315).

## Lighting roles (the two things a critic checks first)
1. Cool dawn plane: window glass and the floor rectangle are the brightest cool values; the wall above the desk and the desk top take one cooler step.
2. One warm pool: lamp shade > table top > pillow edge > carpet steps. No other warm light. Brass fittings are single warm highlight pixels, not light sources.

## Parity checklist
1. Focal order: bed + lit lamp → window → desk/dresser/mirror → luggage stand.
2. Materials: walnut rims/joints, pine board lines, carpet two-value field + border, bedding broad planes with ≤3 crease lines, curtain folds, cold glass with stepped reflections.
3. Grounding: contact bands under bed, table, desk, dresser, stand, player.
4. Density: ≤8 readable objects, open floor from bed foot to door and door to dresser (2-tile lines).
5. Same game as the sheriff interior: same wall height (48 px), same player, same cluster size; identity = walnut + slate-teal + amber, cold dawn.
