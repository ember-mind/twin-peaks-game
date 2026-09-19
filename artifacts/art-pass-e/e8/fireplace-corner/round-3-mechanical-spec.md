# Round 3 mechanical spec — stacked-stone hearth

- Native integer pixels; current stone, wood, red, fire, cream, and light tones only.
- Chimney/surround silhouette: x=120..167, y=16..81 (48×66 px), opaque and visually continuous behind bear, mantel, and firebox.
- Stone field: 8×6 px blocks with 1 px `#211e1c` mortar. Offset odd courses 4 px. Alternate faces deterministically between `#776957` and `#a28c6a`; each block gets a 1 px `#47423a` south edge and a 1–3 px light chip.
- Bear plaque/head bounding box: x=128..159, y=20..48. Plaque 30×27 px dark oval/stepped silhouette; bear face at least 22×20 px with distinct ears, brow, two eyes, muzzle, nose, mouth.
- Mantel: x=117..170, y=48..54; 54×7 px, dark 1 px keyline, 2 px gold/wood-light lip, 4 px wood-dark body.
- Firebox: x=127..160, y=54..77; 34×24 px. 3 px stone jambs, black 26×17 opening, five flame tongues across three heights using `#d77b37`, `#e9c582`, `#ffe7a6`; two dark logs at bottom.
- Hearth slab: x=122..165, y=77..82; 44×6 px, stepped stone edge and 2 px contact shadow.
- Keep chair/table geometry, rug, other units, contacts, ambient definitions, locks, and protected files unchanged.
