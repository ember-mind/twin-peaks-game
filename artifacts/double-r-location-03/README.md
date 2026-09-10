# REUSABLE AS-IS

The smallest reusable primitive is one paired endpoint record: an `id`, two endpoint `triggers` lists, and one non-trigger `spawn` per endpoint. `GAME.LocationConnections.install()` compiles that record into the existing `GAME.Maps[*].doors` format. Every physical trigger at one endpoint receives the same descriptor object, with the connection id and the other endpoint's scene and spawn. There is no connection registry, navigation framework, cooldown, or per-trigger destination logic.

`double-r-front-entrance` is one semantic connection with two physical trigger cells at each end. Exterior cells `6,6` and `7,6` lead to diner spawn `6,8,up`; diner cells `6,9` and `7,9` lead to exterior spawn `6,7,down`. Both spawns are walkable and outside their endpoint's trigger cells.

The engine change is a generic metadata hook. A door may emit its optional `departureReaction` before the existing warp starts, and the committed arrival event carries the door's `connectionId`. Traversal still uses the production engine's existing 180 ms fade out and fade in, save path, and paused door-opening behavior. No further generalization is needed for this pass.

# NEEDS GENERALIZATION

Nothing needs generalization for the current two-ended location connection. `js/location-connections.js` is deliberately only a paired-data compiler over existing doors, rather than a world engine. Future requirements such as connections with more than two endpoints, conditional routing, or conflicting live installers should earn their own design when a real location requires them.

Validation passed: [62 native scripts](validation/native-results.json), including both leaves in both directions, held-input/no-bounce behavior, save-failure rollback/retry, and controller cancellation. [Coldstage runtime](validation/coldstage-r1.json) passed, including all 11 connected-location checks with zero severe console errors. [Preservation evidence](validation/preservation.json) confirms identical exterior RGBA pixels, zero changed interior baseline pixels, and unchanged artwork, maps, atlas, and Ambient Life sources. [Manual browser review](validation/manual-preview.json) confirms both keyboard traversal and the Round trip control. No pixel baseline was approved or replaced. Pre-existing town/ambient/environment visual-review gates remain pending; the new demo has no approved baseline yet.

# LOCATION-SPECIFIC

The connected preview is [test/double-r-location.html](../../test/double-r-location.html). It uses the production engine and exercises an actual step onto the doorway, fade, map load, save participation, and round trip. Its save participant remains memory-only so the demo cannot overwrite a real game save. Normal `index.html` routing is unchanged; the connection module and preview wiring remain test/demo scope.

The diner reuses its existing `doorEntryFrames` for both arrival and departure through connection metadata. The exterior has no corresponding frames, so it gains no new reaction behavior. Source art, ambient systems, and audio are unchanged. The symbolic models remain a 12-tile exterior frontage and 14-tile interior; they are not CAD measurements, and the established 6-by-3 town building footprint is unchanged.

Play at [http://127.0.0.1:4177/test/double-r-location.html](http://127.0.0.1:4177/test/double-r-location.html). Add `?clean=1` for capture chrome removal or `?debug=1` to show trigger cells and spawn. Walk with WASD or arrow keys; use **Round trip** for the automated traversal. To restart the local server from the repository root:

```sh
python3 -m http.server 4177 --bind 127.0.0.1
```
