# Round 4 mechanical spec — reception mass and counter props

- Native integer pixels; current palette only. Keep round-3 sign and mountains.
- Counter silhouette: x=48..127, y=120..145 (80×26). Top slab x=46..129, y=119..125: 1 px `#211e1c` keyline, 2 px `#b5864c` top, 2 px `#8b5c39` front lip, 1 px `#3b2c24` shadow.
- Counter face x=48..127, y=125..144: `#3b2c24` frame, three inset panels exactly 22×13 px at x=52,77,102 and y=129. Panel face `#65432d`, 1 px `#8b5c39` north/left bevel, 1 px `#211e1c` south/right edge. Add 2 px contact shadow at y=144.
- Pigeonhole bank: x=50..81, y=88..119 (32×32). 4 columns × 4 rows; each cell 7×7 px with 1 px `#b5864c` frame and 5×5 `#211e1c` opening. Put 2×1 `#e9c582` key tag in alternating cells.
- Bell: box x=91..104, y=112..124. 12 px wide stepped gold dome, cream 3×2 glint, 2 px dark base, 2×2 top button. Bell sits on slab, never floats.
- Lamp: centered x=118. Base x=112..124, y=116..124; 1 px gold stem y=101..116; shade x=109..127, y=94..103 with cream field, light center, gold outline. Base rests on slab.
- Preserve actor walkability/visibility, original four-cell contact footprint, other units, bell ambient, locks, and protected files.
