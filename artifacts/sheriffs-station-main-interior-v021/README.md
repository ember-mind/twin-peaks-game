# Sheriff’s Station v0.2.1 — native visual parity polish

This pass treats v0.2 as the technically validated before state, not as an approved visual target. The [golden concept](../sheriffs-station-main-interior-v01/final.png) remains the art-direction reference. Only scene-authored raster instructions in `js/sheriffs-station-art.js` are in scope.

[Golden / native before / native after comparison](comparison.html) includes exact 256×192 views and integer-scaled inspection. The before capture is preserved independently of the production art file.

## Art direction

The sheriff desk, county map and warm task lamp must read as one primary focal area at the end of the central aisle. Local warm desktop and edge accents contrast with cool institutional light on upper walls, steel and nearby floor. Material depth comes from native pixel clusters: broad painted bands, directional oak rims and joints, crisp steel edges and drawer separations, quiet linoleum value groups, clean ivory paper and sparse glass reflections.

Tight contact shadows replace flat, detached-looking furniture shadows. Player contact is authored beneath the existing sprite using its existing world position; the character sprite and renderer remain unchanged. All shadows remain in the ground pass, and existing foreground depth intervals remain authoritative.

A few functional details return on existing surfaces: a clearer map, coat/hat peg, radio, sheriff telephone and subdued public notices on the counter. These introduce no floor obstacles, interactions or new object records.

## Intentionally not restored

The concept’s extra plants, secondary mug, many small frames, dense paper stacks, fine trim and tiny text are omitted. Smooth lighting, fine painterly texture and camera perspective are not imported into the native scene. The room remains quiet and walkable rather than reproducing every concept prop.

## Preservation and evidence

`validation/protected-before.json` freezes the scene definition, collision, World data, production renderer, player atlas, preview and configuration. `validation/geometry-before.json` freezes every furniture footprint, depth, bound and access target. The after audit compares these exact values, rather than inferring preservation from a screenshot.

Native test, Coldstage, pixel audit and visual-review results are stored in `validation/`. No World Engine, material-policy system, Ambient Life, audio, interaction or narrative implementation belongs to this pass. The existing v0.2 pixel baseline is retained as the before reference; visual polish does not retroactively make that before version visually approved.

## Final result

The final model art-direction review is **pass with notes**, recorded against the exact Coldstage run. The returned diff sheet was inspected first; the exact 256×192 image and 5× clean capture were then inspected because the overview could not resolve one-pixel contact shadows and material edges. This is not a claim of user visual approval.

- **focalHierarchy**: Pass. County map and deep sheriff desk form the central anchor; the lamp is the only concentrated amber light. Existing aisle remains clear.
- **lighting**: Pass with notes. Cool highlights affect fixtures, wall, steel, glass and back floor; hard warm clusters stay local to the sheriff desktop and adjacent floor. No gradients or blur. Fluorescent spill is deliberately subtle.
- **materials**: Pass. Oak has inset joints and directional rims; steel has cool edge planes and dark drawers; paper remains broad ivory; glass uses sparse cool reflections.
- **depth**: Pass. Visible hard ground contact, deeper desk fronts and chair planes improve grounding. All existing actor depth bands and collision footprints are unchanged.
- **environmentalDensity**: Pass. County parcels/river, coat and hat, radio, phone, case papers and counter notices restore functional density without adding floor obstacles.
- **sameGameQuality**: Pass with notes. Native furniture and player use compatible hard pixel clusters and scale. Material and focal treatment recover the reference identity; perspective, dense decor and painterly texture remain intentionally reduced. This is model review, not user visual approval.

Native station tests, frozen audit, smoke, walkthrough and World catalog checks passed before browser capture. Coldstage passed 133/133 runtime checks across 17 scenarios; Sheriff’s Station passed 9/9 with zero severe console errors. All 18 protected file hashes and complete furniture/map/target geometry match the before snapshot. The pixel audit verified all 49,152 native pixels correspond to uniform 5×5 capture blocks.

Only `js/sheriffs-station-art.js` changed in the runtime during this polish pass. The expected visual diff remains against the retained v0.2 baseline. Unrelated pending pixel reviews were not approved.
