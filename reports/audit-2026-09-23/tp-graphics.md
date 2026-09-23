Graphics audit found six P2 defects and no P0/P1 defect in inspected evidence. Native 256×192 captures cover current interiors, exteriors, cemetery, diner, traincar, and sheriff scenes; kit captures cover day, dusk, night, and Double R follow mode. Live Chrome traversal of the full matrix was blocked by this host: `test/lib/chrome-cdp.js` timed out because Chrome exposed no DevTools target, so findings below use inspected current captures, checked-in kit evidence, and reproducible source/test paths. Screenshots live under `.audit/shots/tp-graphics/`.

## Findings

### P2 — Traincar destination sign is cropped by the 256px camera

**Where:** `index.html` → traincar scene, arrival view at `traincar` / `sign_oej`.

**What:** The right-edge `ONE EYED JACKS` sign is only partly inside the 256×192 gameplay viewport; the live-sized capture shows the sign cut at the right edge, so its border and lettering are incomplete. Full authored art places the sign at x=306..338 in a 384px scene, while the gameplay capture crops it to the 256px camera.

**Evidence:** [traincar-256.png](/Users/ebuccelli/Code/solo/projects/twin-peaks-game/.worktrees/audit/.audit/shots/tp-graphics/traincar-256.png) shows the cropped sign. `js/traincar-art.js:545-560` draws the sign at x=306..338; `js/traincar-scene.js:20-23` defines the east-edge cut toward One Eyed Jacks.

**Suggested fix:** Keep the sign inside the camera-safe region, or shift the camera when the traincar east exit is in view so the entire sign remains readable.

### P2 — One Eyed Jacks tables lose floor/depth separation at native size

**Where:** `index.html` → `oej` interior, native 256×192 view.

**What:** At 1×, green gaming tables read as detached rectangular islands on a broad pink carpet. The central carpet band between bar and lower tables has no strong value/border break, so the room’s depth and table footprint are hard to parse.

**Evidence:** [oej.png](/Users/ebuccelli/Code/solo/projects/twin-peaks-game/.worktrees/audit/.audit/shots/tp-graphics/oej.png). The renderer has a bordered pit path in `js/oej-art.js:245-259`, but its edge/weave does not survive clearly at the native capture; the same file’s table pass is `js/oej-art.js:1208-1212`.

**Suggested fix:** Increase native-size contrast/silhouette separation around table groups: stronger pit border, distinct table shapes, or a larger value break under the gaming area.

### P2 — Kit diner and sheriff lots merge into one undifferentiated street

**Where:** `test/kit-exteriors.html?mode=overview&start=720&paused=1&capture=3`.

**What:** Diner and sheriff frontage share one grey walk and one run of straight parking marks. The two places read as a single continuous parking lot instead of separate lots with distinct frontage.

**Evidence:** [kit-overview-day.png](/Users/ebuccelli/Code/solo/projects/twin-peaks-game/.worktrees/audit/.audit/shots/tp-graphics/kit-overview-day.png) and [kit-overview-dusk.png](/Users/ebuccelli/Code/solo/projects/twin-peaks-game/.worktrees/audit/.audit/shots/tp-graphics/kit-overview-dusk.png). `assets/kits/tp-exteriors-v01/README.md:50` records the same visible gap: shared grey walk and straight lines replace the diner’s distinct concept treatment.

**Suggested fix:** Add a lot seam/curb and diner-specific pavement or stall geometry at the property boundary.

### P2 — Kit street lacks driveway, crosswalk, and grass-to-forest transitions

**Where:** `test/kit-exteriors.html?mode=overview&start=720&paused=1&capture=3`, day/dusk/night.

**What:** The frontage moves directly from sidewalk/parking to uninterrupted road and then to a hard hedge/forest band. No driveway cut, crosswalk, or intermediate ground material communicates entrances or the street-to-forest edge.

**Evidence:** [kit-overview-day.png](/Users/ebuccelli/Code/solo/projects/twin-peaks-game/.worktrees/audit/.audit/shots/tp-graphics/kit-overview-day.png), [kit-overview-dusk.png](/Users/ebuccelli/Code/solo/projects/twin-peaks-game/.worktrees/audit/.audit/shots/tp-graphics/kit-overview-dusk.png), [kit-overview-night.png](/Users/ebuccelli/Code/solo/projects/twin-peaks-game/.worktrees/audit/.audit/shots/tp-graphics/kit-overview-night.png). `assets/kits/tp-exteriors-v01/README.md:52` explicitly lists no driveway/crosswalk tiles and no grass-to-forest transition beyond the fringe.

**Suggested fix:** Add driveway/crosswalk tiles and at least one grass/shoulder transition before the forest wall.

### P2 — Kit downscale leaves stray one-pixel marks on diner art

**Where:** `test/kit-exteriors.html?mode=follow&door=double_r&dir=out&start=...&paused=1&capture=3` and Double R concept comparison.

**What:** Downscaled kit art leaves isolated one-pixel artifacts at the diner roof’s upper-left rim and on the diner door handles. They read as stray pixels at native scale rather than intentional trim/detail.

**Evidence:** [kit-follow-double-r-out-dusk.png](/Users/ebuccelli/Code/solo/projects/twin-peaks-game/.worktrees/audit/.audit/shots/tp-graphics/kit-follow-double-r-out-dusk.png), [compare-double-r-day.png](/Users/ebuccelli/Code/solo/projects/twin-peaks-game/.worktrees/audit/assets/kits/tp-exteriors-v01/evidence/compare-double-r-day.png), and `assets/kits/tp-exteriors-v01/README.md:51`, which names both artifact locations.

**Suggested fix:** Clean the source pixels at the roof rim and door-handle edges, then regenerate the downscaled kit frames.

### P2 — Extended-tile graphics contract gate is stale and fails on current code

**Where:** `node test/heartgold-visual-contract.js`; `test/heartgold-visual-contract.js:27-29`.

**What:** Graphics contract test fails with `AssertionError [ERR_ASSERTION]: extended_tiles_have_camera_overdraw` even though current `js/engine.js:953-964` passes `overdraw: 2` into the shared tilemap renderer. The overdraw range formulas now live in `engine/ember-tilemap.js:17-24`, so the gate checks old implementation text rather than the active path.

**Evidence:** Command output:

```text
AssertionError [ERR_ASSERTION]: extended_tiles_have_camera_overdraw
false !== true
at gate (.../test/heartgold-visual-contract.js:18:10)
```

Current path: `js/engine.js:953-964` → `EMBER.Tilemap.paintWindow`; formulas: `engine/ember-tilemap.js:17-24`.

**Suggested fix:** Point the contract assertion at `engine/ember-tilemap.js` or expose a shared tested overdraw constant/API. Keep the test coupled to behavior, not source placement.

## Checks

- `node test/kit-exteriors.js` — `7748 / 7748 checks pass (56 routes)`.
- `node test/retro-production.js` — `54/54` pass.
- `node test/retro-contact-shadow.js` — `10/10` pass.
- `node test/interior-prop-semantics.js` — `25/25` pass.
- Live Chrome capture attempt failed before page attach: `Error: Chrome startup timed out` from `test/lib/chrome-cdp.js`; lock was released.
