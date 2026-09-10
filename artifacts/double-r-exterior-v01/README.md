# Double R exterior v0.1

Static art-direction study for first Double R exterior. Built as one authored raster composition from approved interior reference. No World Engine integration, runtime changes, Ambient Life implementation, or baseline changes.

## Composition

Screen-parallel elevated view. Charcoal roof, cream/sage clapboard, burgundy framing, golden glazing, sparse asphalt forecourt, and one Double R roadside sign. Center wheel stop removed during cleanup; surface noise kept controlled. Entrance remains readable. Front glazing is a new authored assumption: existing cutaway interior proves entrance and side booth/service relationship, but does not prove full-height exterior windows.

Architectural inference uses the existing 14×10 interior footprint: centered double leaves at `(6,9)` and `(7,9)`, booth banks on both sides, service zone to north. Existing town 6×3 Double R footprint stays unchanged; reconciliation waits for exterior approval.

## Ambient Life anchors

- Continuous: vegetation movement.
- Intermittent: exterior lamp/sign behavior.
- Reactive: entrance door.
- Signature: Double R roadside sign.

None implemented.

## Engine learning

### REUSABLE AS-IS

Existing palette, pixel-cluster, shadow, and practical-light grammar.

### NEEDS GENERALIZATION

None justified yet. Native window/roof treatment needs evidence before abstraction.

### EXTERIOR-SPECIFIC

Building footprint, facade, parking/asphalt, roadside signs, and dusk-authored colors.

## Deliverables

- [Final raster study](double-r-exterior-v01-final.png)
- [Generation prompt](prompt.txt)
- [Cleanup prompt](cleanup-prompt.txt)

This is a concept raster, not a native 16×16 tile asset. Exact pixel-grid and camera parity remain unverified; no engine-ready claim.

## Validation

54 native tests pass. Coldstage runtime passes; diner, ambient, environment, and gesture groups remain pixel-unchanged. Existing town visual review evidence was inspected separately; portrait/player/dialogue diff scope remains outside this study and was not approved. Validation logs live under `validation/`.
