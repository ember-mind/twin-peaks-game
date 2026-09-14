# World Builder prop-system handoff

## Proven by prototype

Reference-derived atomic PNG props can reconstruct a clearer Roadhouse and render through a catalog on the existing World Builder route. Prototype manifest contains 12 definitions; full scene uses 19 native-canvas instances and 23 planning-view instances. Collision and walkability remain owned by map rows.

Prototype sources:

- `assets/prototypes/direct-reference/roadhouse-props.prototype.json`
- `test/roadhouse-prop-prototype.html?variant=C`
- `world-builder.html?propPrototype=C`

Do not promote prototype scripts directly. Promote data contract, then implement it with production validation and tests.

## Required production contract

Separate reusable definition from placement:

```json
{
  "definitions": {
    "roadhouse.chair.red": {
      "atlas": "assets/props/roadhouse.png",
      "frame": [160, 48, 18, 30],
      "anchor": [9, 28],
      "footprint": [[0, 0]],
      "defaultLayer": "furniture"
    }
  },
  "instances": {
    "roadhouse-chair-01": {
      "propId": "roadhouse.chair.red",
      "sceneId": "roadhouse",
      "tx": 6.8,
      "ty": 7.65,
      "flipX": true,
      "layer": 6
    }
  }
}
```

Definition owns visual source, frame, anchor, optional footprint, default depth/layer, tags, and allowed transforms. Instance owns stable ID, scene, tile position, pixel offset, facing/flip, variant, and layer override.

## Builder behavior expected

1. Asset catalog loaded from real definition registry, grouped/searchable by tags.
2. Click or drag asset onto scene; tile snapping plus optional integer pixel offset.
3. Ghost preview before placement; selected footprint and anchor visible.
4. Select, move, duplicate, delete, flip/rotate only when definition permits it.
5. Undo/redo through existing draft/history system.
6. Full instance state visible in inspector. No hidden mutations.
7. Export/import through versioned changeset operations: create, upsert, delete prop instance. Stable IDs mandatory.
8. Runtime renderer draws atlas frames at integer scale, `imageSmoothingEnabled=false`, sorted deterministically by layer then depth foot.
9. Default World Builder behavior unchanged when prop tools unused.

## Ownership and validation

- Map rows remain authoritative for collision and walkability. Placing PNG never rewrites rows implicitly.
- Footprint is metadata used for selection, warnings, depth, and optional explicit collision edits.
- Empty footprint supports wall/ceiling decorations: neon, trophy, pendant, pay phone.
- Reject missing definitions, duplicate instance IDs, frames outside atlas, NaN/out-of-map coordinates, unsupported transforms, and invalid layer values.
- Warn or reject footprint overlap with doors, required interactions, and Cast Presence body tiles according to explicit policy.
- Roadhouse locks: map rows unchanged; south door unchanged; pay phone stays at `(8,5)`; stage stays north; every Cast Presence body tile remains walkable.

## Asset pipeline boundary

World Builder should consume finished runtime atlases and manifests. ImageGen/Blender source generation stays external. Keep high-resolution transparent masters beside source metadata; runtime uses reviewed pixel reductions. Do not auto-quantize during scene editing.

## Minimum acceptance tests

- Definition/instance schema round-trip and changeset dry-run.
- Create/move/flip/delete instance through browser UI; undo/redo each operation.
- Exact deterministic rendering order for overlapping props.
- Atlas frame bounds and missing-asset failures.
- No default-route regression.
- `node test/cast-continuity-validate.js`.
- `node test/act-4-flow.js` — 1611/1611.
- Existing World Builder unit/core/browser suites.
- Production smoke, walkthrough, retro-production, mobile-production before merge.

## Explicit non-goals for first production slice

- No embedded ImageGen or Blender.
- No arbitrary scaling or free rotation.
- No automatic collision painting.
- No animation editor.
- No migration of every existing procedural prop. Ship one Roadhouse vertical slice first.
