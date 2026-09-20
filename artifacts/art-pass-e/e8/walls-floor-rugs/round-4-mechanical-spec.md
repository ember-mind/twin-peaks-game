# Round 4 mechanical spec — wall/floor plane separation

- Native integer pixels and current wood tones only.
- North wall plane: y=16..47, x=16..271. Replace horizontal boards there with 16 px vertical timber bays. Each bay: 2 px `#3b2c24` left seam, 11 px `#65432d` face, 2 px `#8b5c39` left highlight, 1 px `#211e1c` right keyline. Add one 6 px `#b5864c` vertical highlight per bay.
- Wall/floor boundary: y=46..49. Draw 1 px `#b5864c` lip at y=46, 2 px `#3b2c24` sill at y=47..48, 1 px `#211e1c` contact shadow at y=49.
- Floor plane: y=50..175. Use warm `#65432d` field. Horizontal depth seams at y=62, 78, 99, 126, 159; each 2 px, first row `#8b5c39`, second row `#3b2c24`.
- Perspective seams: vanishing point (144,50), bottom endpoints x=16,48,80,112,144,176,208,240,272 at y=176. Render each as a 1 px staircase computed by linear interpolation for every y=50..175, tone `#3b2c24`; add `#8b5c39` immediately right only for y>=99.
- Rugs keep round-3 footprints/patterns and occlude floor seams. Side/perimeter logs and all non-unit props stay unchanged.
