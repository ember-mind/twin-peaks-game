# World Visual Bible v0.1

Art-direction contract for every environment that claims to belong to the Twin Peaks game world. Extracted from the approved references, not invented:

- Double R Interior Golden: `artifacts/diner-final-art/final.png`
- Double R Exterior Native Reference: `artifacts/double-r-exterior-v02/native-clean.png`
- Sheriff's Station Golden Concept: `artifacts/sheriffs-station-main-interior-v01/final.png`
- Sheriff's Station Native Golden (parity polish): `artifacts/sheriffs-station-main-interior-v021/native-after.png`

This is a contract, not a material engine. Rules are written so a reviewer can fail a scene against them. Numbers are native pixels at 256×192 unless stated.

## 0. World state of the current slice

One authored state: **early dusk**. Exterior ground is cool blue-gray slate; sky is never drawn; vegetation is the darkest family; lit openings (windows, glass doors, signs) are the brightest exterior values. Interiors keep their own practical identity (Double R warm hospitality, Sheriff's Station cool institutional + one warm task lamp) but must read as lit rooms seen at evening: warm or cool light inside, never daylight. No day/night system, no time value — a scene either belongs to this state or is not in the slice.

Amendment (Room 315, 2026-09-09): a narrative beat may own a second authored state when the beat requires it. Room 315 is authored at **dawn, 6:20** — cool blue-gray window plane as the ambient, one warm tungsten lamp as the only warm source. It is a single static state bound to the wake-up beat, not a time system; no other environment may adopt it without its own beat-level justification. Reference: `artifacts/room-315-v01/native-golden.png`.

## 1. Camera language

- Framebuffer 256×192, 16 px world grid, 16×12 tile viewport, integer scaling only, nearest-neighbour.
- Elevated top-down: front elevations parallel to the screen; roofs and table tops are seen from above as flat planes; walls have zero perspective. No isometric diagonals, no vanishing points, no foreshortened floors.
- Exteriors: building front faces the bottom of the frame; the player approaches from below; the entrance sits on the building's south edge with a straight, unobstructed approach column.
- Interiors: south wall carries the entrance; the north wall carries the primary focal wall (counter, sheriff desk, map).
- A concept's apparent roof or ceiling depth is authored elevation, not projection. The native scene is allowed to compress it.

## 2. Pixel scale and cluster discipline

- Every mark is an integer rectangle at native scale. No sub-pixel edges, no anti-aliasing, no gradients, no blur, no noise textures, no raster filters.
- Smallest meaningful cluster: 2×2. Single pixels only as deliberate highlights or reflections, never as texture.
- Materials are built from broad flat planes plus a few placed accents (one to three per surface). If a surface needs more than five distinct colours it is doing too much.
- Text uses the native glyph vocabulary (`js/retro-font.js`); no rasterised typography.
- Reject: speckle, dithering fields, "AI-smear" edges, anything that reads as photographic grain when scaled 5×.

## 3. Player-to-architecture scale

- Cast presentation is the 24 px-derived HeartGold atlas on the 16 px baseline; the player is roughly 1.5 tiles tall.
- Doors: one leaf = 16 px wide; entrances are two leaves (32 px) centred on the building's approach column. Door height 32 px at the facade.
- Ceiling/wall visible height inside a room: 3 tiles (48 px). Counters and desks are 1 tile deep; seating is 1 tile.
- Exterior building mass: 12 tiles wide, roof plane about 43–46 px tall, facade about 50–55 px tall. Windows are low and broad (about 64×27), sills at player head height.
- A building's town-map footprint and its lot scene are different abstractions of the same place; they agree on sign, roof value, wall material, entrance position and lit-window colour, not on tile counts.

## 4. Material grammar

Materials are told apart by value structure and cluster shape, never by hue alone.

| Material | Structure | Where it lives |
|---|---|---|
| Painted timber / clapboard (cream-sage) | broad plane, 2 px horizontal course lines every 8–10 px, dark seam at corners | Double R, Sheriff exterior |
| Oak / warm wood | broad mid-brown plane, 1 px lighter rim on the lit edge, 1 px dark joint lines | Double R booths & counter front, Sheriff desks & wainscot |
| Steel / metal | cool gray plane, crisp 1 px cool-white edge on top face, dark drawer separations | Sheriff files & radio, diner machine |
| Glass | dark cool interior value with 1–3 stepped diagonal reflection clusters, warm or cool fill where lit | all windows and door panes |
| Asphalt / slate | flat cool blue-gray, two or three large placed repairs per screen, faded 2 px stall lines | exterior lots, street |
| Concrete | flat warm-gray, sparse 1 px chips, 1 px darker seam every 32–48 px | walkways, aprons, sidewalks |
| Linoleum / tile | quiet two-value checker or band, never high contrast | interior floors |
| Vegetation | darkest family, 2–3 values, rounded stepped silhouettes, no leaf texture | shrubs, conifers, planters |
| Neon / signage | dark backing board, cream border, coloured pixel letters | Double R sign, SHERIFF sign |

Palette roles, not palette clones: each location owns an accent (Double R burgundy/gold, Sheriff's Station forest-green/oak/steel) on top of the shared world families (cream, oak, slate, concrete, vegetation).

## 5. Lighting grammar

- Practical, motivated light only: windows, signs, wall lamps, desk lamps, ceiling tubes. Light never comes from nowhere.
- Light is painted as stepped pools: two or three concentric flat values, hard edges, extent 8–24 px from the source. No translucent beams, no glow sprites, no gradients.
- Warm sources (tungsten, neon) stay local; cool sources (fluorescent, dusk sky) set the ambient plane.
- Value order in every exterior frame: lit openings > signs > walls > ground > vegetation. In interiors: focal furniture under practical light > walls > floor.
- One dominant warm pool per scene. Double R: the whole room. Sheriff's Station: only the sheriff's desk lamp; everything else cool.

## 6. Contact shadow and depth rules

- Every grounded object (furniture, planter, sign post, car, character) sits on a tight contact shadow: 1–2 px dark band on its south edge, same width as the object, no offset drop shadows, no soft blur.
- Ground pass draws all shadows; the foreground pass never re-paints them.
- Depth order is the existing engine actor/furniture band system; art must respect the furniture footprint's south edge as its occlusion boundary.
- Elevation is shown by roof-to-wall value step (roof darker, cooler) and a 1 px fascia line, never by cast shadow length.

## 7. Environmental density

- Budget per 256×192 frame: 1 focal object, 3–5 secondary functional objects, 2–3 edge props. Everything else is plane.
- Every prop must answer "who uses this here?" (bench for waiting, notice board by the door, wheel stop by the stall). Decorative filler fails.
- Rear zones (roof planes, back walls) stay calm; density concentrates at the entrance and the focal wall.
- Concept clutter (extra plants, stacks, many frames) is intentionally dropped in native.

## 8. Negative space and gameplay readability

- The approach column to any entrance is at least 2 tiles wide and empty of props from the frame's bottom edge to the door.
- Interior aisles are 1 tile minimum, 2 tiles on the main circulation line; the player must never have to thread a 1-tile gap between two occluding pieces of furniture.
- Walkable ground is the quietest surface in the frame; blocked ground carries the props. A player must be able to infer collision from art alone.
- Trigger tiles sit inside the visual doorway; spawns land one tile outside the trigger, facing away from it.

## 9. Exterior ↔ interior continuity

A player must believe the exterior contains the interior. Required agreements:

1. Entrance position and width (two leaves, centred) and door material/colour.
2. Sign wording and sign family (backing board, border, letter colour).
3. Wall material family and roof value.
4. Lit-window colour equals the interior's dominant light (Double R warm gold; Sheriff's Station cool pale green-white with one warm lamp glimpse).
5. Left/right zoning: what is seen through the left window is on the left inside.
6. Same lot ground material as the street that leads there (slate asphalt, concrete apron).

Not required: tile-count parity, literal floorplan projection, visible interior through glass.

## 10. Character ↔ environment integration

- Characters use the production atlas unchanged; environments are authored around the 24 px sprite, never the reverse.
- Contact grounding: character foot line sits on the tile's south edge with the shared 1–2 px contact band.
- Placement follows role: staff behind counters/desks, public in aisles and benches. Nobody stands in the approach column.
- Stillness is the default. Character Life v0.1: rare generic blink, at most one contextual idle per character, reactive facing on interaction. Independent timers; no two characters share a rhythm.
- Ambient Life budget per important environment: 1–2 continuous, 1–3 intermittent families, at most one signature. Quieter rooms use fewer. Motion supports place identity, never fills space.

## 11. Concept → native parity rule

**Concept parity does not mean literal detail parity.** A native scene passes parity when it preserves the concept's essence:

- focal hierarchy (what is read first, second, third)
- palette roles (which family owns which surface and accent)
- lighting roles (where the one warm pool is, what is cool)
- material identity (each surface still reads as its material)
- environmental density (same felt fullness, fewer objects allowed)
- negative-space budget (same clear approach and aisles)
- spatial intention (same zoning: where reception is, where the sheriff sits)
- mood

A native scene may simplify props, flatten perspective, collapse reflections into stepped clusters, drop clutter and replace illustrated logos with native glyphs. It fails parity when it keeps geometry and collision but loses focal hierarchy, material distinction, grounding or the lighting role — that is a prototype, not a translation.

Review protocol for promotion: native 256×192, 5× integer view, in-game with the player, and beside its adjacent environments. Compare against the golden references above. A single strong screenshot is not enough; the same-world questions in `docs/production-vertical-slice-01-report.md` §Same-world review apply.

## 12. Outdoor investigative scenes (amendment, footbridge/traincar, 2026-09-10)

The footbridge/traincar (`artifacts/traincar-v01/traincar-native-golden.png`, 24×12, 384×192, horizontal scroll) is the first outdoor scene whose geometry carries case knowledge. Four rules were proposed by its brief; all four were needed to build it and are adopted. They are art direction, not engine systems: every one is authored tiles, palette and a flag read by the scene module.

1. **One authored weather state per outdoor investigative scene.** The traincar is late afternoon, overcast: no `town-dusk` grade, no directional shadow, no lit openings. Like Room 315's dawn, the state belongs to the beat, not to a clock. A scene may not borrow another scene's state without its own beat.
2. **Three-value ground grammar.** Every outdoor ground family is exactly three values (base, dark, pale) laid as stepped patches, never speckle: wet ballast, dead grass, creek slate. Rails are the only straight lines; foot tracks the only diagonals; trees the only crooked silhouettes. A reviewer fails a fourth value or a ruler-straight edge on gravel.
3. **Roof-cut outdoor interior.** A structure the player enters on the same outdoor map is drawn roof-cut: north rim carries the 48 px wall face exactly as an interior north wall, east/west/south rims one tile, the entrance a gap in the south rim, the floor the quietest plane inside. Same camera, same scale, no map change. Evidence inside must be simultaneously readable from the entrance column.
4. **Flag-driven scene-state overlay.** A beat that changes the place (sealed scene, removed object) is painted by the scene module on an existing flag or value — county tape on the door, a stake at the bridge, the ring leaving the beam — never a second map and never an animation.

Value ladder for this family (luma): county tape > faded car panel > interior dust > pale ballast stones > dead grass > ballast base > creek slate > evergreen. One saturated warm per outdoor scene (the ember).
