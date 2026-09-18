# Double R visual packet — fresh native baseline

This packet is a factual art-review handoff for the current worktree. It contains no production-code edits and makes no design recommendation.

## Primary frames

- [Fresh whole-room populated baseline, native 256×192](baseline-populated-native.png)
- [Fresh whole-room no-narrative architecture frame, native 256×192](architecture-no-narrative-native.png)
- [Fresh Act 4 alternate occupancy, native 256×192](act4-afternoon-native.png)

## Booth states

- [Occupied lower-left booth, native 64×48](booth-lower-left-occupied-native.png) · [nearest 4×](booth-lower-left-occupied-4x.png)
- [Empty/ready upper-left booth, native 64×48](booth-upper-left-empty-ready-native.png) · [nearest 4×](booth-upper-left-empty-ready-4x.png)
- [Empty/cleared lower-right booth, native 64×48](booth-lower-right-empty-cleared-native.png) · [nearest 4×](booth-lower-right-empty-cleared-4x.png)
- [Act 4 upper-right alternate crop, native](booth-upper-right-act4-native.png) · [nearest 4×](booth-upper-right-act4-4x.png)
- [Act 4 lower-right alternate crop, native](booth-lower-right-act4-native.png) · [nearest 4×](booth-lower-right-act4-4x.png)

All booth windows are 64×48 with exact coordinates recorded in [manifest.json](manifest.json). The occupied window is the canonical lower-left module `(x=24,y=128,w=64,h=48)`; its nearest 4× is a 256×192 point-filter enlargement.

## Approved reference

- [Approved whole-room golden copy, 5× 1280×960](approved-golden-whole-5x.png)
- [Approved lower-left booth reference crop, 5× 320×240](approved-golden-booth-lower-left-5x.png)

These are reference-only copies from `artifacts/diner-final-art/final.png`, not current captures.

## Provenance and concerns

See [manifest.json](manifest.json) for exact commands, dimensions, SHA-256 values, crop coordinates, fixture state and renderer/harness hashes. The current renderer and capture inputs are byte-unchanged from the prior craft packet’s recorded revision, but fresh whole-room captures are not byte-identical because the native shot includes timing-sensitive actor/ambient pixels (172 differing pixels in the populated frame; 13 in the no-narrative frame). The occupied 4× crop is pixel-identical to the prior packet. The Act 4 frame is a single alternate occupancy snapshot, not a motion or story claim.
