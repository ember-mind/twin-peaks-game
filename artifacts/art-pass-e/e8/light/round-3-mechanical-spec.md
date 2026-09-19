# Round 3 mechanical spec — warm light without disks

- Current palette only; opaque native integer pixels. No alpha, new hue, gradient, or full-scene wash.
- Remove every hard-edged circular/elliptical pool and all light-region fills wider than 3 contiguous pixels.
- Each fixture gets a `#ffe7a6` source core and 1 px `#e9c582` outline. Chandelier bulbs remain five separate sources; lamps/sconces retain distinct silhouettes.
- Receiving light uses sparse horizontal marks only: outer zone one 2×1 `#8b5c39` mark per 8×4 px cell; inner zone one 3×1 `#b5864c` mark per 6×3 px cell. Preserve at least 70% original surface pixels inside every lit zone so no pool boundary reads.
- Chandelier receiving zone: x=118..170, y=47..98. Fireplace zone: x=116..174, y=48..116. Desk lamp zone: x=100..136, y=96..146. Sconce zones: maximum 24×28 px each.
- Add narrow floor reflections only: chandelier x=137..151,y=151..153; desk lamp x=110..125,y=146..147; fire x=137..157,y=112..114. Each reflection alternates 3 px gold, 2 px wood, never solid.
- Contact shadows: 2 px `#211e1c` directly beneath counter, chair feet, hearth, stair bottom; no detached shadow.
- Other unit geometry/patterns and ambient definitions stay unchanged.
