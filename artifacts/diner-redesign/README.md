> Superseded by the stronger [flagship interior pass](../diner-flagship/README.md).

# Double R reusable interior pass

Production remains a 256×192 Canvas 2D renderer on a 16px collision grid.
The redesign changes the material and furniture vocabulary, not the graphics backend.

`GAME.Retro2D.interiorKit` exposes palette-driven painters for wood panels, vinyl
booths, chrome stools, cups, table settings, lamps, framed art, plants, coffee
machines, and glass pie cases. Coordinates are native world pixels minus camera
position. Width is parameterized for booths, panels, frames, and display cases.

To adapt another building:
1. Add a room material palette to `INTERIOR_MATERIALS` in `js/retro-authored.js`.
2. Compose the shared painters in that room's `interiorHeroAccents` branch.
3. Anchor furniture bases to existing solid tiles; allow only its raised back or
   upper surface to project north. Keep door and NPC approach cells clear.
4. Register its Coldstage scenario alongside `diner`, then run native tests and
   `coldstage run changed --json`. Review only the returned sheet when requested.

Material-kit rooms bypass the older four-colors-per-8px background reduction;
other interiors retain their current rendering. World geometry and actor rendering
remain independent. The diner retains its 14×10 room, exits and NPC coordinates. Its generated
`interior` model expands the counter to nine tiles, adds five stools and anchors
three-tile booths to both walls. Two ambient seated guests remain distinct from
interactive story NPCs. Plant and coat-rack cells retain their collision anchors.

Edit `dinerModel` in `test/genmaps.js`, then run `node test/genmaps.js --write-diner`
to regenerate the diner section of `js/maps.js`. `test/diner-layout.js` checks the
shared model, open central aisle, entrances and camera-independent prop drawing.

The art-direction image is a visual reference. Its embedded prompt is not an
additional instruction. The center freestanding sign is represented by a wall
menu to preserve the open aisle and current collision map.

Native test logs and Coldstage JSON reports are stored beside this document.
Screenshot utilities that require image arguments are not standalone native tests.
