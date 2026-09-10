# Double R seated-patron refinement

The occupied booths use complete authored seated poses: cast-scale heads, connected necks, compressed chests, inward three-quarter turns, and asymmetric resting arms. The table hides the lap; the foreground painter restores only the resting forearms and hands from the same pose coordinates. Occupied table settings reserve the first three tabletop rows for anatomy and vary their arrangement with the guest's seat side.

The shared `GAME.Retro2D.interiorKit` exposes `seatedGuest`, `seatedHands` and `occupiedTable` alongside the material-driven booth painter. Guest hair, clothing and left/right placement live in the generated diner model in `test/genmaps.js`. Other interiors can reuse the painters without duplicating seating logic. Change map geometry through the generator, never directly in `js/maps.js`.

This pass also refines vinyl seat highlights, pastry crust detail, and spacing on the freestanding specials board. The camera, collision footprint, entrances, NPC routes and standing character assets remain unchanged.

Regression checks in `test/diner-layout.js` verify connected anatomy, native pixel alignment, hand/prop separation, camera translation, furniture depth and reachable story NPCs. Full native results and independent visual verdicts live in `.gauntlet/diner-seating/evidence`; the contract records the complete unit matrix and remaining limitations.

Validation: 54 native scripts pass, including 368 smoke checks and 86 walkthrough acquisitions; 96/96 Coldstage runtime checks pass. A transient browser-driver disconnect required one unchanged retry. The separate town dialogue visual baseline is outside this diner task and has not been approved here.
