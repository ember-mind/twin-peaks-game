# Double R exterior prototype v0.2

This artifact is a standalone, test-only native preview of the Double R exterior. It does not change the production game or add an interior transition.

## Run

From the repository root:

```bash
python3 -m http.server 4177 --bind 127.0.0.1
```

Open:

- [`test/double-r-exterior-prototype.html`](../../test/double-r-exterior-prototype.html) — interactive preview
- [`test/double-r-exterior-prototype.html?clean=1`](../../test/double-r-exterior-prototype.html?clean=1) — clean native presentation
- [`test/double-r-exterior-prototype.html?debug=1`](../../test/double-r-exterior-prototype.html?debug=1) — collision, trigger, and depth overlay
- [comparison.html](comparison.html) — approved concept beside the native game result

The preview exposes `window.__EXTERIOR_PREVIEW__` for automation: `reset()`, `snapshot()`, `setDebug(value)`, `demo()`, and `pressAndWait(code)`.

## Native contract

The scene is a 256×192 canvas with a 16 px grid and the production flat 2D camera. Movement uses the real Engine one-tile stepping, collision, easing, facing, and Cooper player rendering. The player uses the production 24×24 HeartGold-derived atlas with the actual integer gait and native pixel scaling. No legacy `PITCH`/warp projection is used.

The authored composition is relative to the full 256×192 frame:

- building footprint: x16..208, y12..112 (12 tiles wide); roof is approximately 46 px high and facade plus fascia approximately 52 px;
- one 32×32 entrance with two 16 px-wide leaves at x96..128, backed by trigger tiles `(6,6)` and `(7,6)`; the 24 px player atlas is not resized;
- windows approximately 64×27, a 32 px sidewalk band, cropped parking stalls around 48×48, and a 28×37 sign board above 44 px posts;
- spawn `(6,10)` facing up; the exercised route is `(6,10) → (6,9) → (6,8) → (6,7) → (6,6)`;
- proposed future interior boundary is `(6,9)`/`(7,9)` with interior spawn `(6,8)`/`(7,8)`. No map load or transition is implemented.

The source/controller collision rows define perimeter, planter, sign, wheelstop, and bottom-foreground foliage blockers. Debug mode marks blocked cells red, entrance triggers green, and depth rules gold. Town's 6×3 landmark remains unchanged; the exterior facade is a stylized 12-wide frontage beside the interior’s 14-wide map rather than a literal floorplan projection. The north service zone remains behind the roof; warm front glazing suggests the side booth banks, not a literal view through the entire interior.

## Reuse and limits

**REUSABLE AS-IS:** Engine movement, collision, camera, player/atlas rendering, material palette, tile/structure rendering, actor depth ordering, and the structure/foreground hooks.

**NEEDS GENERALIZATION:** explicit scene material-policy registration and detail-scene attachment are future questions, not implemented systems. The preview locally bypasses the existing 4-color background limiter for its unknown map, matching the established town/diner exception; production has no declarative scene registration for this yet.

**EXTERIOR-SPECIFIC:** building geometry, window silhouettes, dusk palette, sign, parking, foliage, and trigger-only routing. Glass reflections collapse into a few stepped clusters, lettering uses native glyphs, and the exact illustrated logo is not retained. Roof depth and parking are compressed to keep the player and facade in the same viewport. It does not include Ambient Life, audio, NPCs, procedural generation, or transition behavior.

**What did the concept image assume that the current engine cannot yet represent?** Arbitrary raster/subpixel detail cannot survive the fixed native grid. The concept's apparent roof perspective is not a real engine camera projection: it is authored elevation over flat navigation. Automatic views into the existing interior and automatic attachment of this detailed lot to the town landmark are absent; neither is required for this static validation. No engine blocker prevents the authored composition itself.

**Visual verdict:** pass with notes for native feasibility. Composition, silhouette, dusk relationship, player scale, and entrance readability survive. Exact concept-level material richness and logo fidelity are not claimed; those remain authored-art tradeoffs for review. No further polishing or integration follows this validation.

## Evidence

The 59-script native suite passed; the scoped exterior test passed again after the final art cleanup. It exercises the real movement route, both entrance triggers, blockers, atlas provenance, and no localStorage writes. Coldstage R2 passed all runtime scenarios and all 8 exterior checks, with zero severe console errors in the exterior. Manual browser use confirmed the Demo walk arrival status and Debug control. See [scoped visual review](validation/review-record.json) and [runtime report](validation/coldstage-r2.json). No pixel baseline was approved or replaced. Unrelated town/ambient/environment visual gates remain pending and are outside this prototype's visual approval.

Final captures:

- [native-clean.png](native-clean.png)
- [native-entrance.png](native-entrance.png)
- [native-debug.png](native-debug.png)

The prototype is test-only and does not alter the 69-file canonical runtime mirror. The vault remains canonical authoring source; this checkout is the deploy/publication copy.
