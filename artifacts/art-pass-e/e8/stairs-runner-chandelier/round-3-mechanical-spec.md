# Round 3 mechanical spec — right-side staircase

- Native integer pixels and current palette only.
- Visible staircase flight box: x=208..255, y=40..127 (48×88), on room's right side. Keep locked logical contact metadata/cells unchanged; add only a 2 px dark contact cue over those original cells if required by test.
- Ten treads at y=48,56,64,72,80,88,96,104,112,120. Each tread is 44×7 px: 1 px `#b5864c` front highlight, 4 px `#65432d` face, 2 px `#3b2c24` riser. Tread left x increases by 1 px every two rows to imply rise toward upper-right.
- Stair runner spans x=224..241 on every tread. Each segment: 1 px `#b5864c` side borders, 14 px `#803338` center, 1 px `#aa5350` north highlight, 1 px `#4c2327` south shadow. Segments touch vertically: no gaps.
- Left rail follows points (207,126),(211,104),(215,82),(219,60),(223,38); right rail follows same +34 px x. Draw 3 px dark/wood/gold rails with posts at each point.
- Top landing x=220..255, y=32..47, framed in dark wood. Do not cover north hall door.
- Chandelier visible box centered x=144, y=10..45: chain at x=144; 42 px-wide curved arms; five distinct cream/light bulbs, symmetric. Move LIGHT_WARM_VARIATION anchor to same center.
- Entrance runner stays unchanged and visually separate. All other units, locks, ambient types, and protected files unchanged.
