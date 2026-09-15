# Round 3 builder evidence

Authored change: only the three tabletop meshes receive local dark wood band
materials. The top slab's side faces share the shaded rim material. Geometry,
camera, lights, two chair instances, candle, ashtray and pendant are unchanged.
No critic score or visual verdict is assigned here.

Blender MCP inspected the scene and inventory before editing. The saved source
is `assets/prototypes/roadhouse-table-set-prototype.blend`, scene
`TP_RoadhousePropPrototype`, namespace `TP_PROP_RoadhouseTableSet`.
The default `Scene` still contains Cube, Light and Camera unchanged.

## Export and reuse

- Diagnostic: 960×720 transparent Blender render.
- Native: fresh 48×36 render, occupied bounds 46×35 at (1,1).
- Asset: same native pixels centered at (8,6) in transparent 64×48 bounds.
- Before and after: actual 64×48 canvas crops at scene (104,96), native 1×,
  with no labels or debug bounds. The before uses round 2's asset through the
  same prototype painter. Its old CSS-resampled crop was not reused.
- Full browser evidence: 960×640 Chrome headless, SwiftShader, ready-title gate.
- Integrated preview: actual scene canvas, 256×192.
- Catalog preview: actual catalog canvas, 192×128, including both instances.
- The definition, instance records and one `drawProp` painter still serve all
  three placements; collision remains owned by map rows.

Native export uses a fresh matching Blender object-ID pass and explicit
per-object palettes. Round 2's prior global quantization exceeded the tone cap
(8 chair shades and 10 pendant shades); this mechanical export consolidates
shades while preserving the complete transparency silhouette byte-for-byte.
There are 14 opaque colors plus transparent, with alpha exclusively 0 or 255.

| Atomic prop | Useful tones |
| --- | --- |
| Table | 3: `#201714`, `#403023`, `#664833` |
| Chair | 4: `#0f0100`, `#6e1f00`, `#d4570a`, `#aa1300` |
| Candle | 3: `#501400`, `#8f2f00`, `#ffc4a7` |
| Ashtray | 3: `#6e1f00`, `#8f2f00`, `#b03900` |
| Pendant | 4: `#300900`, `#b34800`, `#e97f40`, `#ffc4a7` |

The Blender source retains two chair roots: west yaw +π/2 and east yaw −π/2.
Their calculated local FRONT dot direction-to-table is +1.25 for both.
The camera remains orthographic scale 3, at (4.8, −6.8, 9.8); draw bounds,
anchor, depth foot, footprint and orientation metadata are retained.
The existing four-direction chair contact sheet remains applicable because no
chair geometry or orientation changed.

Final metadata audit records floor-centre origin, stable name, projected pixel
draw bounds, relative footprint, depth foot, separate shadow-child reference,
`FRONT = -Y`, reuse flag and map-row collision ownership on every atomic and
prefab collection. Candle, ashtray and suspended pendant use namespaced,
non-rendering shadow-child placeholders so contact/environment lighting remains
separate from reusable body geometry.

## Verification

- `node --check assets/prototypes/direct-reference/browser/roadhouse-prop-prototype.js` passed.
- Syntax checks for the two evidence JavaScript helpers passed.
- `git diff --check` passed.
- Exact requested `test/shot.sh` command passed with `--gpu=swiftshader`.
- Fresh native alpha comparison against round 2: 0 changed silhouette pixels,
  0 partial-alpha pixels.
- Opened and visually inspected every new evidence PNG and both refreshed
  preview PNGs, including a nearest-neighbor enlargement for pixel inspection.
- Saved `.blend` independently reopened via Blender MCP's CLI tool to verify
  two inward-facing chairs, the unchanged camera and the round-3 definition.
- No production file changed; no commit or push performed by the builder.

Reproduction helpers: `round-3-build.py` (run via Blender MCP), then
`round-3-pixels.js` (hard palette and padding), and
`round-3-capture-canvases.js` (actual browser canvas extraction using the
repository capture driver). For a before extraction use
`TP_PROP_SOURCE_ROUND=2` and a temporary output path.
