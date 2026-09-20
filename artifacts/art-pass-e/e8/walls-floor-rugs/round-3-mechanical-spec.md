# Round 3 mechanical spec — surface depth

- Work in native 1 px map-pixel grid; no blur, alpha wash, gradients, or subpixels.
- Floor boards: 48 px long x 8 px deep; alternate joint offset 24 px each row. Each board gets 1 px `#8b5c39` north bevel, 5 px `#65432d` face, 2 px `#3b2c24` south seam. Add one 8–16 px `#b5864c` grain stroke per board, never continuous across a joint.
- Depth bands: floor rows y=16–71 use base `#65432d`; y=72–119 brighten one step with sparse `#8b5c39`; y=120–175 use the full bevel recipe above. No hue changes.
- Wall/log borders: 8 px courses; 1 px `#8b5c39` crown, 5 px `#65432d` round face, 2 px `#3b2c24` underside. Posts remain 12 px wide with a 2 px dark right edge.
- Wide rugs: retain exact footprints. Use 2 px `#211e1c` outer keyline, 1 px `#b5864c` inner border, `#803338` field, and linked gold diamonds centered on an 8 px grid. Every diamond gets a 1 px `#e9c582` center and `#4c2327` shadow edge.
- Preserve entrance runner, prop geometry, lights, collisions, map, registry, Room 315, and protected files.
