# Round 4 mechanical spec — directional warm depth

- Current palette only; native opaque integer pixels. Keep fixture/source art and ambient definitions unchanged.
- Remove round-3 receiving marks from furniture, rugs, sign, pigeonholes, fireplace stone, and stair runner. Light marks may modify exposed wood floor only.
- Before props draw, add down-right cast shadows in `#211e1c`: fireplace x=160..178,y=70..86 tapering 18→4 px; chairs/table x=118..201,y=108..123 tapering 20→4 px; counter x=58..145,y=143..154 tapering 14→3 px; stairs x=206..259,y=126..139 tapering 16→3 px. Use horizontal 1 px scanlines with 1 px gaps, never solid polygons.
- Chandelier floor cone only: rows y=50..150, centered x=144. Half-width grows linearly 8→46 px. Within cone, add one 3×1 `#b5864c` stroke per 12×8 px cell and one 2×1 `#8b5c39` stroke per alternating cell; no visible outer boundary.
- Lamp/sconce receiving marks: narrow down-right wedges, maximum 20 px wide × 32 px tall, same sparse rule; exposed floor/wall only, never across props.
- Perimeter depth: inside x=16..31, x=256..271, y=16..31, and y=160..175, replace only every fourth existing wood-highlight pixel with `#3b2c24`. Do not cover doors.
- Floor reflections: retain broken gold strips, but maximum 2 px height and 18 px width; no vertical columns.
- All geometry/patterns, locks, and protected files stay unchanged.
