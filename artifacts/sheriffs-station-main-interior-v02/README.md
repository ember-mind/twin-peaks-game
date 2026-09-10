# Sheriff's Station — native scene validation v0.2

## Scope

Native translation of the approved [v01 golden concept](../sheriffs-station-main-interior-v01/final.png), without a new concept generation. The environment is authored with integer pixel rectangles on the existing 256×192 framebuffer and 16px world grid. The production Cooper atlas is unchanged.

Open [concept/native comparison](comparison.html), [playable preview](../../test/sheriffs-station.html), or [collision preview](../../test/sheriffs-station.html?debug=1). The preview consumes the production scene modules and Engine; it is not an image backdrop or a separate movement implementation.

## Preserved composition and simplifications

The south entrance, open central aisle and rear sheriff desk remain the main axis. The county map and single warm task lamp concentrate attention at the sheriff's desk. Waiting and reception stay left; steel files occupy the rear-left; two compact work desks occupy the right. The rear-right frosted door is background architecture with no destination or trigger.

The layout adapts the concept to tile footprints. All 84 floor tiles are connected, and columns 6–9 remain clear across rows 5–10. Filing cabinets include their rear wall contact cells so Cooper cannot walk into a hidden strip behind them. Right desks separate vertically and chairs have side approaches. The reception return is short enough to leave a staff opening. Small framed pictures, surplus plants, secondary mugs, paper clutter, furniture trim and soft gradients are removed or collapsed into larger clusters.

Sage painted walls use controlled value bands. Oak uses directional edge highlights and dark joints. Steel uses cool edges, drawer seams and simple handles. Gray linoleum has broad, low-contrast variation rather than a diner checkerboard. Paper and glass use a few large pale or cool clusters. Cool fluorescent fixtures establish the room; the sheriff lamp warms only its desktop and nearby edge.

## World registration

`sheriffs-station` contains `main-interior`, referencing the installed native map `sheriffs_station_main_interior`. Its connection list is empty. The old `sheriff` map and its story traversal are not replaced. No future environment, rear-door connection or new World Engine capability is introduced.

## System findings

- **REUSED WITHOUT CHANGE:** production Engine movement, map solidity, existing foreground depth intervals, character atlas and foot anchors, 256×192 rendering, and World Engine v0.1 registration.
- **LOCATION-SPECIFIC AUTHORING:** furniture footprints, integer pixel art, sage/oak/steel palette, static practical lighting, closed-door architecture and scene-scoped hook delegation. These follow the existing Double R scene installer pattern.
- **GENUINE SYSTEM PRESSURE:** no implementation blocker established. The existing map-specific hook wrappers accommodate this scene. Their repeated wiring is visible, but does not require changing the frozen engine or introducing a material registry for this pass.

## Possible future Ambient Life anchors

The desk lamp and paper tray provide natural fixed anchors; restrained paper movement could be considered later. An entrance reaction needs a real future traversal. A signature animation is not required. This scene registers no Ambient Life, reaction, audio or narrative behavior.

## Validation evidence

All scoped native tests pass: scene movement/collision/depth, World catalog, Double R exterior/location, location and traincar traversal, smoke (368 checks), and walkthrough (86 acquisitions). The final scene also passes its separate frozen-core audit. See [native results](validation/native-results.json) and final scene logs in `validation/`.

Coldstage passes all 133 runtime checks, including the station's 14 named routes driven by 100 real keyboard steps. The Selenium rehearsal timeout was raised to 60 seconds because its previous 15-second limit could not contain the complete walk; this changes test tooling, not the Engine. The [final run](validation/coldstage-final.json) retains unrelated existing visual requests. Double R's static reference remains pixel-unchanged; unrelated baselines were not approved or replaced.

The station's [scoped visual review](validation/scoped-visual-review.json) is **pass-with-notes**. The contact sheet was inspected first. An earlier full-size clean capture resolved a floor-seam concern, leading to the final bounded material refinement. Reception correctly hides the lower body from the staff side, and the office deliberately retains fewer details than Double R. Only the station's eight captures received a [new baseline](validation/baseline-approval.json), after the matching review record. The [final scoped pixel result](validation/pixel-final.json) is unchanged with `aiReviewNeeded: false`; no further screenshots were inspected afterward.

The [pixel audit](validation/pixel-audit.json) checks all 49,152 native cells: every displayed 5×5 block is exactly uniform, with zero mismatches. [native-256.png](native-256.png) is the exact 256×192 frame extracted without filtering; [native-clean.png](native-clean.png) and [native-debug.png](native-debug.png) are the 5× captures. Debug colors: red blocked cells, yellow access targets, cyan furniture depth edges, pale grid.

The pre-existing Vault mirror drift includes older missing Double R/world/traincar modules and differences in maps, connection data and the entry page. It is outside this content pass and is not treated as a material or World Engine limitation. Only the new station authoring modules and this evidence bundle are preserved in the Vault; broader integration remains validated in the current workspace. No deploy or broad synchronization was performed.
