# Double R final material and grounding pass

The previous diner-polish image is the authoritative before state. Furniture placement, generated map, collisions, counter, booths, stools, board, plants, signage geometry, character assets, native resolution and camera remain unchanged.

A shared contact-shadow painter uses three crisp native pixel rows with a tight dark core. It grounds diner actors, stools, booths, plant pot, chalkboard feet, counter base, glass case and service equipment. Additional narrow occlusion clusters reinforce upholstery seams and equipment-to-counter joints.

Materials use the existing palette: shorter vinyl highlights with darker seams; sharper metal edges; broken polished countertop highlights; tiny ceramic highlights; restrained cool reflection clusters over warm pies; a narrow front-glass tint. Sparse floor value changes and a few traffic-wear pixels are deterministic and clean. No smooth gradients or new decorations were added.

Nearby pendant light affects wood edges and countertop patches. The existing neon lettering is untouched; a faint stepped reflection falls onto adjacent wood. Standing actors receive a few warm hair/shoulder pixels only near diner lamps. A reusable 24×24 temporary canvas masks those highlights to the original sprite alpha, preserving the atlas silhouette, animation frames, scale and nearest-neighbor rendering. Other maps retain their existing actor rendering. Seated poses retain their geometry and gain tiny existing-palette accents.

The engine supplies optional map/world-position context to the sprite renderer. The interior kit exposes contactShadow and actorLight for reuse. Native tests verify compact integer-pixel shadow bounds, deterministic world-distance lighting, neutral entrance lighting, atlas integrity, layout and route preservation.

Validation: 54 native scripts pass, including 368 smoke checks and 86 campaign acquisitions. All 96 Coldstage runtime checks pass. Scoped visual approval is required before replacing the diner baseline; unrelated visual baselines remain outside this task.

Independent GPT-5.6-sol verdict: pass-with-notes. No material defects; preservation passes. Minor note: sprite warmth and neon reflection remain near the subtle end of visibility. Scoped review recorded before diner baseline replacement; final pixel diff unchanged.
