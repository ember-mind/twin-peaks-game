# PROTOTYPE verdict — Blender-authored Roadhouse prop

Question: can one Blender-authored prop definition render in the Roadhouse and a
World Builder-style catalog without owning collision?

Final verdict: **technical YES, visual floor reached**.

## Round 1

- One `.blend` source produces high-resolution and native-size transparent PNGs.
- One frozen definition drives a Roadhouse placement and two catalog-preview instances.
- Collision remains owned by map rows; prototype only displays relative footprint metadata.
- Chrome/SwiftShader captures all three variants at 960x640.
- Astra scored hybrid `5/10`, ranked `BETTER` than current, below floor 7.
- One gap: chair backs lose upright wooden silhouette and read as low red blobs.

Variants:

- `A`: current native scene.
- `B`: current diagnostic Blender render.
- `C`: current 48×36 hard-palette render in reusable 64×48 bounds.

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

## Round 3 — final

Verdict: **technical YES, visual floor reached at 7/10**.

- Astra high changed only tabletop material bands and rim assignment in Blender.
- The 48×36 native render keeps the round-2 46×35 silhouette and uses explicit
  palettes of at most four useful tones per atomic prop.
- The table now reads as a dark wooden plane with a distinct shaded rim.
- Astra scored round 3 `7/10`, ranked `BETTER` than round 2.
- Remaining gap: chair backs remain squat and visually crowded, lacking the reference's
  tall, clearly separated wooden slats.

Stop condition reached, so round 4 did not run. Prototype proves one Blender-authored
definition can serve Roadhouse placement and two World Builder-style catalog instances
without moving collision ownership out of map rows. Treat result as prototype evidence,
not authorization for a production migration.
