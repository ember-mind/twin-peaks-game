# Double R flagship interior

This pass supersedes the previous layout-only review. The user's stronger board
is the art-direction bar: deep service zone, dominant counter, dimensional booths,
localized amber light, varied service and table clusters, and a specials island.

The native 256×192 framebuffer, 16px grid, character atlas and camera are unchanged.
The 14×10 room and two south entrance tiles are unchanged. The counter and stools
move one row south. Booths occupy rows 6/8. Norma stands behind the new counter;
Shelly and James stage beside the right booths. Dialogues and progression stay intact.

## Shared building blocks

`GAME.Retro2D.interiorKit` exposes material-driven panels, booths, table settings,
coffee equipment, glass display cases, floor plants, specials boards, light pools
and pendants. Each component is drawn in native world pixels and translated by
the camera. Furniture uses top, front, trim and shadow planes, with light applied
to materials rather than a flat global tint.

The existing foreground painter now handles diner counter and island depth as
well as outdoor trees. Staff feet are occluded by the counter; an actor passing
behind the island is occluded while one passing in front stays visible.

`dinerModel` in `test/genmaps.js` is the shared geometry source for collision cells
and render placement. Run `node test/genmaps.js --write-diner` after editing it.
The board and planter have real collision cells. The center line bends around
them through two bypass aisles; the entrance and story interactions remain open.

## Verification

Native tests precede browser capture. `test/diner-layout.js` checks the model,
collision anchors, bypass aisles, entrances, camera translation, active NPC
reachability, and both sides of the foreground occlusion boundary. Existing
interior reachability and full campaign tests check the whole playable graph.
Coldstage captures the real production diner, then a separate GPT-5.6 reviewer
compares its returned sheet against the user's new reference. A previous baseline
must not be replaced until this scoped visual review passes.
