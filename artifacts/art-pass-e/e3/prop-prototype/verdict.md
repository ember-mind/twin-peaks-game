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

Decision: do not migrate Roadhouse props yet. Next useful round changes chair geometry
only: taller exposed wooden backs, narrower red seats, stronger separation from table.

