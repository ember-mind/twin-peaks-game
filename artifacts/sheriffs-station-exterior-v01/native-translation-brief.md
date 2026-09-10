# Sheriff's Station exterior — native translation brief (Phase 3B/3C)

Target file: `js/sheriffs-station-exterior-art.js` (placeholder installed by the migration). Scene: `js/sheriffs-station-exterior-scene.js`, map `sheriffs_station_exterior`, 16×12 tiles, 256×192 native. Pattern to follow: `js/double-r-exterior-art.js` (deterministic integer rectangles, `R(x,y,w,h,color)`, `draw` = ground+building, `foreground` = props that occlude the player between depth bounds).

## Frame plan (native pixels, y down)

| Zone | Rect | Notes |
|---|---|---|
| Rear conifers | x0..16 and x240..256, y0..64 | dark stepped silhouettes like Double R `treeBank`; behind roof |
| Roof plane | x32..224, y16..60 | charcoal-green `#2c3b33` base, 4 px darker fascia line at y56..60 `#1f2a26`, 2 px cool rim top-left, 5 vertical seam pairs, one small vent x168..180 y10..18 (metal) |
| Facade | x32..224, y60..112 | sage board `#7f8a72` with 2 px courses every 8 px `#6e7a63`; oak corner boards 4 px `#6b4a2e` at x32 and x220; oak fascia band y60..64 `#8a5f3a` |
| Stone base | x32..224, y104..112 | warm gray `#8d8a80` blocks 16 px with 1 px dark joints |
| Sign | x104..152, y62..80 | forest board `#233a2f`, cream border 2 px `#e6dcc0`, "SHERIFF" in native glyphs cream; small cool lamp under sign x122..134 y82..86 `#d9e2d0` with 1 px pool |
| Door | x112..144, y80..112 | two 16 px oak leaves `#6b4a2e`, upper glass panes x116..124 / x132..140 y84..96 pale cool `#cfe0cf`, brass 2 px handles `#e9bd5d`, dark threshold y110..112 `#2f2a24` |
| Left window | x48..96, y72..100 | oak frame 2 px, glass cool `#b9c9b8`, abstract: pale counter bar `#d8d6c6` low, green board `#3f5a44` high-left, 2 stepped diagonal reflections `#dbe6dc` |
| Right window | x160..208, y72..100 | same frame/glass, abstract: oak desk bar `#8a5f3a`, steel cabinet `#9aa3a0` right, warm lamp dot 3×3 `#f2c76a` with 5×3 warm pool below |
| Notice board | x150..160, y84..100 | oak frame, cork `#a8865a`, two paper pixels |
| Bench | x52..84, y100..110 | oak slats with 2 px legs; contact shadow 1 px |
| Flagpole | x228..231, y44..112 | cool steel `#aeb6b3`, base 6×3, small gold finial |
| Shrubs | x16..32 & x224..240 at y96..112; x184..220 y100..112 | 2–3 values, darkest family `#233a2f` / `#2f4d3b` / `#3e6248` |
| Fence posts | x8..16 and x240..248, y96..112 | oak posts, 2 rails |
| Concrete apron | x0..256, y112..128 | warm gray `#7d7b72`, 1 px seam every 48 px, 3 chips |
| Asphalt lot | x0..256, y128..192 | slate `#485665`, two large repairs, 2 px stall lines `#9aa0a3` at x40..48 and x200..208 (y150..190), wheel stops x36..64 & x192..220 y136..142 `#8d8a80` |
| Approach column | x112..144, y112..192 | must stay empty of props and marks |

Collision rows (already in scene): triggers (7,6),(8,6) sit inside the door; spawn (7,7) on the apron; bottom exit triggers x5..10 on row 11.

## Foreground pass
Shrubs at y96..112 and the bench occlude the player only when the player's depth is above them; use the Double R `foreground` depth-bounds pattern. Fence posts at x8..16 belong to the ground pass.

## Parity checklist (critic uses this)
1. Focal order: door+sign → windows → bench/board/flagpole → vegetation.
2. Lighting: cool window light with a single warm lamp dot at the right window; pale cool lamp over the door; window light touches the apron as a 2-step pool.
3. Materials: siding courses, oak trim rims, stone base joints, steel pole edge, glass reflections, flat slate with repairs.
4. Grounding: 1 px contact band under bench, shrubs, wheel stops, flagpole base.
5. Density: same felt fullness as the concept minus grain; roof plane calm.
6. Same street as Double R: identical asphalt/concrete values, identical player scale, same roof/facade heights ±4 px.
