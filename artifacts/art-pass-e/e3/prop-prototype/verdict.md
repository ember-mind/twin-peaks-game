# PROTOTYPE verdict — Blender-authored Roadhouse prop

Question: can one Blender-authored prop definition render in the Roadhouse and a
World Builder-style catalog without owning collision?

Verdict: **technical YES, visual NOT YET**.

- One `.blend` source produces high-resolution and native-size transparent PNGs.
- One frozen definition drives a Roadhouse placement and two catalog-preview instances.
- Collision remains owned by map rows; prototype only displays relative footprint metadata.
- Chrome/SwiftShader captures all three variants at 960x640.
- Astra scored hybrid `5/10`, ranked `BETTER` than current, below floor 7.
- One gap: chair backs lose upright wooden silhouette and read as low red blobs.

Variants:

- `A`: current native scene.
- `B`: raw Blender render, browser downsampling.
- `C`: 96x72 Blender render, nearest-neighbor hybrid.

Run one variant:

```bash
test/shot.sh roadhouse 7 8 up /tmp/prop-C.png \
  --page=test/roadhouse-prop-prototype.html --stop=C --stop-param=variant \
  --ready-prefix=TP-PROP-PROTOTYPE-READY --gpu=swiftshader
```

## Round 2

Verdict remains **technical YES, visual NOT YET**.

- Luna xhigh rebuilt the Blender source around exactly two inward-facing chairs.
- The native render is 48×36 with 46×35 occupied bounds and 13 hard colours.
- One definition drives the integrated Roadhouse placement and two catalog instances.
- Chair orientation is derived from position to table anchor with local `FRONT = -Y`;
  four-direction contact-sheet evidence confirms the authoring convention.
- Astra scored round 2 `6/10`, ranked `BETTER` than before, still below floor 7.
- One gap: the tabletop reads as a bright orange disc rather than the reference's dark
  wooden surface with a distinct shaded rim.

Decision: do not migrate Roadhouse props yet. Round 3 must fix tabletop value/material
grammar while preserving the clearer two-chair structure.
