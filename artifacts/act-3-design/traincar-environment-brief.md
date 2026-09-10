# Footbridge / traincar — environment brief (design input, no art yet)

Feeds: Golden Concept → Native Translation → Parity Polish, same workflow as Room 315 and the hospital. First outdoor investigative environment of the project.

## 1. Narrative purpose

The primary scene. The only place in the game with no routine (Grammatica §14): a freight car left where the rails die, half a mile east of the last houses. Act 2 ended with two lines converging on it (James's road, Ronette's bridge). The player arrives *by walking the road Laura was carried along*; the scene has been waiting, contaminated only by weather and by one set of tracks that went past it and did not come back. Later returns show the car sealed with the county's tape (visible change, no new content).

## 2. Gameplay purpose

Let the player read a scene without a witness: five things to look at, one of them only from where you stand, two comparisons in the notebook, one interpretation that Truman answers in the merit. Then send the player north along a trace, not a signpost. Everything the M6 interrogation later claims about the car (cards, the stove, "mezzo mondo") must be *seen here first*.

## 3. Playable boundaries and map shape

- Replace the current 24×14 `traincar` with a **24×12 native map** (one screen tall, 1.5 screens wide, horizontal scroll only). West door → town 54,14; north door → oej (gated on `east_route_confirmed`).
- Three zones, west to east: **the bridge** (cols 1–7), **the clearing and the car** (cols 8–18), **the north cut** (cols 18–22) where the old tracks leave the clearing under the trees toward the OEJ path.
- Tree line: rows 0–1 north wall (canopy face, as the station exterior), row 11 south wall; the creek runs north–south under the bridge (cols 4–5), the only water on the map; rails run east–west along row 7 from the bridge to the car and stop *under* it.
- Player route (mandatory): west door → bridge planks → Hawk → rails east → car door on the south face → inside → centre → out → north cut.

## 4. Spatial relationships that carry meaning

| Relationship | Why it matters | Must be readable |
|---|---|---|
| Bridge is **west** of the car, on the town side | Ronette was found here → she came *from* the car toward town; James's "veniva da est" becomes a thing you stand on | at 1×: bridge left, car right, rails between |
| The car is at the **end** of the rails | nothing arrives here; a chosen place, not a passing one | rails visibly stop under the car's east wheel |
| **Door on the south face, mound just inside it** | you step over the mound to enter; "buried in a hurry" does not fit a place you walk on | door, mound and floor in one look |
| **Crossbeam at the exact centre**, ring on it; torn seat and bent sheet **at the corners** | violence at the edges, a placed object at the centre, no path between | whole interior visible from the centre tile |
| **Stove on the north wall**, cold | the fire motif (ticket text, Gerard's verse, the matches man) gets an object | small, dark, one warm ash note |
| **Old tracks continue north** past the car into the cut | Hawk read them at the bridge; the player must walk to see where they go: OEJ | north cut visible from the car's north-east corner, not from the bridge |

## 5. Interactables (targets)

| id | kind | where | beat | new? |
|---|---|---|---|---|
| `bridge_rail` (replaces `sign_ponte`) | landmark | bridge, east parapet | m5_bridge (Hawk arrives; where Ronette was found) | re-keyed |
| `traincar_entrance` | landmark | door tile, south face | m5_discovery | keep |
| `mound` | object | inside, first tile past the door | m5_mound | keep |
| `ring` | object | crossbeam, centre | m5_ring | keep |
| `scene_center` | landmark | centre tile (player must stand on it) | m5_scene (positional page) | keep, semantic change |
| `stove` | object | north wall interior | new observation E_STUFA | **new** |
| `cards` | object | torn seat, south-west corner interior | new observation E_CARTE | **new** |
| `tracks_north` | landmark | north cut, where rails enter the trees | Hawk's second reading (E_TRACCE_EST) | **new** |
| `sign_oej` | sign | north cut, beside the path | m5_sign_oej (optional) | keep |
| `truman` | actor | outside the door, after the theory | m5_report_intro | keep; he arrives *along the rails from the west*, so his sprite is placed on the rails, not inside |

Total mandatory interactions: 6 (bridge, entrance, mound, ring, centre, tracks). Optional: stove, cards, sign, ticket↔poem comparison. Density stays at "about eight objects", like the ward.

## 6. Hawk staging

Three states, one sprite, condition-placed (existing `NARRATIVE_ENTITIES.when` pattern):
1. **Before discovery**: on the bridge's east end, facing the planks. He reads the outside.
2. **After discovery, before the report**: outside the car door, facing away from it ("Io tengo fuori gli altri"). He never enters. Cooper inside / Hawk outside is the visual contrast of the two methods.
3. **After the report**: at the north cut by the tracks, facing north — the invitation to M6 is a man looking down a trail, not a sign.
The classic `hawk_vagone` sprite inside the car is removed.

## 7. Mood, light, time

- **Late afternoon, overcast, no rain**: flat cool daylight, long soft shadows are *not* wanted (no directional sun); one authored state. The report ends the day (M6's return is at night), so the car is the last daylight scene of the act.
- Palette family: wet gravel greys, rust and oxidised red-brown of the car, dead-grass ochre, creek slate, evergreen wall as in the station exterior. One warm accent only: the stove's ash ring / the burnt matchbook. Nothing saturated.
- Sound (later, ambient pass, not now): metal settling; per Grammatica, a freight that passes on the live line far south and does not stop. Not required for the design.
- Mood words: exposed, patient, already-read-by-someone-else.

## 8. What must be simultaneously visible for the deductions

1. From the **centre tile**: door, mound, both torn corners, the beam and ring, the stove. (Interior ≤ 8×4 tiles, roof cut away, walls drawn as a low rim so nothing occludes.)
2. From the **bridge**: the creek under the planks, the town-side bank where Ronette was found (a marker the county left: a stake with tape), the rails leading east out of frame.
3. From the **north-east corner of the clearing**: the old tracks entering the cut and the OEJ sign beside them.

## 9. Outdoor rules: sufficient vs new

Sufficient as they stand: spawn row ≤ 23 rule (irrelevant at 12 rows), camera at `pz + CAM_BACK` south of the player, north tree canopy as the "wall face", exterior scene hook pattern (drawTile no-op, drawStructures, drawForegroundStructures, limitBackgroundPalettes bypass), contact-band grounding.

Proposed **additions to the World Visual Bible** (art direction, not engine):
- **Outdoor investigative scene = one authored weather state**, declared in the brief; no dusk grade borrowed from `town-dusk` (that module is town-only by design).
- **Ground reads as three values only** (path, grass, gravel/ballast); tracks are the only straight lines on the map; trees are the only crooked ones (already the inspect line for `traincar:T`; make it a drawing rule).
- **Roof-cut interiors outdoors**: a structure the player enters on an exterior map is drawn open from above with a 1-tile rim, the same 48 px face on its north wall as indoor rooms, so scale stays continuous with the station exterior.
- **Scene-state overlay**: after the report, one authored overlay (tape across the door, a stake at the bridge) painted by the scene module on a flag, never a second map.

## 10. Not in this brief

No concept prompt, no palette hexes, no tile rows: those belong to the Golden Concept step once the beat map below is approved.
